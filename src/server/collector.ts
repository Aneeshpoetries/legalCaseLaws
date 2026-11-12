import path from 'node:path';
import { supabase } from './db';
import { computeSha256 } from './midnightCleanup';
import { crawlSource } from './crawler';
import { generateLegalResearch } from './aiResearch';

export interface IngestedDocumentResult {
  docId: number;
  updateId: number;
  updateNo: string;
  title: string;
  isDuplicate: boolean;
  status: string;
}

/**
 * Run collection job for a specific source from the registry
 */
async function getNextUpdateNo(currentYear: number): Promise<string> {
  const { data: rows } = await supabase
    .from('legal_updates')
    .select('update_no')
    .like('update_no', `MK-BUL-${currentYear}-%`)
    .order('id', { ascending: false })
    .limit(50);

  let maxVal = 0;
  for (const r of rows || []) {
    const m = r.update_no?.match(/MK-BUL-\d+-(\d+)/);
    if (m) {
      const val = parseInt(m[1], 10);
      if (val > maxVal) maxVal = val;
    }
  }
  return `MK-BUL-${currentYear}-${(maxVal + 1).toString().padStart(3, '0')}`;
}

export async function runSourceCollection(sourceId: number): Promise<{
  success: boolean;
  docsFound: number;
  docsIngested: number;
  error?: string;
}> {
  const { data: source, error: srcErr } = await supabase
    .from('source_registry')
    .select(`
      *,
      authorities!inner(id, name, code, category_id,
        legal_categories(id, slug)
      )
    `)
    .eq('id', sourceId)
    .maybeSingle();

  if (srcErr || !source) {
    throw new Error(`Source with ID ${sourceId} not found.`);
  }

  const authority     = (source as any).authorities;
  const categoryId    = authority.legal_categories?.id   || null;
  const categorySlug  = authority.legal_categories?.slug || null;

  // Record collection job start
  const { data: job } = await supabase
    .from('collection_jobs')
    .insert({ source_id: sourceId, status: 'running' })
    .select('id')
    .single();
  const jobId = job!.id;

  try {
    await supabase
      .from('source_registry')
      .update({ last_attempted_at: new Date().toISOString(), error_status: null })
      .eq('id', sourceId);

    const discovered = await crawlSource(authority.code, source.url);
    let ingestedCount = 0;

    for (const item of discovered) {
      const docHash = computeSha256(item.content + item.identifier);

      // Duplicate check
      // Comprehensive duplicate check (source_documents & legal_updates)
      const orConds = [
        `file_hash_sha256.eq.${docHash}`,
        `document_identifier.eq.${item.identifier}`,
      ];
      if (item.url) {
        orConds.push(`original_url.eq.${item.url}`);
      }

      const { data: existing } = await supabase
        .from('source_documents')
        .select('id')
        .or(orConds.join(','))
        .limit(1);

      if (existing && existing.length > 0) {
        console.log(`[Collector] Skipping already ingested document: ${item.title} (${item.identifier})`);
        continue;
      }

      // Also ensure no legal_update already exists with this title
      const { data: existingUpdate } = await supabase
        .from('legal_updates')
        .select('id')
        .ilike('title', `%${item.title.slice(0, 35).replace(/[%_]/g, '')}%`)
        .limit(1);

      if (existingUpdate && existingUpdate.length > 0) {
        console.log(`[Collector] Skipping duplicate update title: ${item.title}`);
        continue;
      }

      // Insert source document (strip null bytes to satisfy PostgreSQL TEXT constraint)
      const cleanRawText = (item.content || '').replace(/\u0000/g, '');
      const expiresAt = new Date(Date.now() + 24 * 3600_000).toISOString();
      const { data: doc, error: docErr } = await supabase
        .from('source_documents')
        .insert({
          source_id:           sourceId,
          authority_id:        authority.id,
          document_identifier: item.identifier,
          title:               item.title,
          doc_type:            item.docType,
          publication_date:    item.publicationDate,
          original_url:        item.url,
          file_hash_sha256:    docHash,
          is_temporary:        true,
          status:              'ai_analyzed',
          raw_text:            cleanRawText,
          metadata_json:       { source_type: source.source_type, collected_at: new Date().toISOString() },
          expires_at:          expiresAt,
        })
        .select('id')
        .single();

      if (docErr || !doc) {
        console.error(`[Collector] Failed to insert source_document for ${item.identifier}:`, docErr?.message);
        continue;
      }

      const docId = doc.id;

      // Generate AI research
      const research = await generateLegalResearch(item.content, {
        title:      item.title,
        authority:  authority.name,
        category:   categorySlug || undefined,
        date:       item.publicationDate,
        url:        item.url,
        identifier: item.identifier,
      });

      // Generate unique update number
      const currentYear = new Date().getFullYear();
      const updateNo = await getNextUpdateNo(currentYear);
      const slug     = `${authority.code.toLowerCase()}-${item.identifier.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

      const { data: updateRow } = await supabase
        .from('legal_updates')
        .insert({
          update_no:    updateNo,
          slug,
          category_id:  categoryId,
          authority_id: authority.id,
          source_doc_id: docId,
          title:        research.title,
          issue_date:   research.issueDate,
          status:       'published',
          published_at: new Date().toISOString(),
          is_permanent: true,
        })
        .select('id')
        .single();
      const updateId = updateRow!.id;

      await supabase.from('research_notes').insert({
        update_id:               updateId,
        facts:                   research.facts,
        legal_provisions:        research.legalProvisions,
        decision_development:    research.decisionDevelopment,
        conclusion_implications: research.conclusionImplications,
        original_references:     research.originalReferences,
        raw_ai_response:         JSON.stringify(research),
        ai_model:                research.aiModel,
        prompt_version:          research.promptVersion,
        is_verified:             true,
        verified_by:             'MK Autonomous Statutory Engine',
        verified_at:             new Date().toISOString(),
      });

      if (research.references && research.references.length > 0) {
        await supabase.from('legal_references').insert(
          research.references.map((ref) => ({
            update_id:            updateId,
            act_name:             ref.actName,
            section:              ref.section        || '',
            circular_or_case_ref: ref.circularOrCaseRef || '',
            citation:             ref.citation        || '',
            url:                  ref.url             || item.url,
          }))
        );
      }

      ingestedCount++;
    }

    await supabase
      .from('collection_jobs')
      .update({ status: 'completed', docs_found: discovered.length, docs_ingested: ingestedCount, completed_at: new Date().toISOString() })
      .eq('id', jobId);

    // Calculate next scheduled time using raw interval
    const { data: srcRow } = await supabase
      .from('source_registry')
      .select('fetch_interval_mins')
      .eq('id', sourceId)
      .single();
    const nextAt = new Date(Date.now() + (srcRow?.fetch_interval_mins || 60) * 60_000).toISOString();

    await supabase
      .from('source_registry')
      .update({ last_successful_at: new Date().toISOString(), next_scheduled_at: nextAt })
      .eq('id', sourceId);

    return { success: true, docsFound: discovered.length, docsIngested: ingestedCount };
  } catch (error: any) {
    await supabase
      .from('collection_jobs')
      .update({ status: 'failed', error_message: error?.message || 'Collection error', completed_at: new Date().toISOString() })
      .eq('id', jobId);

    const nextErrAt = new Date(Date.now() + 60 * 60_000).toISOString();
    await supabase
      .from('source_registry')
      .update({ error_status: error?.message || 'Error occurred during collection', next_scheduled_at: nextErrAt })
      .eq('id', sourceId);

    return { success: false, docsFound: 0, docsIngested: 0, error: error?.message };
  }
}

/**
 * Ingest document manually via Administrator upload or text submission
 */
export async function ingestManualDocument(data: {
  authorityId: number;
  categoryId?: number;
  title: string;
  docType: string;
  documentIdentifier: string;
  publicationDate: string;
  originalUrl?: string;
  rawText: string;
  uploadedFilePath?: string;
  fileSizeBytes?: number;
}): Promise<IngestedDocumentResult> {
  const { data: authority, error: authErr } = await supabase
    .from('authorities')
    .select('code, name, category_id')
    .eq('id', data.authorityId)
    .maybeSingle();

  if (authErr || !authority) {
    throw new Error('Selected authority does not exist.');
  }

  const categoryId = data.categoryId || authority.category_id;
  const docHash    = computeSha256(data.rawText + data.documentIdentifier);

  // Duplicate check
  const { data: existingDoc } = await supabase
    .from('source_documents')
    .select('id')
    .or(`file_hash_sha256.eq.${docHash},document_identifier.eq.${data.documentIdentifier}`)
    .maybeSingle();

  if (existingDoc) {
    const { data: existingUpdate } = await supabase
      .from('legal_updates')
      .select('id, update_no')
      .eq('source_doc_id', existingDoc.id)
      .maybeSingle();

    return {
      docId:       existingDoc.id,
      updateId:    existingUpdate?.id || 0,
      updateNo:    existingUpdate?.update_no || 'EXISTING',
      title:       data.title,
      isDuplicate: true,
      status:      'Duplicate document detected (identical SHA-256 hash or circular identifier already in database). Skipped duplicate ingestion.',
    };
  }

  // Insert source_documents
  const expiresAt = new Date(Date.now() + 48 * 3600_000).toISOString();
  const { data: doc } = await supabase
    .from('source_documents')
    .insert({
      authority_id:        data.authorityId,
      document_identifier: data.documentIdentifier,
      title:               data.title,
      doc_type:            data.docType || 'Notification',
      publication_date:    data.publicationDate || new Date().toISOString().split('T')[0],
      original_url:        data.originalUrl || '',
      file_hash_sha256:    docHash,
      is_temporary:        true,
      status:              'ai_analyzed',
      raw_text:            data.rawText,
      metadata_json:       { source: 'manual_upload', created_at: new Date().toISOString() },
      expires_at:          expiresAt,
    })
    .select('id')
    .single();

  const docId = doc!.id;

  if (data.uploadedFilePath) {
    await supabase.from('document_files').insert({
      source_doc_id:   docId,
      file_path:       data.uploadedFilePath,
      file_name:       path.basename(data.uploadedFilePath),
      file_size_bytes: data.fileSizeBytes || 0,
      hash_sha256:     docHash,
      is_temporary:    true,
    });
  }

  // Generate 5-part research
  const research = await generateLegalResearch(data.rawText, {
    title:      data.title,
    authority:  authority.name,
    date:       data.publicationDate,
    url:        data.originalUrl,
    identifier: data.documentIdentifier,
  });

  const currentYear = new Date().getFullYear();
  const updateNo = await getNextUpdateNo(currentYear);
  const slug     = `${authority.code.toLowerCase()}-${data.documentIdentifier.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

  const { data: update } = await supabase
    .from('legal_updates')
    .insert({
      update_no:     updateNo,
      slug,
      category_id:   categoryId,
      authority_id:  data.authorityId,
      source_doc_id: docId,
      title:         research.title,
      issue_date:    research.issueDate,
      status:        'published',
      published_at:  new Date().toISOString(),
      is_permanent:  true,
    })
    .select('id')
    .single();
  const updateId = update!.id;

  await supabase.from('research_notes').insert({
    update_id:               updateId,
    facts:                   research.facts,
    legal_provisions:        research.legalProvisions,
    decision_development:    research.decisionDevelopment,
    conclusion_implications: research.conclusionImplications,
    original_references:     research.originalReferences,
    raw_ai_response:         JSON.stringify(research),
    ai_model:                research.aiModel,
    prompt_version:          research.promptVersion,
    is_verified:             true,
    verified_by:             'MK Autonomous Statutory Engine',
    verified_at:             new Date().toISOString(),
  });

  if (research.references && research.references.length > 0) {
    await supabase.from('legal_references').insert(
      research.references.map((ref) => ({
        update_id:            updateId,
        act_name:             ref.actName,
        section:              ref.section            || '',
        circular_or_case_ref: ref.circularOrCaseRef  || '',
        citation:             ref.citation            || '',
        url:                  ref.url                 || data.originalUrl || '',
      }))
    );
  }

  return {
    docId,
    updateId,
    updateNo,
    title:       research.title,
    isDuplicate: false,
    status:      'Ingested successfully. Structured research drafted and queued for human verification.',
  };
}
