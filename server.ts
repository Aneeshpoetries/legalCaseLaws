import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';
import multer from 'multer';
import { supabase } from './src/server/db';
import {
  getStorageOverview,
  runMidnightCleanup,
  getAsiaKolkataTime,
  formatKolkataIso,
  computeSha256,
} from './src/server/midnightCleanup';
import {
  runSourceCollection,
  ingestManualDocument,
} from './src/server/collector';
import {
  generateLegalResearch,
  regenerateResearchSection,
} from './src/server/aiResearch';

dotenv.config();

process.on('uncaughtException', (err) => {
  console.error('[SERVER] Caught Unhandled Exception:', err.message || err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[SERVER] Caught Unhandled Rejection:', reason);
});

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Ensure upload directory exists (use writable /tmp on Vercel Serverless)
const UPLOAD_DIR = process.env.VERCEL
  ? path.resolve('/tmp', 'uploads')
  : path.resolve(process.cwd(), 'public/uploads');
try {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
} catch (err: any) {
  console.warn('[SERVER] Could not create upload dir:', err?.message);
}

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => { cb(null, UPLOAD_DIR); },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(UPLOAD_DIR));

// Helper: Normalize Supabase joined relation which can be an object or an array of objects
function toObj<T = any>(val: any): T {
  if (!val) return {} as T;
  if (Array.isArray(val)) return (val[0] || {}) as T;
  return val as T;
}

// ==========================================
// AUTH HELPERS
// ==========================================
// Hardcoded admin — works without DB tables
const HARDCODED_ADMIN_USER = { id: 1, email: 'admin@mklegal.in', name: 'Manish Khandelwal', role: 'admin' };

async function getAuthUser(req: Request) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [userId, email] = decoded.split(':');
    // Check hardcoded admin first
    if (Number(userId) === HARDCODED_ADMIN_USER.id && email === HARDCODED_ADMIN_USER.email) {
      return HARDCODED_ADMIN_USER;
    }
    // Fallback to DB
    const { data: user } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('id', Number(userId))
      .eq('email', email)
      .maybeSingle();
    return user || null;
  } catch {
    return null;
  }
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = await getAuthUser(req);
  if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
    return res.status(401).json({ error: 'Unauthorized: Admin or Editor credentials required.' });
  }
  (req as any).user = user;
  next();
}

// ==========================================
// REST API ROUTES
// ==========================================

// 1. Health & Server Info
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    platform: 'MK Professional Legal Bulletin',
    publisher: 'Manish Khandelwal & Co.',
    timezone: 'Asia/Kolkata',
    currentTime: formatKolkataIso(),
  });
});

// 2. Authentication
// Hardcoded fallback admin — works even when Supabase tables are not yet created
const HARDCODED_ADMIN = {
  id: 1,
  email: 'admin@mklegal.in',
  name: 'Manish Khandelwal',
  role: 'admin',
  password_hash: 'mklegal2026',
};

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  // Try hardcoded admin first (works without DB tables)
  if (email === HARDCODED_ADMIN.email && password === HARDCODED_ADMIN.password_hash) {
    const token = Buffer.from(`${HARDCODED_ADMIN.id}:${HARDCODED_ADMIN.email}`).toString('base64');
    return res.json({ token, user: { id: HARDCODED_ADMIN.id, email: HARDCODED_ADMIN.email, name: HARDCODED_ADMIN.name, role: HARDCODED_ADMIN.role } });
  }

  // Fallback: try database
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, email, name, role, password_hash')
      .eq('email', email)
      .maybeSingle();

    if (!user || user.password_hash !== password) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = Buffer.from(`${user.id}:${user.email}`).toString('base64');
    return res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated.' });
  res.json({ user });
});

