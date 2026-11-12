import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Calendar,
  FileText,
  Sparkles,
  ArrowRight,
  AlertCircle,
  X,
  Home,
  Bookmark,
  Lock,
  LogOut,
  ChevronDown,
  Scale,
  LayoutGrid,
  User,
  Plus,
  Settings,
  Bell,
} from 'lucide-react';
import { UpdateCard } from './components/UpdateCard.tsx';
import { UpdateDetailPage } from './pages/UpdateDetailPage.tsx';
import { DailyBulletinPage } from './pages/DailyBulletinPage.tsx';
import { AdminConsolePage } from './pages/AdminConsolePage.tsx';
import { AboutPage } from './pages/AboutPage.tsx';
import { UpdateDetailModal } from './components/UpdateDetailModal.tsx';
import { DailyBulletinModal } from './components/DailyBulletinModal.tsx';
import { AboutModal } from './components/AboutModal.tsx';
import { AdminModal } from './components/AdminModal.tsx';
import { api } from './api.ts';
import type { Category, Authority, LegalUpdate } from './types.ts';

type SidebarTab = 'home' | 'categories' | 'bulletin' | 'calendar' | 'settings' | 'about';

export default function App() {
  // Master data
  const [categories, setCategories] = useState<Category[]>([]);
  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [updates, setUpdates] = useState<LegalUpdate[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 9, totalPages: 1 });
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAuthority, setSelectedAuthority] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);

  // Active sidebar tab (for tooltip / highlight)
  const [activeTab, setActiveTab] = useState<SidebarTab>('home');
  type PageView = 'home' | 'update_detail' | 'bulletin' | 'admin' | 'about';
  const [currentView, setCurrentView] = useState<PageView>('home');

  // Modals
  const [selectedUpdate, setSelectedUpdate] = useState<LegalUpdate | null>(null);
  const [dailyBulletinOpen, setDailyBulletinOpen] = useState<boolean>(false);
  const [aboutOpen, setAboutOpen] = useState<boolean>(false);
  const [adminOpen, setAdminOpen] = useState<boolean>(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);

  // Category flyout on hover
  const [catFlyoutOpen, setCatFlyoutOpen] = useState<boolean>(false);

  useEffect(() => {
    loadMetadata();
    checkAdminAuth();
    const path = window.location.pathname;
    const match = path.match(/\/bulletin\/[^/]+\/([^/]+)/);
    if (match && match[1]) {
      api.getUpdateBySlug(match[1]).then((up) => {
        setSelectedUpdate(up);
        setCurrentView('update_detail');
      }).catch(() => {});
    }

    const handlePopState = () => {
      const p = window.location.pathname;
      const m = p.match(/\/bulletin\/[^/]+\/([^/]+)/);
      if (m && m[1]) {
        api.getUpdateBySlug(m[1]).then((up) => {
          setSelectedUpdate(up);
          setCurrentView('update_detail');
        }).catch(() => {});
      } else {
        setSelectedUpdate(null);
        setCurrentView('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const loadMetadata = async () => {
    try {
      const [cats, auths] = await Promise.all([api.getCategories(), api.getAuthorities()]);
      setCategories(cats);
      setAuthorities(auths);
    } catch (err) {
      console.error('Failed to load metadata:', err);
    }
  };

  const checkAdminAuth = async () => {
    const token = localStorage.getItem('mk_admin_token');
    if (token) {
      try { await api.getMe(); setIsAdminLoggedIn(true); }
      catch { setIsAdminLoggedIn(false); }
    } else { setIsAdminLoggedIn(false); }
  };

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => { loadUpdates(1); }, [selectedCategory, selectedAuthority, debouncedQuery, dateFrom, dateTo]);

  const loadUpdates = async (page: number) => {
    setLoading(true);
    try {
      const res = await api.getUpdates({
        q: debouncedQuery || undefined,
        category: selectedCategory || undefined,
        authority: selectedAuthority || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        limit: 9,
      });
      setUpdates(res.updates);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to load updates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUpdate = async (update: LegalUpdate) => {
    setSelectedUpdate(update);
    setCurrentView('update_detail');
    window.history.pushState({}, '', `/bulletin/${update.category_slug}/${update.slug}`);
    try {
      const full = await api.getUpdateBySlug(update.slug);
      setSelectedUpdate(full);
    } catch {
      // retain update
    }
  };

  const handleCloseDetailModal = () => {
    setSelectedUpdate(null);
    window.history.pushState({}, '', '/');
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSelectedAuthority('');
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
  };

  const hasFilters = selectedCategory || selectedAuthority || searchQuery || dateFrom || dateTo;
  const featuredUpdate = updates.length > 0 ? updates[0] : null;
  const remainingUpdates = updates.length > 1 ? updates.slice(1) : [];

  /* ─────────────────────────────────────────────
     SIDEBAR NAV ITEMS
  ───────────────────────────────────────────── */
  const navItems: { id: SidebarTab; icon: React.ElementType; label: string; onClick: () => void }[] = [
    {
      id: 'home',
      icon: Home,
      label: 'All Updates',
      onClick: () => {
        setActiveTab('home');
        setCurrentView('home');
        setSelectedCategory('');
        setFiltersOpen(false);
        setCatFlyoutOpen(false);
      },
    },
    {
      id: 'categories',
      icon: LayoutGrid,
      label: 'Categories',
      onClick: () => {
        setActiveTab('categories');
        setCatFlyoutOpen((v) => !v);
      },
    },
    {
      id: 'bulletin',
      icon: FileText,
      label: 'Daily Bulletin',
      onClick: () => {
        setActiveTab('bulletin');
        setCurrentView('bulletin');
        setCatFlyoutOpen(false);
      },
    },
    {
      id: 'calendar',
      icon: Calendar,
      label: 'Date Filter',
      onClick: () => {
        setActiveTab('calendar');
        setFiltersOpen((v) => !v);
      },
    },
    {
      id: 'settings',
      icon: isAdminLoggedIn ? Lock : Settings,
      label: isAdminLoggedIn ? 'Admin Console' : 'Admin Login',
      onClick: () => {
        setActiveTab('settings');
        setCurrentView('admin');
        setCatFlyoutOpen(false);
      },
    },
    {
      id: 'about',
      icon: User,
      label: 'About / Editorial',
      onClick: () => {
        setActiveTab('about');
        setCurrentView('about');
        setCatFlyoutOpen(false);
      },
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4f4f5] flex font-sans text-gray-900">

      {/* ═══════════════════════════════════
          NARROW ICON-ONLY SIDEBAR
          Exactly like reference image:
          ~56px wide, black bg, centered icons
      ═══════════════════════════════════ */}
      <aside className="fixed left-0 top-0 h-full w-14 bg-black flex flex-col items-center py-4 z-50 print:hidden">

        {/* ── LOGO ── "A" initial in white rounded box */}
        <button
          onClick={() => { setActiveTab('home'); setCurrentView('home'); setSelectedCategory(''); }}
          className="w-9 h-9 rounded-xl bg-white flex items-center justify-center mb-6 hover:bg-gray-100 transition-colors flex-shrink-0 shadow-sm"
          title="MK Legal Bulletin"
        >
          <span className="text-black font-black text-base leading-none select-none">M</span>
        </button>

        {/* ── MAIN NAV ICONS ── */}
        <nav className="flex flex-col items-center gap-1 flex-1">
          {navItems.map(({ id, icon: Icon, label, onClick }) => {
            const isActive = activeTab === id;
            return (
              <div key={id} className="relative group">
                <button
                  onClick={onClick}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 ${
                    isActive
                      ? 'bg-white text-black shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                  title={label}
                >
                  <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.5 : 2} />
                </button>

                {/* Tooltip on hover */}
                <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-150 z-[9999] shadow-xl">
                  {label}
                  <span className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-[5px] border-y-transparent border-r-[7px] border-r-gray-900" />
                </div>
              </div>
            );
          })}
        </nav>

        {/* ── BOTTOM: Logout (if admin) + Plus button ── */}
        <div className="flex flex-col items-center gap-2 mt-auto">
          {isAdminLoggedIn && (
            <div className="relative group">
              <button
                onClick={() => { localStorage.removeItem('mk_admin_token'); setIsAdminLoggedIn(false); }}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-white/10 transition-all"
                title="Sign Out"
              >
                <LogOut className="w-[18px] h-[18px]" strokeWidth={2} />
              </button>
              <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-150 z-[9999] shadow-xl">
                Sign Out
                <span className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-[5px] border-y-transparent border-r-[7px] border-r-gray-900" />
              </div>
            </div>
          )}

          {/* + Button — like the reference image bottom "+" */}
          <div className="relative group">
            <button
              onClick={() => setFiltersOpen((v) => !v)}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all border border-white/10"
              title="Filters"
            >
              <Plus className="w-[18px] h-[18px]" strokeWidth={2} />
            </button>
            <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-150 z-[9999] shadow-xl">
              Filters
              <span className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-[5px] border-y-transparent border-r-[7px] border-r-gray-900" />
            </div>
          </div>
        </div>
      </aside>

      {/* ── Category flyout panel (slides out from sidebar) ── */}
      {catFlyoutOpen && (
        <div
          className="fixed left-14 top-0 h-full w-56 bg-white border-r border-gray-200 z-40 shadow-xl flex flex-col py-4 px-3 print:hidden"
          onMouseLeave={() => setCatFlyoutOpen(false)}
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Categories</span>
            <button onClick={() => setCatFlyoutOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => { setSelectedCategory(''); setCatFlyoutOpen(false); }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === '' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            All Updates
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.slug); setCatFlyoutOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${selectedCategory === cat.slug ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <span className="truncate">{cat.name}</span>
              {cat.published_updates_count !== undefined && cat.published_updates_count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0 ${selectedCategory === cat.slug ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {cat.published_updates_count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════
          MAIN CONTENT AREA  (ml-14 for sidebar)
      ═══════════════════════════════════ */}
      <div className="flex-1 ml-14 flex flex-col min-h-screen">
        {/* Full Page View: Update Detail */}
        {currentView === 'update_detail' && selectedUpdate && (
          <UpdateDetailPage
            update={selectedUpdate}
            onBack={() => {
              setCurrentView('home');
              setSelectedUpdate(null);
              window.history.pushState({}, '', '/');
            }}
          />
        )}

        {/* Full Page View: Daily Bulletin */}
        {currentView === 'bulletin' && (
          <DailyBulletinPage
            onBack={() => {
              setActiveTab('home');
              setCurrentView('home');
            }}
            onSelectUpdate={(up) => {
              handleSelectUpdate(up);
            }}
          />
        )}

        {/* Full Page View: Admin Console */}
        {currentView === 'admin' && (
          <AdminConsolePage
            onBack={() => {
              setActiveTab('home');
              setCurrentView('home');
            }}
            categories={categories}
            authorities={authorities}
            onRefreshData={() => {
              loadMetadata();
              loadUpdates(1);
              checkAdminAuth();
              setTimeout(() => setIsAdminLoggedIn(localStorage.getItem('mk_admin_token') !== null), 100);
            }}
          />
        )}

        {/* Full Page View: About & Editorial */}
        {currentView === 'about' && (
          <AboutPage
            onBack={() => {
              setActiveTab('home');
              setCurrentView('home');
            }}
          />
        )}

        {/* Full Page View: Home Feed */}
        {currentView === 'home' && (
          <>
        {/* ── TOP BAR — search + user avatar (like reference image) ── */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-5 py-3 flex items-center gap-3 shadow-[0_1px_0_0_rgba(0,0,0,0.06)]">

          {/* Search — reference image style: left-aligned, icon inside */}
          <div className="flex-1 relative max-w-lg">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Act, Section, Case, Circular..."
              className="w-full pl-10 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-black focus:bg-white transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Notification bell */}
          <button className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors" title="Notifications">
            <Bell className="w-4.5 h-4.5 w-[18px] h-[18px]" />
          </button>

          {/* User avatar — like reference image top right */}
          <button
            onClick={() => {
              setActiveTab('settings');
              setCurrentView('admin');
            }}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
            title={isAdminLoggedIn ? 'Admin Console' : 'Admin Login'}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${isAdminLoggedIn ? 'bg-black text-amber-400' : 'bg-gray-200 text-gray-600'}`}>
              {isAdminLoggedIn ? 'MK' : <Lock className="w-4 h-4" />}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-gray-800 leading-none">
                {isAdminLoggedIn ? 'Manish Khandelwal' : 'Admin Login'}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-none">
                {isAdminLoggedIn ? 'Administrator' : 'mklegal.in'}
              </p>
            </div>
          </button>
        </header>

        {/* ── FILTER BAR (collapsible) ── */}
        {filtersOpen && (
          <div className="bg-white border-b border-gray-100 px-5 py-3 flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Filters:
            </span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-black"
            >
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
            </select>
            <select
              value={selectedAuthority}
              onChange={(e) => setSelectedAuthority(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-black"
            >
              <option value="">All Authorities</option>
              {authorities.map((a) => <option key={a.id} value={a.code}>{a.code} — {a.name}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">From:</span>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-black" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">To:</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-black" />
            </div>
            {hasFilters && (
              <button onClick={handleClearFilters} className="px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-800 underline">
                Reset All
              </button>
            )}
            <button onClick={() => setFiltersOpen(false)} className="ml-auto text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── PAGE HEADER ── */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                {selectedCategory
                  ? categories.find((c) => c.slug === selectedCategory)?.name || 'Updates'
                  : selectedAuthority
                  ? `${authorities.find((a) => a.code === selectedAuthority)?.name || selectedAuthority} Bulletins`
                  : searchQuery
                  ? `Results for "${searchQuery}"`
                  : 'Hi, Manish Khandelwal.'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {selectedCategory || selectedAuthority || searchQuery
                  ? `${pagination.total} verified records found`
                  : 'Your official legal & regulatory intelligence dashboard — Manish Khandelwal & Co.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Filter toggle chip */}
              <button
                onClick={() => setFiltersOpen((v) => !v)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  hasFilters
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />}
              </button>

              {/* Daily Bulletin CTA */}
              <button
                onClick={() => {
                  setActiveTab('bulletin');
                  setCurrentView('bulletin');
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-black text-white hover:bg-gray-800 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Daily Bulletin
              </button>
            </div>
          </div>

          {/* Regulatory coverage pills */}
          {!selectedCategory && !searchQuery && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-400 font-medium mr-1">Active Portals:</span>
              {['CBDT', 'CBIC', 'MCA', 'IBBI', 'SEBI', 'RBI', 'Supreme Court', 'High Courts', 'ITAT', 'NCLAT', 'CESTAT'].map((name) => {
                const authorityCode =
                  name === 'Supreme Court' ? 'SCI' : name === 'High Courts' ? 'HC' : name;
                const isSelected = selectedAuthority === authorityCode;
                return (
                  <button
                    key={name}
                    onClick={() => setSelectedAuthority(isSelected ? '' : authorityCode)}
                    className={`text-xs px-3 py-1 rounded-lg font-medium transition-all shadow-sm border cursor-pointer ${
                      isSelected
                        ? 'bg-black text-amber-400 border-black ring-1 ring-black'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400 hover:text-black hover:bg-gray-50'
                    }`}
                  >
                    {name}
                    {isSelected && <span className="ml-1 text-xs text-amber-300">✕</span>}
                  </button>
                );
              })}
              {selectedAuthority && (
                <button
                  onClick={() => setSelectedAuthority('')}
                  className="text-xs text-red-600 hover:underline font-semibold ml-2 cursor-pointer"
                >
                  Clear filter
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 px-6 pb-8">
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">Loading verified legal intelligence records...</p>
            </div>
          ) : updates.length === 0 ? (
            <div className="py-20 text-center max-w-sm mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No matching updates found</h3>
              <p className="text-sm text-gray-500">Try resetting the filters or clearing your search query.</p>
              <button onClick={handleClearFilters} className="bg-black text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-colors">
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Featured */}
              {pagination.page === 1 && !searchQuery && featuredUpdate && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Lead Statutory Update & Precedent</span>
                  </div>
                  <UpdateCard update={featuredUpdate} onSelect={handleSelectUpdate} featured={true} />
                </div>
              )}

              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {(pagination.page === 1 && !searchQuery ? remainingUpdates : updates).map((item) => (
                  <UpdateCard key={item.id} update={item} onSelect={handleSelectUpdate} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="pt-6 border-t border-gray-200 flex items-center justify-between">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => loadUpdates(pagination.page - 1)}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-500">
                    Page <strong className="text-gray-900">{pagination.page}</strong> of <strong className="text-gray-900">{pagination.totalPages}</strong>
                  </span>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => loadUpdates(pagination.page + 1)}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </main>

          </>
        )}

        {/* ── FOOTER ── */}
        <footer className="bg-white border-t border-gray-100 px-6 py-3 text-center text-xs text-gray-400">
          <span className="font-semibold text-gray-600">MK PROFESSIONAL LEGAL BULLETIN</span>
          {' '}• Published by Manish Khandelwal & Co. •{' '}
          <a href="mailto:legal@mklegal.in" className="hover:text-black transition-colors">legal@mklegal.in</a>
        </footer>
      </div>


    </div>
  );
}
