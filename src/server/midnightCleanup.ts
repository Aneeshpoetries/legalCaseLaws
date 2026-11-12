import crypto from 'node:crypto';
import { supabase } from './db.js';

export interface StorageMetrics {
  databaseSizeBytes: number;
  temporaryStorageBytes: number;
  permanentStorageBytes: number;
  permanentRecordsCount: number;
  temporaryRecordsCount: number;
  totalStorageBytes: number;
  lastCleanup: {
    executedAt: string | null;
    status: string | null;
    bytesFreed: number;
    temporaryRecordsPurged: number;
    summary: string | null;
  } | null;
  nextScheduledCleanup: string;
  currentTimeAsiaKolkata: string;
  isStorageThresholdExceeded: boolean;
  thresholdMb: number;
}

/** Get current time in Asia/Kolkata timezone */
export function getAsiaKolkataTime(): Date {
  const now = new Date();
  const kolkataTimeString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  return new Date(kolkataTimeString);
}

/** Format timestamp in ISO string with Asia/Kolkata context */
export function formatKolkataIso(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const p: Record<string, string> = {};
  parts.forEach((item) => { p[item.type] = item.value; });
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}+05:30`;
}

/** Compute the next occurrence of 12:00 AM IST */
export function getNextMidnightKolkata(): string {
  const nowKolkata = getAsiaKolkataTime();
  const nextMidnight = new Date(nowKolkata);
  nextMidnight.setDate(nextMidnight.getDate() + 1);
  nextMidnight.setHours(0, 0, 0, 0);
  const diffMs = nextMidnight.getTime() - nowKolkata.getTime();
  return formatKolkataIso(new Date(Date.now() + diffMs));
}

/** Generate SHA-256 hash */
export function computeSha256(content: string | Buffer): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Execute Midnight Cleanup – deletes ONLY expired temporary artifacts;
 * NEVER touches permanent legal records.
 */
export async function runMidnightCleanup(isManualTrigger: boolean = false): Promise<{
  success: boolean;
  recordsPurged: number;
  filesPurged: number;
  bytesFreed: number;
  summary: string;
}> {
  const executedAt = formatKolkataIso();
  let recordsPurged = 0;
  let filesPurged = 0;
  let bytesFreed = 0;

  try {
    // 1. Fetch active retention policies
    const { data: policies } = await supabase
      .from('retention_policies')
      .select('entity_type, retention_hours')
      .eq('is_active', true);

    const policyMap = new Map<string, number>();
    (policies || []).forEach((p: any) => policyMap.set(p.entity_type, p.retention_hours));

    const tempDocHours  = policyMap.get('temporary_downloaded_docs') || 24;
    const tempAiHours   = policyMap.get('temporary_ai_responses')    || 72;
    const failedJobHours = policyMap.get('failed_job_payloads')      || 168;

    const tempDocCutoff   = new Date(Date.now() - tempDocHours   * 3600_000).toISOString();
    const tempAiCutoff    = new Date(Date.now() - tempAiHours    * 3600_000).toISOString();
    const failedJobCutoff = new Date(Date.now() - failedJobHours * 3600_000).toISOString();
    const now             = new Date().toISOString();

    // 2. Identify & delete expired temporary document_files
    const { data: expiredFiles } = await supabase
      .from('document_files')
      .select('id, file_path, file_size_bytes')
      .eq('is_temporary', true)
      .or(`expires_at.lte.${now},created_at.lte.${tempDocCutoff}`);

    for (const file of expiredFiles || []) {
      bytesFreed += file.file_size_bytes || 0;
      filesPurged++;
    }

    if ((expiredFiles || []).length > 0) {
      const ids = (expiredFiles || []).map((f: any) => f.id);
      await supabase.from('document_files').delete().in('id', ids);
      recordsPurged += ids.length;
    }

    // 3. Delete expired temporary source_documents
    const { count: deletedDocs } = await supabase
      .from('source_documents')
      .delete({ count: 'exact' })
      .eq('is_temporary', true)
      .not('status', 'in', '("published","verified")')
      .or(`expires_at.lte.${now},created_at.lte.${tempDocCutoff}`);
    recordsPurged += deletedDocs || 0;

    // 4. Clean up old failed collection_jobs
    const { count: deletedJobs } = await supabase
      .from('collection_jobs')
      .delete({ count: 'exact' })
      .eq('status', 'failed')
      .lte('started_at', failedJobCutoff);
    recordsPurged += deletedJobs || 0;

    // 5. Clean up old ai_generation_logs
    const { count: deletedAiLogs } = await supabase
      .from('ai_generation_logs')
      .delete({ count: 'exact' })
      .lte('created_at', tempAiCutoff);
    recordsPurged += deletedAiLogs || 0;

    const approxByteSavings = bytesFreed + recordsPurged * 128;
    const triggerMode = isManualTrigger
      ? 'Manual Administrator Execution'
      : 'Scheduled 12:00 AM IST Midnight Daemon';

    const summary = `${triggerMode}: Purged ${recordsPurged} expired temporary database rows, removed ${filesPurged} temporary document artifacts, reclaiming ~${(approxByteSavings / 1024).toFixed(1)} KB. Permanent legal updates and verified citations preserved 100%.`;

    // 6. Record cleanup log
    await supabase.from('cleanup_logs').insert({
      executed_at:               executedAt,
      timezone:                  'Asia/Kolkata',
      temporary_records_purged:  recordsPurged,
      temporary_files_purged:    filesPurged,
      bytes_freed:               approxByteSavings,
      status:                    'SUCCESS',
      execution_summary:         summary,
    });

    // 7. Record storage snapshot
    await recordStorageSnapshot();

    return { success: true, recordsPurged, filesPurged, bytesFreed: approxByteSavings, summary };
  } catch (error: any) {
    console.error('Midnight cleanup error:', error);
    await supabase.from('cleanup_logs').insert({
      executed_at:    executedAt,
      timezone:       'Asia/Kolkata',
      status:         'FAILED',
      execution_summary: 'Cleanup encountered an error.',
      error_message:  error?.message || 'Unknown error during cleanup',
    });
    return { success: false, recordsPurged: 0, filesPurged: 0, bytesFreed: 0, summary: `Failed: ${error?.message}` };
  }
}

/** Record storage metrics snapshot */
export async function recordStorageSnapshot() {
  const { count: permanentCount } = await supabase
    .from('legal_updates')
    .select('*', { count: 'exact', head: true })
    .eq('is_permanent', true);

  const { count: tempCount } = await supabase
    .from('source_documents')
    .select('*', { count: 'exact', head: true })
    .eq('is_temporary', true);

  await supabase.from('storage_usage_logs').insert({
    permanent_records_count: permanentCount || 0,
    temporary_records_count: tempCount || 0,
    database_size_bytes:     0,  // Supabase manages this; not directly readable
    file_storage_bytes:      0,
    total_bytes:             0,
  });
}

/** Get complete storage overview for Admin Dashboard */
export async function getStorageOverview(): Promise<StorageMetrics> {
  const { count: permanentCount } = await supabase
    .from('legal_updates')
    .select('*', { count: 'exact', head: true })
    .eq('is_permanent', true);

  const { count: tempDocsCount } = await supabase
    .from('source_documents')
    .select('*', { count: 'exact', head: true })
    .eq('is_temporary', true);

  const { count: tempFilesCount } = await supabase
    .from('document_files')
    .select('*', { count: 'exact', head: true })
    .eq('is_temporary', true);

  const { data: lastCleanupRow } = await supabase
    .from('cleanup_logs')
    .select('executed_at, status, bytes_freed, temporary_records_purged, execution_summary')
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: thresholdRow } = await supabase
    .from('system_settings')
    .select('setting_value')
    .eq('setting_key', 'storage_warning_threshold_mb')
    .maybeSingle();

  const thresholdMb = thresholdRow ? parseInt(thresholdRow.setting_value, 10) : 500;

  // Supabase doesn't expose raw DB size via client SDK; use 0 as placeholder
  const databaseSizeBytes  = 0;
  const uploadFilesBytes   = 0;
  const totalStorageBytes  = 0;
  const totalMb            = totalStorageBytes / (1024 * 1024);
  const permanentBytes     = 0;
  const temporaryBytes     = 0;

  return {
    databaseSizeBytes,
    temporaryStorageBytes:  temporaryBytes,
    permanentStorageBytes:  permanentBytes,
    permanentRecordsCount:  permanentCount || 0,
    temporaryRecordsCount:  (tempDocsCount || 0) + (tempFilesCount || 0),
    totalStorageBytes,
    lastCleanup: lastCleanupRow ? {
      executedAt:              lastCleanupRow.executed_at,
      status:                  lastCleanupRow.status,
      bytesFreed:              lastCleanupRow.bytes_freed || 0,
      temporaryRecordsPurged:  lastCleanupRow.temporary_records_purged || 0,
      summary:                 lastCleanupRow.execution_summary,
    } : null,
    nextScheduledCleanup:       getNextMidnightKolkata(),
    currentTimeAsiaKolkata:     formatKolkataIso(),
    isStorageThresholdExceeded: totalMb >= thresholdMb,
    thresholdMb,
  };
}