// 3. Categories (Dynamic)
app.get('/api/categories', async (_req, res) => {
  const { data: categories } = await supabase
    .from('legal_categories')
    .select(`
      *,
      legal_updates!left(id, status)
    `)
    .order('display_order', { ascending: true });

  // Compute published_updates_count per category
  const result = (categories || []).map((c: any) => ({
    ...c,
    published_updates_count: (c.legal_updates || []).filter((u: any) => u.status === 'published').length,
    legal_updates: undefined,
  }));

  res.json(result);
});

app.post('/api/categories', requireAdmin, async (req, res) => {
  const { name, slug, description, icon } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'Name and slug are required.' });

  // Get next display_order
  const { data: maxRow } = await supabase
    .from('legal_categories')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from('legal_categories')
    .insert({
      name,
      slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      description: description || '',
      icon: icon || 'Scale',
      display_order: (maxRow?.display_order || 0) + 1,
    })
    .select('id')
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ id: data.id, message: 'Category added successfully.' });
});

// 4. Authorities (Dynamic)
app.get('/api/authorities', async (_req, res) => {
  const { data: authorities } = await supabase
    .from('authorities')
    .select(`
      *,
      legal_categories(name, slug),
      legal_updates!left(id, status),
      source_registry!left(id)
    `)
    .order('name', { ascending: true });

  const result = (authorities || []).map((a: any) => ({
    ...a,
    category_name:    a.legal_categories?.name || null,
    category_slug:    a.legal_categories?.slug || null,
    published_count:  (a.legal_updates || []).filter((u: any) => u.status === 'published').length,
    sources_count:    (a.source_registry || []).length,
    legal_categories: undefined,
    legal_updates:    undefined,
    source_registry:  undefined,
  }));

  res.json(result);
});

app.post('/api/authorities', requireAdmin, async (req, res) => {
  const { code, name, category_id, website_url, jurisdiction } = req.body;
  if (!code || !name) return res.status(400).json({ error: 'Authority Code and Name are required.' });

  const { data, error } = await supabase
    .from('authorities')
    .insert({
      code: code.toUpperCase(),
      name,
      category_id: category_id || null,
      website_url: website_url || '',
      jurisdiction: jurisdiction || 'India',
    })
    .select('id')
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ id: data.id, message: 'Authority added successfully.' });
});

// 5. Source Registry
app.get('/api/sources', async (_req, res) => {
  const { data: sources } = await supabase
    .from('source_registry')
    .select(`
      *,
      authorities!inner(name, code,
        legal_categories(name)
      )
    `)
    .order('id', { ascending: false });

  const result = (sources || []).map((s: any) => ({
    ...s,
    authority_name: s.authorities?.name,
    authority_code: s.authorities?.code,
    category_name:  s.authorities?.legal_categories?.name,
    authorities:    undefined,
  }));

  res.json(result);
});

app.post('/api/sources', requireAdmin, async (req, res) => {
  const { authority_id, name, source_type, url, fetch_interval_mins, config_json } = req.body;
  if (!authority_id || !name || !url) {
    return res.status(400).json({ error: 'Authority, Name, and URL are required.' });
  }

  const { data, error } = await supabase
    .from('source_registry')
    .insert({
      authority_id,
      name,
      source_type: source_type || 'crawl',
      url,
      fetch_interval_mins: fetch_interval_mins || 60,
      config_json: config_json || {},
    })
    .select('id')
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ id: data.id, message: 'Source registered successfully.' });
});

app.put('/api/sources/:id/toggle', requireAdmin, async (req, res) => {
  const { data: source } = await supabase
    .from('source_registry')
    .select('is_active')
    .eq('id', req.params.id)
    .maybeSingle();

  if (!source) return res.status(404).json({ error: 'Source not found.' });

  const newStatus = !source.is_active;
  await supabase.from('source_registry').update({ is_active: newStatus }).eq('id', req.params.id);
  res.json({ message: `Source ${newStatus ? 'activated' : 'deactivated'}.`, is_active: newStatus });
});

