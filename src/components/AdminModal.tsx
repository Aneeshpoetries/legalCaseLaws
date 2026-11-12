import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowLeft,
  Lock,
  LogOut,
  LayoutDashboard,
  Globe,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Database,
  Trash2,
  RefreshCw,
  Plus,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Sliders,
  Building2,
  Layers,
  Upload,
  Check,
  Search,
  Eye,
  Calendar,
} from 'lucide-react';
import { api } from '../api.ts';
import type {
  Category,
  Authority,
  SourceRegistryItem,
  SourceDocument,
  StorageOverview,
  RetentionPolicy,
  CleanupLog,
  AnalyticsData,
} from '../types.ts';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  authorities: Authority[];
  onRefreshData: () => void;
  fullPage?: boolean;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  categories,
  authorities,
  onRefreshData,
  fullPage = false,
}) => {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [email, setEmail] = useState<string>('admin@mklegal.in');
  const [password, setPassword] = useState<string>('mklegal2026');
  const [authError, setAuthError] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'sources' | 'documents' | 'review' | 'publications' | 'storage' | 'entities'
  >('overview');

  // Module data
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [sources, setSources] = useState<SourceRegistryItem[]>([]);
  const [documents, setDocuments] = useState<SourceDocument[]>([]);
  const [reviewQueue, setReviewQueue] = useState<any[]>([]);
  const [storageData, setStorageData] = useState<StorageOverview | null>(null);
  const [retentionPolicies, setRetentionPolicies] = useState<RetentionPolicy[]>([]);
  const [cleanupLogs, setCleanupLogs] = useState<CleanupLog[]>([]);
  const [publishedUpdates, setPublishedUpdates] = useState<any[]>([]);

  // Action status & loading
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Selected item for review
  const [selectedReviewItem, setSelectedReviewItem] = useState<any | null>(null);
  const [reviewForm, setReviewForm] = useState<{
    title: string;
    facts: string;
    legal_provisions: string;
    decision_development: string;
    conclusion_implications: string;
    original_references: string;
  }>({
    title: '',
    facts: '',
    legal_provisions: '',
    decision_development: '',
    conclusion_implications: '',
    original_references: '',
  });

  // Modal sub-dialogs
  const [showAddSourceModal, setShowAddSourceModal] = useState<boolean>(false);
  const [showManualUploadModal, setShowManualUploadModal] = useState<boolean>(false);
  const [showAddAuthorityModal, setShowAddAuthorityModal] = useState<boolean>(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState<boolean>(false);

  // New Entity Forms
  const [newSourceForm, setNewSourceForm] = useState({
    authority_id: '',
    name: '',
    source_type: 'crawl',
    url: '',
    fetch_interval_mins: 60,
  });

  const [manualDocForm, setManualDocForm] = useState({
    authority_id: '',
    category_id: '',
    title: '',
    doc_type: 'Notification',
    document_identifier: '',
    publication_date: new Date().toISOString().split('T')[0],
    original_url: '',
    raw_text: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [newAuthForm, setNewAuthForm] = useState({
    code: '',
    name: '',
    category_id: '',
    website_url: '',
    jurisdiction: 'India',
  });

  const [newCategoryForm, setNewCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
  });

  // Check initial login state
  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem('mk_admin_token');
      if (token) {
        api.getMe()
          .then((res) => {
            setIsLoggedIn(true);
            setCurrentUser(res.user);
            loadTabContent('overview');
          })
          .catch(() => {
            setIsLoggedIn(false);
            localStorage.removeItem('mk_admin_token');
          });
      }
    }
  }, [isOpen]);

  const loadTabContent = async (tab: string) => {
    setActionMessage(null);
    try {
      if (tab === 'overview') {
        const data = await api.getAnalytics();
        setAnalytics(data);
      } else if (tab === 'sources') {
        const data = await api.getSources();
        setSources(data);
      } else if (tab === 'documents') {
        const data = await api.getDocuments();
        setDocuments(data);
      } else if (tab === 'review') {
        const data = await api.getResearchQueue();
        setReviewQueue(data);
      } else if (tab === 'publications') {
        const data = await api.getUpdates({ limit: 50 });
        setPublishedUpdates(data.updates);
      } else if (tab === 'storage') {
        const [overview, policies, logs] = await Promise.all([
          api.getStorageOverview(),
          api.getRetentionPolicies(),
          api.getCleanupLogs(),
        ]);
        setStorageData(overview);
        setRetentionPolicies(policies);
        setCleanupLogs(logs);
      }
    } catch (err: any) {
      console.error(`Error loading ${tab}:`, err);
    }
  };

  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    loadTabContent(tab);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await api.login(email, password);
      localStorage.setItem('mk_admin_token', res.token);
      setIsLoggedIn(true);
      setCurrentUser(res.user);
      loadTabContent('overview');
      onRefreshData();
    } catch (err: any) {
      setAuthError(err.message || 'Invalid credentials');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mk_admin_token');
    setIsLoggedIn(false);
    setCurrentUser(null);
    onRefreshData();
  };

  // Trigger Midnight Cleanup manually
  const handleTriggerCleanup = async () => {
    if (!window.confirm('Run Midnight Storage Cleanup now? Expired temporary artifacts will be deleted. Permanent legal records remain 100% intact.')) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.runMidnightCleanup();
      setActionMessage({ text: res.summary, type: 'success' });
      loadTabContent('storage');
      onRefreshData();
    } catch (err: any) {
      setActionMessage({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Run source crawl
  const handleCrawlSource = async (sourceId: number) => {
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await api.crawlSource(sourceId);
      setActionMessage({
        text: `Source crawl completed. Discovered: ${res.docsFound}, Newly Ingested: ${res.docsIngested}`,
        type: 'success',
      });
      loadTabContent('sources');
      onRefreshData();
    } catch (err: any) {
      setActionMessage({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle source status
  const handleToggleSource = async (sourceId: number) => {
    try {
      await api.toggleSource(sourceId);
      loadTabContent('sources');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Open review modal
  const handleOpenReview = async (updateId: number) => {
    setActionLoading(true);
    try {
      const detail = await api.getResearchDetail(updateId);
      setSelectedReviewItem(detail);
      setReviewForm({
        title: detail.title || '',
        facts: detail.facts || '',
        legal_provisions: detail.legal_provisions || '',
        decision_development: detail.decision_development || '',
        conclusion_implications: detail.conclusion_implications || '',
        original_references: detail.original_references || '',
      });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Regenerate section with AI
  const handleRegenerateSection = async (sectionKey: string) => {
    if (!selectedReviewItem) return;
    const instruction = window.prompt(`Specific revision instruction for "${sectionKey}" (optional):`);
    setActionLoading(true);
    try {
      const res = await api.regenerateSection(selectedReviewItem.id, sectionKey, instruction || undefined);
      setReviewForm((prev) => ({ ...prev, [sectionKey]: res.revisedText }));
      setActionMessage({ text: `Section "${sectionKey}" regenerated with Gemini.`, type: 'success' });
    } catch (err: any) {
      setActionMessage({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Save edits to research
  const handleSaveReviewEdits = async () => {
    if (!selectedReviewItem) return;
    setActionLoading(true);
    try {
      await api.updateResearch(selectedReviewItem.id, reviewForm);
      setActionMessage({ text: 'Changes saved to draft.', type: 'success' });
    } catch (err: any) {
      setActionMessage({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Approve & Publish
  const handleApprove = async () => {
    if (!selectedReviewItem) return;
    setActionLoading(true);
    try {
      await handleSaveReviewEdits();
      await api.approveUpdate(selectedReviewItem.id);
      setActionMessage({ text: 'Update verified and published to official bulletin!', type: 'success' });
      setSelectedReviewItem(null);
      loadTabContent('review');
      onRefreshData();
    } catch (err: any) {
      setActionMessage({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Reject
  const handleReject = async () => {
    if (!selectedReviewItem) return;
    const reason = window.prompt('Reason for rejecting this research draft:');
    if (reason === null) return;
    setActionLoading(true);
    try {
      await api.rejectUpdate(selectedReviewItem.id, reason);
      setActionMessage({ text: 'Draft rejected and archived.', type: 'success' });
      setSelectedReviewItem(null);
      loadTabContent('review');
      onRefreshData();
    } catch (err: any) {
      setActionMessage({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Unpublish
  const handleUnpublish = async (updateId: number) => {
    const reason = window.prompt('Reason for unpublishing this update:');
    if (!reason) return;
    try {
      await api.unpublishUpdate(updateId, reason);
      loadTabContent('publications');
      onRefreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Submit Manual Document
  const handleSubmitManualDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionMessage(null);
    try {
      const fd = new FormData();
      fd.append('authority_id', manualDocForm.authority_id);
      if (manualDocForm.category_id) fd.append('category_id', manualDocForm.category_id);
      fd.append('title', manualDocForm.title);
      fd.append('doc_type', manualDocForm.doc_type);
      fd.append('document_identifier', manualDocForm.document_identifier);
      fd.append('publication_date', manualDocForm.publication_date);
      if (manualDocForm.original_url) fd.append('original_url', manualDocForm.original_url);
      if (manualDocForm.raw_text) fd.append('raw_text', manualDocForm.raw_text);
      if (selectedFile) fd.append('document_file', selectedFile);

      const res = await api.submitManualDocument(fd);
      if (res.isDuplicate) {
        setActionMessage({ text: res.status, type: 'error' });
      } else {
        setActionMessage({ text: res.status, type: 'success' });
        setShowManualUploadModal(false);
        setManualDocForm({
          authority_id: '',
          category_id: '',
          title: '',
          doc_type: 'Notification',
          document_identifier: '',
          publication_date: new Date().toISOString().split('T')[0],
          original_url: '',
          raw_text: '',
        });
        setSelectedFile(null);
        loadTabContent('documents');
        onRefreshData();
      }
    } catch (err: any) {
      setActionMessage({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Submit New Source
  const handleSubmitNewSource = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.addSource({
        authority_id: Number(newSourceForm.authority_id),
        name: newSourceForm.name,
        source_type: newSourceForm.source_type,
        url: newSourceForm.url,
        fetch_interval_mins: Number(newSourceForm.fetch_interval_mins) || 60,
      });
      setShowAddSourceModal(false);
      setNewSourceForm({ authority_id: '', name: '', source_type: 'crawl', url: '', fetch_interval_mins: 60 });
      setActionMessage({ text: 'New source connector added to monitoring registry.', type: 'success' });
      loadTabContent('sources');
    } catch (err: any) {
      setActionMessage({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Submit New Authority
  const handleSubmitNewAuthority = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.addAuthority({
        code: newAuthForm.code,
        name: newAuthForm.name,
        category_id: newAuthForm.category_id ? Number(newAuthForm.category_id) : undefined,
        website_url: newAuthForm.website_url,
        jurisdiction: newAuthForm.jurisdiction,
      });
      setShowAddAuthorityModal(false);
      setNewAuthForm({ code: '', name: '', category_id: '', website_url: '', jurisdiction: 'India' });
      setActionMessage({ text: 'New regulatory authority registered successfully in database.', type: 'success' });
      onRefreshData();
    } catch (err: any) {
      setActionMessage({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  const wrapperClass = fullPage
    ? "w-full min-h-screen bg-slate-50/50 pb-16 pt-3 px-2 sm:px-6"
    : "fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4";

  const containerClass = fullPage
    ? "relative w-full max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[85vh]"
    : "relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col";

  return (
    <div className={wrapperClass}>
      <div className={containerClass}>
        {/* Top Control Bar */}
        <div className="bg-[#0b172a] text-white px-6 py-4 flex items-center justify-between border-b border-amber-500/30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold">MK Editorial & Administrative Console</h2>
              <p className="text-xs text-amber-300">
                {isLoggedIn ? `Authenticated as ${currentUser?.name} (${currentUser?.role})` : 'Administrator Authentication Required'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            )}
            {fullPage ? (
              <button
                onClick={onClose}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Dashboard</span>
              </button>
            ) : (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Action Alert Banner */}
        {actionMessage && (
          <div
            className={`px-6 py-3 text-xs flex items-center justify-between border-b ${
              actionMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-red-50 text-red-900 border-red-200'
            }`}
          >
            <span>{actionMessage.text}</span>
            <button
              onClick={() => setActionMessage(null)}
              className="text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Content Area */}
        {!isLoggedIn ? (
          /* Login Screen */
          <div className="p-8 sm:p-12 max-w-md mx-auto w-full my-auto text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto border border-amber-500/20">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-serif font-bold text-slate-900">
                Authorized Editorial Access
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your firm credentials to manage sources, review AI legal research, and trigger midnight cleanup.
              </p>
            </div>

            {authError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-800 border border-red-200 text-xs text-left">
                {authError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-amber-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-[#0b172a] hover:bg-slate-800 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                {authLoading ? (
                  <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Authenticate Console</span>
                  </>
                )}
              </button>
            </form>

            <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-500 text-left border border-slate-200 space-y-1">
              <span className="font-semibold text-slate-700 block">Default Initial Credentials:</span>
              <span>Email: <strong>admin@mklegal.in</strong></span>
              <br />
              <span>Password: <strong>mklegal2026</strong></span>
            </div>
          </div>
        ) : (
          /* Logged-In Console */
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-60 bg-slate-50 border-r border-slate-200 p-3 space-y-1 overflow-y-auto flex-shrink-0">
              {[
                { id: 'overview', label: 'Overview & Metrics', icon: LayoutDashboard },
                { id: 'review', label: 'AI Review Queue', icon: Sparkles, badge: reviewQueue.length },
                { id: 'sources', label: 'Source Monitoring', icon: Globe },
                { id: 'documents', label: 'Document Ingestion', icon: FileText },
                { id: 'publications', label: 'Publications', icon: CheckCircle2 },
                { id: 'storage', label: 'Midnight Cleanup', icon: Database },
                { id: 'entities', label: 'Authorities & Regs', icon: Building2 },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-[#0b172a] text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-200/70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive ? 'bg-amber-500 text-slate-950' : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </aside>

            {/* Sub-Panel View */}
            <main className="flex-1 overflow-y-auto p-6 bg-white">
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && analytics && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-slate-900">
                      Platform Intelligence Overview
                    </h3>
                    <p className="text-xs text-slate-500">
                      Real-time database metrics, automated crawler telemetry, and daily publication statistics.
                    </p>
                  </div>

                  {analytics.metrics.storageWarning && (
                    <div className="p-4 bg-amber-50 border-l-4 border-amber-600 rounded-r-lg flex items-center gap-3">
                      <ShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0" />
                      <div className="text-xs text-amber-950">
                        <span className="font-bold block">Storage Budget Warning Threshold Exceeded</span>
                        Database and temporary file storage has exceeded the configured warning limit. Run midnight cleanup or adjust retention policies.
                      </div>
                    </div>
                  )}

                  {/* 8 Core Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-xs font-semibold text-slate-500 block mb-1">Total Published</span>
                      <span className="text-2xl font-serif font-bold text-slate-900">
                        {analytics.metrics.totalPublished}
                      </span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-xs font-semibold text-slate-500 block mb-1">Published Today</span>
                      <span className="text-2xl font-serif font-bold text-emerald-700">
                        {analytics.metrics.publishedToday}
                      </span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-xs font-semibold text-slate-500 block mb-1">Discovered Today</span>
                      <span className="text-2xl font-serif font-bold text-amber-700">
                        {analytics.metrics.discoveredToday}
                      </span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-xs font-semibold text-slate-500 block mb-1">Pending AI Review</span>
                      <span className="text-2xl font-serif font-bold text-indigo-700">
                        {analytics.metrics.pendingReview}
                      </span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-xs font-semibold text-slate-500 block mb-1">Active Authorities</span>
                      <span className="text-2xl font-serif font-bold text-slate-900">
                        {analytics.metrics.activeAuthorities}
                      </span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-xs font-semibold text-slate-500 block mb-1">Active Sources</span>
                      <span className="text-2xl font-serif font-bold text-slate-900">
                        {analytics.metrics.activeSources}
                      </span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-xs font-semibold text-slate-500 block mb-1">Failed Jobs</span>
                      <span className="text-2xl font-serif font-bold text-rose-700">
                        {analytics.metrics.failedJobs}
                      </span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-xs font-semibold text-slate-500 block mb-1">Storage Utilized</span>
                      <span className="text-2xl font-serif font-bold text-slate-900">
                        {analytics.metrics.storageUsedMb} <span className="text-xs font-normal">MB</span>
                      </span>
                    </div>
                  </div>

                  {/* Recent Jobs Table */}
                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    <h4 className="font-serif font-bold text-slate-900 text-sm">
                      Recent Automated Regulatory Collection Jobs
                    </h4>
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="min-w-full divide-y divide-slate-200 text-xs">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-slate-700">Source</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-700">Authority</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-700">Status</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-700">Found</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-700">Ingested</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-700">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {analytics.recentJobs.map((j) => (
                            <tr key={j.id}>
                              <td className="px-3 py-2 font-medium text-slate-900">{j.source_name}</td>
                              <td className="px-3 py-2 text-amber-900 font-semibold">{j.authority_code}</td>
                              <td className="px-3 py-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    j.status === 'completed'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {j.status}
                                </span>
                              </td>
                              <td className="px-3 py-2">{j.docs_found}</td>
                              <td className="px-3 py-2 font-semibold text-emerald-700">{j.docs_ingested}</td>
                              <td className="px-3 py-2 text-slate-500">{j.started_at}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: AI REVIEW QUEUE */}
              {activeTab === 'review' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-slate-900">
                        AI Legal Research Verification Queue
                      </h3>
                      <p className="text-xs text-slate-500">
                        Mandatory human verification gate. Inspect 5 structured parts, verify statutory citations, and approve for bulletin publication.
                      </p>
                    </div>
                  </div>

                  {reviewQueue.length === 0 ? (
                    <div className="py-16 text-center text-slate-500 border border-dashed rounded-xl">
                      <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-800">Verification Queue is Clear</p>
                      <p className="text-xs text-slate-500 mt-1">
                        All newly collected legal documents have been verified or no pending drafts remain.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reviewQueue.map((item) => (
                        <div
                          key={item.update_id}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs bg-slate-900 text-amber-300 font-bold px-2 py-0.5 rounded">
                                {item.update_no}
                              </span>
                              <span className="text-xs font-semibold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                                {item.authority_code}
                              </span>
                              <span className="text-xs text-slate-500">{item.issue_date}</span>
                            </div>
                            <h4 className="font-serif font-bold text-slate-950 text-sm">
                              {item.title}
                            </h4>
                            <p className="text-xs text-slate-500">
                              Document Reference: {item.document_identifier} • Model: {item.ai_model}
                            </p>
                          </div>

                          <button
                            onClick={() => handleOpenReview(item.update_id)}
                            className="bg-[#0b172a] hover:bg-slate-800 text-amber-300 font-semibold px-4 py-2 rounded-lg text-xs transition-colors flex-shrink-0 flex items-center gap-1.5"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>Verify & Edit</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Active Review Modal / Drawer */}
                  {selectedReviewItem && (
                    <div className="fixed inset-0 z-60 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
                      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
                        <div className="bg-[#0b172a] text-white px-6 py-4 flex items-center justify-between border-b border-amber-500/30">
                          <div>
                            <span className="text-xs text-amber-300 font-mono font-bold">
                              {selectedReviewItem.update_no} • {selectedReviewItem.authority_code}
                            </span>
                            <h3 className="text-base font-serif font-bold text-white">
                              Verify Legal Research Draft
                            </h3>
                          </div>
                          <button
                            onClick={() => setSelectedReviewItem(null)}
                            className="text-slate-400 hover:text-white p-1 rounded-lg"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
                          {/* Title */}
                          <div>
                            <label className="block font-bold text-slate-900 mb-1">
                              Subject Headline
                            </label>
                            <input
                              type="text"
                              value={reviewForm.title}
                              onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm font-serif font-bold text-slate-900"
                            />
                          </div>

                          {/* Section 1: Facts */}
                          <div className="border border-slate-200 rounded-xl p-4 space-y-2 bg-slate-50/50">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 uppercase">1. Material Facts</span>
                              <button
                                onClick={() => handleRegenerateSection('facts')}
                                disabled={actionLoading}
                                className="text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1 text-[11px]"
                              >
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                <span>Regenerate with Gemini</span>
                              </button>
                            </div>
                            <textarea
                              rows={4}
                              value={reviewForm.facts}
                              onChange={(e) => setReviewForm({ ...reviewForm, facts: e.target.value })}
                              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs leading-relaxed"
                            />
                          </div>

                          {/* Section 2: Provisions */}
                          <div className="border border-slate-200 rounded-xl p-4 space-y-2 bg-slate-50/50">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 uppercase">2. Statutory Provisions & References</span>
                              <button
                                onClick={() => handleRegenerateSection('legal_provisions')}
                                disabled={actionLoading}
                                className="text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1 text-[11px]"
                              >
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                <span>Regenerate with Gemini</span>
                              </button>
                            </div>
                            <textarea
                              rows={4}
                              value={reviewForm.legal_provisions}
                              onChange={(e) => setReviewForm({ ...reviewForm, legal_provisions: e.target.value })}
                              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs leading-relaxed"
                            />
                          </div>

                          {/* Section 3: Decision */}
                          <div className="border border-slate-200 rounded-xl p-4 space-y-2 bg-slate-50/50">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 uppercase">3. Decision / Legal Development</span>
                              <button
                                onClick={() => handleRegenerateSection('decision_development')}
                                disabled={actionLoading}
                                className="text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1 text-[11px]"
                              >
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                <span>Regenerate with Gemini</span>
                              </button>
                            </div>
                            <textarea
                              rows={4}
                              value={reviewForm.decision_development}
                              onChange={(e) => setReviewForm({ ...reviewForm, decision_development: e.target.value })}
                              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs leading-relaxed"
                            />
                          </div>

                          {/* Section 4: Implications */}
                          <div className="border border-slate-200 rounded-xl p-4 space-y-2 bg-slate-50/50">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 uppercase">4. Professional Implication (CA / CS / CMA / IP)</span>
                              <button
                                onClick={() => handleRegenerateSection('conclusion_implications')}
                                disabled={actionLoading}
                                className="text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1 text-[11px]"
                              >
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                <span>Regenerate with Gemini</span>
                              </button>
                            </div>
                            <textarea
                              rows={4}
                              value={reviewForm.conclusion_implications}
                              onChange={(e) => setReviewForm({ ...reviewForm, conclusion_implications: e.target.value })}
                              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs leading-relaxed"
                            />
                          </div>

                          {/* Section 5: Original References */}
                          <div className="border border-slate-200 rounded-xl p-4 space-y-2 bg-slate-50/50">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 uppercase">5. Original Source & References</span>
                            </div>
                            <textarea
                              rows={3}
                              value={reviewForm.original_references}
                              onChange={(e) => setReviewForm({ ...reviewForm, original_references: e.target.value })}
                              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs leading-relaxed"
                            />
                          </div>
                        </div>

                        {/* Footer Controls */}
                        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                          <button
                            onClick={handleReject}
                            disabled={actionLoading}
                            className="bg-red-50 text-red-700 hover:bg-red-100 font-semibold px-4 py-2 rounded-lg text-xs transition-colors border border-red-200"
                          >
                            Reject & Archive
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleSaveReviewEdits}
                              disabled={actionLoading}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold px-4 py-2 rounded-lg text-xs transition-colors"
                            >
                              Save Draft Edits
                            </button>

                            <button
                              onClick={handleApprove}
                              disabled={actionLoading}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-lg text-xs shadow-md transition-colors flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Approve & Publish to Bulletin</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SOURCE MONITORING */}
              {activeTab === 'sources' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-slate-900">
                        Regulatory Source Registry
                      </h3>
                      <p className="text-xs text-slate-500">
                        Automated monitoring of official portals, RSS feeds, Gazette feeds, and court cause lists.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowAddSourceModal(true)}
                      className="bg-[#0b172a] hover:bg-slate-800 text-amber-300 font-semibold px-4 py-2 rounded-lg text-xs transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4 text-amber-400" />
                      <span>Register New Source</span>
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200 text-xs">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3 py-2.5 text-left font-semibold text-slate-700">Authority</th>
                          <th className="px-3 py-2.5 text-left font-semibold text-slate-700">Source Name</th>
                          <th className="px-3 py-2.5 text-left font-semibold text-slate-700">Type</th>
                          <th className="px-3 py-2.5 text-left font-semibold text-slate-700">Status</th>
                          <th className="px-3 py-2.5 text-left font-semibold text-slate-700">Last Fetch</th>
                          <th className="px-3 py-2.5 text-right font-semibold text-slate-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {sources.map((s) => (
                          <tr key={s.id}>
                            <td className="px-3 py-2.5 font-bold text-amber-900">{s.authority_code}</td>
                            <td className="px-3 py-2.5 font-medium text-slate-900">
                              <div>{s.name}</div>
                              <span className="text-[10px] text-slate-400 font-mono truncate max-w-xs block">
                                {s.url}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 uppercase font-mono text-[10px] text-slate-600">
                              {s.source_type}
                            </td>
                            <td className="px-3 py-2.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  s.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {s.is_active ? 'Active' : 'Paused'}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-slate-500">
                              {s.last_successful_at || 'Never'}
                            </td>
                            <td className="px-3 py-2.5 text-right space-x-2">
                              <button
                                onClick={() => handleCrawlSource(s.id)}
                                disabled={actionLoading}
                                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 py-1 rounded text-[11px] transition-colors"
                              >
                                Crawl Now
                              </button>
                              <button
                                onClick={() => handleToggleSource(s.id)}
                                className="text-slate-500 hover:text-slate-800 text-[11px] font-medium"
                              >
                                {s.is_active ? 'Pause' : 'Activate'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Source Modal */}
                  {showAddSourceModal && (
                    <div className="fixed inset-0 z-60 bg-slate-950/75 flex items-center justify-center p-4">
                      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                          <h4 className="font-serif font-bold text-slate-900">Register Legal Source</h4>
                          <button onClick={() => setShowAddSourceModal(false)}>
                            <X className="w-5 h-5 text-slate-400" />
                          </button>
                        </div>
                        <form onSubmit={handleSubmitNewSource} className="space-y-3 text-xs">
                          <div>
                            <label className="block font-semibold mb-1">Authority</label>
                            <select
                              value={newSourceForm.authority_id}
                              onChange={(e) => setNewSourceForm({ ...newSourceForm, authority_id: e.target.value })}
                              className="w-full p-2 border rounded"
                              required
                            >
                              <option value="">Select Authority...</option>
                              {authorities.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.code} — {a.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block font-semibold mb-1">Source Name</label>
                            <input
                              type="text"
                              value={newSourceForm.name}
                              onChange={(e) => setNewSourceForm({ ...newSourceForm, name: e.target.value })}
                              placeholder="e.g. CBDT Notification Portal"
                              className="w-full p-2 border rounded"
                              required
                            />
                          </div>
                          <div>
                            <label className="block font-semibold mb-1">Source Type</label>
                            <select
                              value={newSourceForm.source_type}
                              onChange={(e) => setNewSourceForm({ ...newSourceForm, source_type: e.target.value })}
                              className="w-full p-2 border rounded"
                            >
                              <option value="crawl">Web Crawler</option>
                              <option value="rss">RSS Feed</option>
                              <option value="api">Official REST API</option>
                              <option value="pdf">Document Ingest</option>
                            </select>
                          </div>
                          <div>
                            <label className="block font-semibold mb-1">Target Portal URL</label>
                            <input
                              type="url"
                              value={newSourceForm.url}
                              onChange={(e) => setNewSourceForm({ ...newSourceForm, url: e.target.value })}
                              placeholder="https://..."
                              className="w-full p-2 border rounded"
                              required
                            />
                          </div>
                          <div className="pt-2 flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setShowAddSourceModal(false)}
                              className="px-3 py-1.5 bg-slate-200 rounded text-xs"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-1.5 bg-amber-500 text-slate-950 font-bold rounded text-xs"
                            >
                              Save Source
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: DOCUMENT INGESTION */}
              {activeTab === 'documents' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-slate-900">
                        Ingested Legal Documents & Integrity Hashes
                      </h3>
                      <p className="text-xs text-slate-500">
                        Raw source payloads, SHA-256 deduplication signatures, and temporary storage expiry tracking.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowManualUploadModal(true)}
                      className="bg-[#0b172a] hover:bg-slate-800 text-amber-300 font-semibold px-4 py-2 rounded-lg text-xs transition-colors flex items-center gap-1.5"
                    >
                      <Upload className="w-4 h-4 text-amber-400" />
                      <span>Ingest Document / PDF</span>
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200 text-xs">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">Authority</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">Reference ID</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">Title</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">SHA-256 Hash</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">Retention Status</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {documents.map((d) => (
                          <tr key={d.id}>
                            <td className="px-3 py-2 font-bold text-amber-900">{d.authority_code}</td>
                            <td className="px-3 py-2 font-mono">{d.document_identifier}</td>
                            <td className="px-3 py-2 font-medium text-slate-900 max-w-xs truncate">{d.title}</td>
                            <td className="px-3 py-2 font-mono text-[10px] text-slate-500">
                              {d.file_hash_sha256.slice(0, 16)}...
                            </td>
                            <td className="px-3 py-2">
                              {d.is_temporary ? (
                                <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[10px] font-medium">
                                  Temporary (Expires {d.expires_at ? new Date(d.expires_at).toLocaleDateString() : 'Midnight'})
                                </span>
                              ) : (
                                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                                  Permanent Knowledge
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-slate-500">{d.publication_date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Manual Upload Modal */}
                  {showManualUploadModal && (
                    <div className="fixed inset-0 z-60 bg-slate-950/75 flex items-center justify-center p-4">
                      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b pb-3">
                          <h4 className="font-serif font-bold text-slate-900">
                            Ingest Document / Notification
                          </h4>
                          <button onClick={() => setShowManualUploadModal(false)}>
                            <X className="w-5 h-5 text-slate-400" />
                          </button>
                        </div>

                        <form onSubmit={handleSubmitManualDoc} className="space-y-3 text-xs">
                          <div>
                            <label className="block font-semibold mb-1">Authority</label>
                            <select
                              value={manualDocForm.authority_id}
                              onChange={(e) => setManualDocForm({ ...manualDocForm, authority_id: e.target.value })}
                              className="w-full p-2 border rounded"
                              required
                            >
                              <option value="">Select Regulatory Authority...</option>
                              {authorities.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.code} — {a.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block font-semibold mb-1">Circular / Case ID</label>
                              <input
                                type="text"
                                value={manualDocForm.document_identifier}
                                onChange={(e) => setManualDocForm({ ...manualDocForm, document_identifier: e.target.value })}
                                placeholder="e.g. CIR/2026/04"
                                className="w-full p-2 border rounded"
                                required
                              />
                            </div>
                            <div>
                              <label className="block font-semibold mb-1">Issue Date</label>
                              <input
                                type="date"
                                value={manualDocForm.publication_date}
                                onChange={(e) => setManualDocForm({ ...manualDocForm, publication_date: e.target.value })}
                                className="w-full p-2 border rounded"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block font-semibold mb-1">Document Subject / Title</label>
                            <input
                              type="text"
                              value={manualDocForm.title}
                              onChange={(e) => setManualDocForm({ ...manualDocForm, title: e.target.value })}
                              placeholder="Official notification subject..."
                              className="w-full p-2 border rounded"
                              required
                            />
                          </div>

                          <div>
                            <label className="block font-semibold mb-1">Official Portal URL (Optional)</label>
                            <input
                              type="url"
                              value={manualDocForm.original_url}
                              onChange={(e) => setManualDocForm({ ...manualDocForm, original_url: e.target.value })}
                              placeholder="https://..."
                              className="w-full p-2 border rounded"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold mb-1">Upload PDF / Document File (Optional)</label>
                            <input
                              type="file"
                              accept=".pdf,.txt,.doc,.docx"
                              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                              className="w-full p-1.5 border rounded text-xs"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold mb-1">Notification / Order Text</label>
                            <textarea
                              rows={5}
                              value={manualDocForm.raw_text}
                              onChange={(e) => setManualDocForm({ ...manualDocForm, raw_text: e.target.value })}
                              placeholder="Paste the verbatim text of the circular or judgment..."
                              className="w-full p-2 border rounded text-xs leading-relaxed"
                            />
                          </div>

                          <div className="pt-2 flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setShowManualUploadModal(false)}
                              className="px-3 py-1.5 bg-slate-200 rounded text-xs"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={actionLoading}
                              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs"
                            >
                              {actionLoading ? 'Ingesting & Analyzing...' : 'Process & Generate AI Draft'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: PUBLICATIONS */}
              {activeTab === 'publications' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-slate-900">
                      Published Legal Bulletin Circulation
                    </h3>
                    <p className="text-xs text-slate-500">
                      Live published updates permanently indexed on the public website with audit logs.
                    </p>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200 text-xs">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">Update No</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">Authority</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">Title</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">Date</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">Reads</th>
                          <th className="px-3 py-2 text-right font-semibold text-slate-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {publishedUpdates.map((u) => (
                          <tr key={u.id}>
                            <td className="px-3 py-2 font-mono font-bold text-slate-900">{u.update_no}</td>
                            <td className="px-3 py-2 font-semibold text-amber-900">{u.authority_code}</td>
                            <td className="px-3 py-2 font-medium text-slate-900 max-w-sm truncate">{u.title}</td>
                            <td className="px-3 py-2 text-slate-500">{u.issue_date}</td>
                            <td className="px-3 py-2">{u.view_count || 0}</td>
                            <td className="px-3 py-2 text-right">
                              <button
                                onClick={() => handleUnpublish(u.id)}
                                className="text-rose-600 hover:text-rose-800 text-[11px] font-medium"
                              >
                                Unpublish
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 6: MIDNIGHT CLEANUP & STORAGE */}
              {activeTab === 'storage' && storageData && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-slate-900">
                        Storage Lifecycle & Midnight Cleanup
                      </h3>
                      <p className="text-xs text-slate-500">
                        Configured for <strong>12:00 AM Indian Standard Time (Asia/Kolkata)</strong>. Automatically deletes expired temporary artifacts while permanently safeguarding 100% of verified legal research.
                      </p>
                    </div>

                    <button
                      onClick={handleTriggerCleanup}
                      disabled={actionLoading}
                      className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-md transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Execute Midnight Cleanup Now</span>
                    </button>
                  </div>

                  {/* Storage Status Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-xs font-semibold text-slate-500 block mb-1">Database Size</span>
                      <span className="text-xl font-bold font-mono text-slate-900">
                        {(storageData.databaseSizeBytes / 1024).toFixed(1)} KB
                      </span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-xs font-semibold text-slate-500 block mb-1">Temporary Storage</span>
                      <span className="text-xl font-bold font-mono text-amber-700">
                        {(storageData.temporaryStorageBytes / 1024).toFixed(1)} KB
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {storageData.temporaryRecordsCount} purgeable temp rows
                      </span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-xs font-semibold text-slate-500 block mb-1">Permanent Legal Records</span>
                      <span className="text-xl font-bold font-mono text-emerald-700">
                        {storageData.permanentRecordsCount}
                      </span>
                      <span className="text-[10px] text-emerald-600 block mt-0.5">
                        Never purged at midnight
                      </span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-xs font-semibold text-slate-500 block mb-1">Next Midnight Daemon</span>
                      <span className="text-xs font-mono font-bold text-slate-800 block truncate">
                        {storageData.nextScheduledCleanup.split('T')[0]} 00:00 IST
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Asia/Kolkata timezone
                      </span>
                    </div>
                  </div>

                  {/* Last Cleanup Run Summary */}
                  {storageData.lastCleanup && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">Last Cleanup Run Execution:</span>
                        <span className="font-mono text-emerald-700 font-semibold">{storageData.lastCleanup.status}</span>
                      </div>
                      <p className="text-slate-600">{storageData.lastCleanup.summary}</p>
                      <p className="text-slate-400 text-[11px]">Executed at: {storageData.lastCleanup.executedAt}</p>
                    </div>
                  )}

                  {/* Retention Policies Table */}
                  <div className="space-y-3 pt-2">
                    <h4 className="font-serif font-bold text-slate-900 text-sm">
                      Configurable Retention Policies
                    </h4>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="min-w-full divide-y divide-slate-200 text-xs">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-slate-700">Artifact Category</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-700">Retention Period</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-700">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {retentionPolicies.map((p) => (
                            <tr key={p.id}>
                              <td className="px-3 py-2 font-mono font-semibold text-slate-900">{p.entity_type}</td>
                              <td className="px-3 py-2">
                                <span className="font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  {p.retention_hours} Hours ({Math.round(p.retention_hours / 24)} Days)
                                </span>
                              </td>
                              <td className="px-3 py-2 text-slate-600">{p.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Cleanup History Logs */}
                  <div className="space-y-3 pt-2">
                    <h4 className="font-serif font-bold text-slate-900 text-sm">
                      Midnight Cleanup Execution Audit Logs
                    </h4>
                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                      <table className="min-w-full divide-y divide-slate-200 text-xs">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-slate-700">Timestamp (IST)</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-700">Status</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-700">Rows Purged</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-700">Storage Reclaimed</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {cleanupLogs.map((log) => (
                            <tr key={log.id}>
                              <td className="px-3 py-2 font-mono text-slate-600">{log.executed_at}</td>
                              <td className="px-3 py-2">
                                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                                  {log.status}
                                </span>
                              </td>
                              <td className="px-3 py-2">{log.temporary_records_purged}</td>
                              <td className="px-3 py-2 font-mono font-semibold text-emerald-700">
                                {(log.bytes_freed / 1024).toFixed(1)} KB
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: AUTHORITIES & CATEGORIES REGISTRY */}
              {activeTab === 'entities' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-slate-900">
                        Authorities & Regulatory Bodies Registry
                      </h3>
                      <p className="text-xs text-slate-500">
                        Database-driven entities. Adding a new authority or category here makes it immediately active across filters, ingestion, and search without modifying frontend code.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowAddAuthorityModal(true)}
                        className="bg-[#0b172a] hover:bg-slate-800 text-amber-300 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Authority</span>
                      </button>
                      <button
                        onClick={() => setShowAddCategoryModal(true)}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Category</span>
                      </button>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200 text-xs">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">Code</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">Authority Name</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">Category</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">Jurisdiction</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">Published Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {authorities.map((a) => (
                          <tr key={a.id}>
                            <td className="px-3 py-2 font-mono font-bold text-slate-900">{a.code}</td>
                            <td className="px-3 py-2 font-medium text-slate-900">{a.name}</td>
                            <td className="px-3 py-2 text-slate-600">{a.category_name || 'General'}</td>
                            <td className="px-3 py-2 text-slate-500">{a.jurisdiction}</td>
                            <td className="px-3 py-2 font-bold text-amber-800">{a.published_count || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Authority Modal */}
                  {showAddAuthorityModal && (
                    <div className="fixed inset-0 z-60 bg-slate-950/75 flex items-center justify-center p-4">
                      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                          <h4 className="font-serif font-bold text-slate-900">Add Regulatory Authority</h4>
                          <button onClick={() => setShowAddAuthorityModal(false)}>
                            <X className="w-5 h-5 text-slate-400" />
                          </button>
                        </div>
                        <form onSubmit={handleSubmitNewAuthority} className="space-y-3 text-xs">
                          <div>
                            <label className="block font-semibold mb-1">Authority Code (e.g. NFRA, TDSAT, CCI)</label>
                            <input
                              type="text"
                              value={newAuthForm.code}
                              onChange={(e) => setNewAuthForm({ ...newAuthForm, code: e.target.value.toUpperCase() })}
                              placeholder="e.g. CCI"
                              className="w-full p-2 border rounded font-mono"
                              required
                            />
                          </div>
                          <div>
                            <label className="block font-semibold mb-1">Full Name</label>
                            <input
                              type="text"
                              value={newAuthForm.name}
                              onChange={(e) => setNewAuthForm({ ...newAuthForm, name: e.target.value })}
                              placeholder="e.g. Competition Commission of India"
                              className="w-full p-2 border rounded"
                              required
                            />
                          </div>
                          <div>
                            <label className="block font-semibold mb-1">Legal Category</label>
                            <select
                              value={newAuthForm.category_id}
                              onChange={(e) => setNewAuthForm({ ...newAuthForm, category_id: e.target.value })}
                              className="w-full p-2 border rounded"
                            >
                              <option value="">Select Category...</option>
                              {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block font-semibold mb-1">Official Website URL</label>
                            <input
                              type="url"
                              value={newAuthForm.website_url}
                              onChange={(e) => setNewAuthForm({ ...newAuthForm, website_url: e.target.value })}
                              placeholder="https://..."
                              className="w-full p-2 border rounded"
                            />
                          </div>
                          <div className="pt-2 flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setShowAddAuthorityModal(false)}
                              className="px-3 py-1.5 bg-slate-200 rounded text-xs"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-1.5 bg-amber-500 text-slate-950 font-bold rounded text-xs"
                            >
                              Save Authority
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Add Category Modal */}
                  {showAddCategoryModal && (
                    <div className="fixed inset-0 z-60 bg-slate-950/75 flex items-center justify-center p-4">
                      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                          <h4 className="font-serif font-bold text-slate-900">Add Legal Category</h4>
                          <button onClick={() => setShowAddCategoryModal(false)}>
                            <X className="w-5 h-5 text-slate-400" />
                          </button>
                        </div>
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            try {
                              await api.addCategory(newCategoryForm);
                              setShowAddCategoryModal(false);
                              setNewCategoryForm({ name: '', slug: '', description: '' });
                              onRefreshData();
                            } catch (err: any) {
                              alert(err.message);
                            }
                          }}
                          className="space-y-3 text-xs"
                        >
                          <div>
                            <label className="block font-semibold mb-1">Category Name</label>
                            <input
                              type="text"
                              value={newCategoryForm.name}
                              onChange={(e) => setNewCategoryForm({
                                ...newCategoryForm,
                                name: e.target.value,
                                slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                              })}
                              placeholder="e.g. Environmental & ESG Law"
                              className="w-full p-2 border rounded"
                              required
                            />
                          </div>
                          <div>
                            <label className="block font-semibold mb-1">URL Slug</label>
                            <input
                              type="text"
                              value={newCategoryForm.slug}
                              onChange={(e) => setNewCategoryForm({ ...newCategoryForm, slug: e.target.value })}
                              placeholder="e.g. esg-environmental-law"
                              className="w-full p-2 border rounded font-mono"
                              required
                            />
                          </div>
                          <div>
                            <label className="block font-semibold mb-1">Description</label>
                            <textarea
                              rows={3}
                              value={newCategoryForm.description}
                              onChange={(e) => setNewCategoryForm({ ...newCategoryForm, description: e.target.value })}
                              placeholder="Brief scope description..."
                              className="w-full p-2 border rounded"
                            />
                          </div>
                          <div className="pt-2 flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setShowAddCategoryModal(false)}
                              className="px-3 py-1.5 bg-slate-200 rounded text-xs"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-1.5 bg-amber-500 text-slate-950 font-bold rounded text-xs"
                            >
                              Save Category
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
};
