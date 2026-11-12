export interface Category {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  display_order: number;
  is_active: number;
  published_updates_count?: number;
}

export interface Authority {
  id: number;
  code: string;
  name: string;
  category_id: number | null;
  category_name?: string;
  category_slug?: string;
  website_url: string;
  jurisdiction: string;
  is_active: number;
  published_count?: number;
  sources_count?: number;
}

export interface LegalUpdate {
  id: number;
  update_no: string;
  slug: string;
  title: string;
  issue_date: string;
  published_at: string;
  view_count: number;
  authority_name: string;
  authority_code: string;
  authority_url?: string;
  category_name: string;
  category_slug: string;
  document_identifier?: string;
  doc_type?: string;
  original_url?: string;
  file_hash_sha256?: string;
  facts: string;
  legal_provisions?: string;
  decision_development?: string;
  conclusion_implications?: string;
  original_references?: string;
  ai_model?: string;
  is_verified?: number;
  verified_by?: string;
  verified_at?: string;
  references?: Array<{
    id?: number;
    act_name: string;
    section?: string;
    circular_or_case_ref?: string;
    citation?: string;
    url?: string;
  }>;
}

export interface SourceRegistryItem {
  id: number;
  authority_id: number;
  authority_name: string;
  authority_code: string;
  category_name: string;
  name: string;
  source_type: string;
  url: string;
  fetch_interval_mins: number;
  is_active: number;
  last_attempted_at: string | null;
  last_successful_at: string | null;
  next_scheduled_at: string | null;
  error_status: string | null;
}

export interface SourceDocument {
  id: number;
  authority_id: number;
  authority_name: string;
  authority_code: string;
  document_identifier: string;
  title: string;
  doc_type: string;
  publication_date: string;
  original_url: string;
  file_hash_sha256: string;
  is_temporary: number;
  status: string;
  created_at: string;
  expires_at: string | null;
  update_id?: number;
  update_no?: string;
  update_status?: string;
}

export interface StorageOverview {
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

export interface RetentionPolicy {
  id: number;
  entity_type: string;
  retention_hours: number;
  description: string;
  is_active: number;
  updated_at: string;
}

export interface CleanupLog {
  id: number;
  executed_at: string;
  timezone: string;
  temporary_records_purged: number;
  temporary_files_purged: number;
  bytes_freed: number;
  status: string;
  execution_summary: string;
  error_message?: string;
}

export interface AnalyticsData {
  metrics: {
    totalPublished: number;
    publishedToday: number;
    discoveredToday: number;
    pendingAi: number;
    pendingReview: number;
    activeAuthorities: number;
    activeSources: number;
    failedJobs: number;
    storageUsedMb: string;
    storageWarning: boolean;
  };
  storage: StorageOverview;
  categoryStats: Array<{ name: string; count: number }>;
  recentJobs: Array<{
    id: number;
    source_name: string;
    authority_code: string;
    status: string;
    docs_found: number;
    docs_ingested: number;
    error_message?: string;
    started_at: string;
    completed_at?: string;
  }>;
}