app.post('/api/sources/:id/crawl', requireAdmin, async (req, res) => {
  try {
    const result = await runSourceCollection(Number(req.params.id));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Ingested Documents Management
app.get('/api/documents', async (_req, res) => {
  const { data: docs } = await supabase
    .from('source_documents')
    .select(`
      *,
      authorities!inner(name, code),
      legal_updates!left(id, update_no, status)
    `)
    .order('id', { ascending: false })
    .limit(100);

  const result = (docs || []).map((d: any) => {
    const up = toObj(d.legal_updates);
    return {
      ...d,
      authority_name:  d.authorities?.name,
      authority_code:  d.authorities?.code,
      update_id:       up.id || null,
      update_no:       up.update_no || null,
      update_status:   up.status || null,
      authorities:     undefined,
      legal_updates:   undefined,
    };
  });

  res.json(result);
});

app.post('/api/documents/manual', requireAdmin, upload.single('document_file'), async (req, res) => {
  try {
    const {
      authority_id, category_id, title, doc_type,
      document_identifier, publication_date, original_url, raw_text,
    } = req.body;

    if (!authority_id || !title || !document_identifier) {
      return res.status(400).json({ error: 'Authority, Title, and Document Identifier are required.' });
    }

    let textContent = raw_text || '';
    let filePath: string | undefined;
    let fileSize: number | undefined;

    if (req.file) {
      filePath  = req.file.path;
      fileSize  = req.file.size;
      if (!textContent) {
        textContent = `[Uploaded Document: ${req.file.originalname}]\nTitle: ${title}\nReference Identifier: ${document_identifier}\nDate: ${publication_date}`;
      }
    }

    if (!textContent.trim()) {
      return res.status(400).json({ error: 'Please provide document text or upload a document file.' });
    }

    const result = await ingestManualDocument({
      authorityId:         Number(authority_id),
      categoryId:          category_id ? Number(category_id) : undefined,
      title,
      docType:             doc_type || 'Notification',
      documentIdentifier:  document_identifier,
      publicationDate:     publication_date || new Date().toISOString().split('T')[0],
      originalUrl:         original_url,
      rawText:             textContent,
      uploadedFilePath:    filePath,
      fileSizeBytes:       fileSize,
    });

    res.json(result);
  } catch (err: any) {
    console.error('Manual ingestion error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 7. AI Legal Research Queue & Management
app.get('/api/research/queue', async (_req, res) => {
  const { data: queue } = await supabase
    .from('legal_updates')
    .select(`
      id, update_no, slug, title, issue_date, status, created_at,
      authorities!inner(name, code),
      legal_categories(name, slug),
      source_documents!left(id, document_identifier, original_url, file_hash_sha256),
      research_notes!left(ai_model, is_verified, verified_by)
    `)
    .in('status', ['pending_review', 'draft'])
    .order('id', { ascending: false });

  const result = (queue || []).map((u: any) => {
    const src = toObj(u.source_documents);
    const rn = toObj(u.research_notes);
    return {
      update_id:          u.id,
      update_no:          u.update_no,
      slug:               u.slug,
      title:              u.title,
      issue_date:         u.issue_date,
      status:             u.status,
      created_at:         u.created_at,
      authority_name:     u.authorities?.name,
      authority_code:     u.authorities?.code,
      category_name:      u.legal_categories?.name,
      category_slug:      u.legal_categories?.slug,
      doc_id:             src.id,
      document_identifier: src.document_identifier,
      original_url:       src.original_url,
      file_hash_sha256:   src.file_hash_sha256,
      ai_model:           rn.ai_model,
      is_verified:        rn.is_verified,
      verified_by:        rn.verified_by,
    };
  });

  res.json(result);
});

app.get('/api/research/:updateId', async (req, res) => {
  const { data: update } = await supabase
    .from('legal_updates')
    .select(`
      *,
      authorities!inner(name, code, website_url),
      legal_categories(name, slug),
      source_documents!left(document_identifier, doc_type, original_url, raw_text, file_hash_sha256),
      research_notes!left(facts, legal_provisions, decision_development, conclusion_implications,
                          original_references, ai_model, prompt_version, is_verified, verified_by, verified_at)
    `)
    .eq('id', Number(req.params.updateId))
    .maybeSingle();

  if (!update) return res.status(404).json({ error: 'Legal update not found.' });

  const { data: references } = await supabase
    .from('legal_references')
    .select('*')
    .eq('update_id', Number(req.params.updateId));

  const src  = toObj((update as any).source_documents);
  const rn   = toObj((update as any).research_notes);
  const auth = (update as any).authorities            || {};
  const cat  = (update as any).legal_categories       || {};

  res.json({
    ...(update as any),
    authority_name:     auth.name,
    authority_code:     auth.code,
    authority_url:      auth.website_url,
    category_name:      cat.name,
    category_slug:      cat.slug,
    document_identifier: src.document_identifier,
    doc_type:           src.doc_type,
    original_url:       src.original_url,
    raw_text:           src.raw_text,
    file_hash_sha256:   src.file_hash_sha256,
    ...rn,
    references:         references || [],
    authorities:        undefined,
    legal_categories:   undefined,
    source_documents:   undefined,
    research_notes:     undefined,
  });
});

app.put('/api/research/:updateId', requireAdmin, async (req, res) => {
  const { title, facts, legal_provisions, decision_development, conclusion_implications, original_references } = req.body;
  const updateId = Number(req.params.updateId);
  const user     = (req as any).user;

  try {
    if (title) {
      await supabase
        .from('legal_updates')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', updateId);
    }

    await supabase
      .from('research_notes')
      .update({
        facts,
        legal_provisions,
        decision_development,
        conclusion_implications,
        original_references,
        updated_at: new Date().toISOString(),
      })
      .eq('update_id', updateId);

    await supabase.from('review_logs').insert({
      update_id:   updateId,
      reviewer_id: user.id,
      action:      'edited',
      comments:    'Administrator revised research content.',
    });

    res.json({ message: 'Research note updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/research/:updateId/regenerate-section', requireAdmin, async (req, res) => {
  const { sectionKey, instruction } = req.body;
  const updateId = Number(req.params.updateId);

  try {
    const { data: note } = await supabase
      .from('research_notes')
      .select('*, legal_updates!inner(source_doc_id)')
      .eq('update_id', updateId)
      .maybeSingle();

    if (!note) return res.status(404).json({ error: 'Research note not found.' });

    // Fetch raw_text if available
    let rawText = '';
    const srcDocId = (note as any).legal_updates?.source_doc_id;
    if (srcDocId) {
      const { data: srcDoc } = await supabase
        .from('source_documents')
        .select('raw_text')
        .eq('id', srcDocId)
        .maybeSingle();
      rawText = srcDoc?.raw_text || '';
    }

    const currentText = (note as any)[sectionKey] || '';
    const revisedText = await regenerateResearchSection(sectionKey, currentText, rawText, instruction);

    await supabase
      .from('research_notes')
      .update({ [sectionKey]: revisedText, updated_at: new Date().toISOString() })
      .eq('update_id', updateId);

    res.json({ sectionKey, revisedText });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/research/:updateId/approve', requireAdmin, async (req, res) => {
  const updateId = Number(req.params.updateId);
  const user     = (req as any).user;

  try {
    const now = new Date().toISOString();

    await supabase
      .from('legal_updates')
      .update({ status: 'published', published_at: now, updated_at: now })
      .eq('id', updateId);

    await supabase
      .from('research_notes')
      .update({ is_verified: true, verified_by: user.name, verified_at: now })
      .eq('update_id', updateId);

    // Promote associated source document to permanent
    const { data: updateRow } = await supabase
      .from('legal_updates')
      .select('source_doc_id')
      .eq('id', updateId)
      .maybeSingle();

    if (updateRow?.source_doc_id) {
      await supabase
        .from('source_documents')
        .update({ is_temporary: false, status: 'published', expires_at: null })
        .eq('id', updateRow.source_doc_id);

      await supabase
        .from('document_files')
        .update({ is_temporary: false, expires_at: null })
        .eq('source_doc_id', updateRow.source_doc_id);
    }

    await supabase.from('review_logs').insert({
      update_id:   updateId,
      reviewer_id: user.id,
      action:      'approved',
      comments:    'Approved and published to MK Professional Legal Bulletin.',
    });

    await supabase.from('publication_logs').insert({
      update_id:    updateId,
      published_by: user.id,
      action:       'published',
      details:      'Verified legal bulletin live on public website.',
    });

    res.json({ message: 'Update approved and published successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/research/:updateId/reject', requireAdmin, async (req, res) => {
  const updateId = Number(req.params.updateId);
  const { reason } = req.body;
  const user     = (req as any).user;

  try {
    await supabase
      .from('legal_updates')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', updateId);

    await supabase.from('review_logs').insert({
      update_id:   updateId,
      reviewer_id: user.id,
      action:      'rejected',
      comments:    reason || 'Rejected by editor',
    });

    res.json({ message: 'Update rejected and archived.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Public Legal Updates & Search
app.get('/api/updates', async (req, res) => {
  const { q, category, authority, dateFrom, dateTo, page = '1', limit = '12' } = req.query;
  const pageNum  = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
  const offset   = (pageNum - 1) * limitNum;

  let query = supabase
    .from('legal_updates')
    .select(`
      id, update_no, slug, title, issue_date, published_at, view_count,
      authorities!inner(name, code),
      legal_categories(name, slug),
      source_documents!left(document_identifier, original_url, file_hash_sha256),
      research_notes!left(facts, legal_provisions, decision_development, conclusion_implications, original_references, is_verified, verified_by)
    `, { count: 'exact' })
    .eq('status', 'published')
    .order('issue_date', { ascending: false })
    .order('id',         { ascending: false })
    .range(offset, offset + limitNum - 1);

  if (q && typeof q === 'string' && q.trim()) {
    query = query.or(`title.ilike.%${q.trim()}%,update_no.ilike.%${q.trim()}%`);
  }
  if (category && typeof category === 'string' && category.trim()) {
    query = query.eq('legal_categories.slug', category.trim());
  }
  if (authority && typeof authority === 'string' && authority.trim()) {
    query = query.eq('authorities.code', authority.trim());
  }
  if (dateFrom && typeof dateFrom === 'string') {
    query = query.gte('issue_date', dateFrom);
  }
  if (dateTo && typeof dateTo === 'string') {
    query = query.lte('issue_date', dateTo);
  }

  const { data: updates, count: totalCount } = await query;

  const result = (updates || []).map((u: any) => {
    const src = toObj(u.source_documents);
    const rn = toObj(u.research_notes);
    return {
      ...u,
      authority_name:     u.authorities?.name,
      authority_code:     u.authorities?.code,
      category_name:      u.legal_categories?.name,
      category_slug:      u.legal_categories?.slug,
      document_identifier: src.document_identifier,
      original_url:       src.original_url,
      file_hash_sha256:   src.file_hash_sha256,
      facts:              rn.facts,
      legal_provisions:   rn.legal_provisions,
      decision_development: rn.decision_development,
      conclusion_implications: rn.conclusion_implications,
      original_references: rn.original_references,
      is_verified:        rn.is_verified,
      verified_by:        rn.verified_by,
      authorities:        undefined,
      legal_categories:   undefined,
      source_documents:   undefined,
      research_notes:     undefined,
    };
  });

  res.json({
    updates: result,
    pagination: {
      total:      totalCount || 0,
      page:       pageNum,
      limit:      limitNum,
      totalPages: Math.ceil((totalCount || 0) / limitNum),
    },
  });
});

app.get('/api/updates/:slug', async (req, res) => {
  const { data: update } = await supabase
    .from('legal_updates')
    .select(`
      *,
      authorities!inner(name, code, website_url),
      legal_categories(name, slug),
      source_documents!left(document_identifier, doc_type, original_url, file_hash_sha256),
      research_notes!left(facts, legal_provisions, decision_development, conclusion_implications,
                          original_references, ai_model, prompt_version, is_verified, verified_by, verified_at)
    `)
    .eq('slug', req.params.slug)
    .maybeSingle();

  if (!update) return res.status(404).json({ error: 'Legal update not found.' });

  // Increment view count
  await supabase
    .from('legal_updates')
    .update({ view_count: ((update as any).view_count || 0) + 1 })
    .eq('id', (update as any).id);

  const { data: references } = await supabase
    .from('legal_references')
    .select('*')
    .eq('update_id', (update as any).id);

  const src  = toObj((update as any).source_documents);
  const rn   = toObj((update as any).research_notes);
  const auth = toObj((update as any).authorities);
  const cat  = toObj((update as any).legal_categories);

  res.json({
    ...(update as any),
    authority_name:     auth.name,
    authority_code:     auth.code,
    authority_url:      auth.website_url,
    category_name:      cat.name,
    category_slug:      cat.slug,
    document_identifier: src.document_identifier,
    doc_type:           src.doc_type,
    original_url:       src.original_url,
    file_hash_sha256:   src.file_hash_sha256,
    ...rn,
    references:         references || [],
    authorities:        undefined,
    legal_categories:   undefined,
    source_documents:   undefined,
    research_notes:     undefined,
  });
});

app.post('/api/updates/:id/unpublish', requireAdmin, async (req, res) => {
  const { reason } = req.body;
  const user = (req as any).user;

  try {
    await supabase
      .from('legal_updates')
      .update({ status: 'draft', updated_at: new Date().toISOString() })
      .eq('id', Number(req.params.id));

    await supabase.from('publication_logs').insert({
      update_id:    Number(req.params.id),
      published_by: user.id,
      action:       'unpublished',
      details:      reason || 'Unpublished by editor',
    });

    res.json({ message: 'Update unpublished successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Daily Bulletin Engine
app.get('/api/bulletins', async (req, res) => {
  const targetDate = (req.query.date as string) || new Date().toISOString().split('T')[0];

  const { data: updates } = await supabase
    .from('legal_updates')
    .select(`
      id, update_no, slug, title, issue_date, published_at,
      authorities!inner(name, code),
      legal_categories(name, slug, display_order),
      source_documents!left(document_identifier, original_url),
      research_notes!left(facts, legal_provisions, decision_development, conclusion_implications, original_references)
    `)
    .eq('status', 'published')
    .or(`issue_date.eq.${targetDate},published_at.gte.${targetDate}T00:00:00,published_at.lte.${targetDate}T23:59:59`)
    .order('id', { ascending: true });

  const flat = (updates || []).map((u: any) => {
    const src = toObj(u.source_documents);
    const rn = toObj(u.research_notes);
    return {
      ...u,
      authority_name: u.authorities?.name,
      authority_code: u.authorities?.code,
      category_name:  u.legal_categories?.name,
      category_slug:  u.legal_categories?.slug,
      display_order:  u.legal_categories?.display_order,
      document_identifier: src.document_identifier,
      original_url:   src.original_url,
      facts:          rn.facts,
      legal_provisions: rn.legal_provisions,
      decision_development: rn.decision_development,
      conclusion_implications: rn.conclusion_implications,
      original_references: rn.original_references,
      authorities:     undefined,
      legal_categories: undefined,
      source_documents: undefined,
      research_notes:  undefined,
    };
  });

  // Group category-wise
  const categoryGroups: Record<string, any> = {};
  flat.forEach((item: any) => {
    const catName = item.category_name || 'General';
    if (!categoryGroups[catName]) {
      categoryGroups[catName] = { category: catName, slug: item.category_slug || 'general', items: [] };
    }
    categoryGroups[catName].items.push(item);
  });

  // Group authority-wise
  const authorityGroups: Record<string, any> = {};
  flat.forEach((item: any) => {
    const authName = item.authority_name || 'Regulatory Body';
    if (!authorityGroups[authName]) {
      authorityGroups[authName] = { authority: authName, code: item.authority_code || 'AUTH', items: [] };
    }
    authorityGroups[authName].items.push(item);
  });

  res.json({
    date:           targetDate,
    totalUpdates:   flat.length,
    updates:        flat,
    categoryGroups: Object.values(categoryGroups),
    authorityGroups: Object.values(authorityGroups),
    publisher:      'Manish Khandelwal & Co.',
  });
});

// 10. Storage Lifecycle & Midnight Cleanup Management
app.get('/api/storage/overview', async (_req, res) => {
  const overview = await getStorageOverview();
  res.json(overview);
});

app.post('/api/storage/cleanup', requireAdmin, async (_req, res) => {
  const result = await runMidnightCleanup(true);
  res.json(result);
});

app.get('/api/storage/policies', async (_req, res) => {
  const { data: policies } = await supabase
    .from('retention_policies')
    .select('*')
    .order('id', { ascending: true });
  res.json(policies || []);
});

app.put('/api/storage/policies/:id', requireAdmin, async (req, res) => {
  const { retention_hours, is_active } = req.body;
  try {
    await supabase
      .from('retention_policies')
      .update({
        retention_hours,
        is_active: is_active !== undefined ? Boolean(is_active) : true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', Number(req.params.id));
    res.json({ message: 'Retention policy updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/storage/cleanup-logs', async (_req, res) => {
  const { data: logs } = await supabase
    .from('cleanup_logs')
    .select('*')
    .order('id', { ascending: false })
    .limit(50);
  res.json(logs || []);
});

// 11. Dashboard Overview Metrics
app.get('/api/analytics', async (_req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const [
    { count: totalPublished },
    { count: publishedToday },
    { count: discoveredToday },
    { count: pendingAi },
    { count: pendingReview },
    { count: activeAuthorities },
    { count: activeSources },
    { count: failedJobs },
  ] = await Promise.all([
    supabase.from('legal_updates').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('legal_updates').select('*', { count: 'exact', head: true }).eq('status', 'published').or(`issue_date.eq.${today},published_at.gte.${today}T00:00:00`),
    supabase.from('source_documents').select('*', { count: 'exact', head: true }).gte('created_at', `${today}T00:00:00`),
    supabase.from('source_documents').select('*', { count: 'exact', head: true }).eq('status', 'discovered'),
    supabase.from('legal_updates').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
    supabase.from('authorities').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('source_registry').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('collection_jobs').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
  ]);

  const storage = await getStorageOverview();

  const { data: categoryStats } = await supabase
    .from('legal_categories')
    .select(`name, legal_updates!left(id, status)`);

  const catStats = (categoryStats || []).map((c: any) => ({
    name:  c.name,
    count: (c.legal_updates || []).filter((u: any) => u.status === 'published').length,
  })).sort((a: any, b: any) => b.count - a.count);

  const { data: recentJobs } = await supabase
    .from('collection_jobs')
    .select(`
      *,
      source_registry!inner(name,
        authorities!inner(code)
      )
    `)
    .order('id', { ascending: false })
    .limit(6);

  const recentJobsFlat = (recentJobs || []).map((j: any) => ({
    ...j,
    source_name:    j.source_registry?.name,
    authority_code: j.source_registry?.authorities?.code,
    source_registry: undefined,
  }));

  res.json({
    metrics: {
      totalPublished:   totalPublished   || 0,
      publishedToday:   publishedToday   || 0,
      discoveredToday:  discoveredToday  || 0,
      pendingAi:        pendingAi        || 0,
      pendingReview:    pendingReview    || 0,
      activeAuthorities: activeAuthorities || 0,
      activeSources:    activeSources    || 0,
      failedJobs:       failedJobs       || 0,
      storageUsedMb:    '0.00',
      storageWarning:   storage.isStorageThresholdExceeded,
    },
    storage,
    categoryStats: catStats,
    recentJobs:    recentJobsFlat,
  });
});

// ==========================================
// BACKGROUND MIDNIGHT CLEANUP SCHEDULER
// ==========================================
let lastMidnightCleanupDate = '';

function checkScheduledMidnightCleanup() {
  const kolkataDate = getAsiaKolkataTime();
  const hours   = kolkataDate.getHours();
  const minutes = kolkataDate.getMinutes();
  const dateStr = kolkataDate.toISOString().split('T')[0];

  if (hours === 0 && minutes <= 2 && lastMidnightCleanupDate !== dateStr) {
    console.log(`[DAEMON] Executing scheduled Midnight Cleanup for ${dateStr} at 12:00 AM IST...`);
    lastMidnightCleanupDate = dateStr;
    runMidnightCleanup(false).then((result) => {
      console.log(`[DAEMON] Midnight cleanup completed: ${result.summary}`);
    });
  }
}

if (!process.env.VERCEL) {
  setInterval(checkScheduledMidnightCleanup, 60 * 1000);
}

// ==========================================

// ==========================================
// AUTOMATED BACKGROUND SOURCE CRAWLER DAEMON
// ==========================================
let isCrawlerDaemonRunning = false;

async function checkScheduledSourceCrawls() {
  if (isCrawlerDaemonRunning) return;
  const nowIso = new Date().toISOString();

  try {
    const { data: dueSources, error } = await supabase
      .from('source_registry')
      .select('id, name, fetch_interval_mins, next_scheduled_at, authorities(code)')
      .eq('is_active', true)
      .or('next_scheduled_at.lte.' + nowIso + ',next_scheduled_at.is.null')
      .order('id', { ascending: true });

    if (error || !dueSources || dueSources.length === 0) return;

    isCrawlerDaemonRunning = true;
    for (const src of dueSources) {
      const code = (src as any).authorities?.code || 'PORTAL';
      console.log('[DAEMON] Auto-running scheduled crawler for ' + code + ' (Source #' + src.id + ': ' + src.name + ')...');
      try {
        const res = await runSourceCollection(src.id);
        console.log('[DAEMON] Auto-crawl completed for ' + code + ': ' + res.docsFound + ' found, ' + res.docsIngested + ' ingested.');
      } catch (err: any) {
        console.error('[DAEMON] Auto-crawl error for ' + code + ':', err.message);
      }
    }
  } catch (err: any) {
    console.error('[DAEMON] Error in checkScheduledSourceCrawls:', err.message);
  } finally {
    isCrawlerDaemonRunning = false;
  }
}

if (process.env.VERCEL || process.env.DISABLE_IN_APP_CRAWLER === 'true') {
  console.log('[DAEMON] In-app crawler disabled in cloud/serverless mode; relying on external GitHub Actions cron.');
} else {
  setTimeout(checkScheduledSourceCrawls, 5 * 1000);
  setInterval(checkScheduledSourceCrawls, 5 * 60 * 1000);
}


// ==========================================
// VITE OR STATIC FRONTEND SERVING
// ==========================================
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`  MK PROFESSIONAL LEGAL BULLETIN - BACKEND SERVER`);
    console.log(`  Published by: Manish Khandelwal & Co.`);
    console.log(`  Listening on: http://0.0.0.0:${PORT}`);
    console.log(`  Database: Supabase (PostgreSQL)`);
    console.log(`  Timezone: Asia/Kolkata (${formatKolkataIso()})`);
    console.log(`======================================================\n`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
