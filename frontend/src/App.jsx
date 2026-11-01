import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Users,
  CreditCard,
  PlusCircle,
  LogOut,
  Sparkles,
  CheckCircle,
  XCircle,
  Clock,
  QrCode,
  Banknote,
  UserPlus,
  Award,
  Calendar,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Globe,
  ArrowLeft,
  Edit3,
  Search,
  ChevronRight,
  ShieldCheck,
  Trash2
} from 'lucide-react';

import SpinningWheelModal from './components/SpinningWheelModal';
import AddMemberModal from './components/AddMemberModal';
import EditMemberModal from './components/EditMemberModal';
import PaymentModal from './components/PaymentModal';
import CreateGroupModal from './components/CreateGroupModal';
import EditGroupModal from './components/EditGroupModal';
import { translations } from './translations';
import { API_BASE_URL } from './config';

export default function App() {
  // Theme state: defaults to 'dark' or stored preference
  const [theme, setTheme] = useState(localStorage.getItem('kuri_theme') || 'dark');

  // Language state: defaults to 'en' (English) as requested!
  const [lang, setLang] = useState(localStorage.getItem('kuri_lang') || 'en');
  const t = translations[lang] || translations.en;

  // Sync theme with HTML document class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('kuri_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'ml' : 'en';
    setLang(nextLang);
    localStorage.setItem('kuri_lang', nextLang);
  };

  // Auth & Token state
  const [token, setToken] = useState(localStorage.getItem('kuri_token') || '');
  const [user, setUser] = useState(
    localStorage.getItem('kuri_user') ? JSON.parse(localStorage.getItem('kuri_user')) : null
  );

  // Auth form state
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Groups list & Selection state
  const [groupsData, setGroupsData] = useState({ adminGroups: [], memberGroups: [] });
  const [selectedGroup, setSelectedGroup] = useState(null); // null = List view, object = Details view
  const [groupFilter, setGroupFilter] = useState('ALL'); // 'ALL' | 'ADMIN' | 'MEMBER'
  const [searchQuery, setSearchQuery] = useState('');

  // Single Group details state
  const [activeTab, setActiveTab] = useState('members'); // 'members' | 'payments' | 'draws'
  const [groupDetails, setGroupDetails] = useState({ members: [], draws: [], isAdmin: false });
  const [payments, setPayments] = useState([]);
  const [loadingGroup, setLoadingGroup] = useState(false);

  // Modals
  const [showWheelModal, setShowWheelModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  // Handle Login / Register
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';
    const body = isLoginMode
      ? { email: authEmail, password: authPassword }
      : { name: authName, email: authEmail, password: authPassword };

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Authentication error');

      setToken(data.token);
      setUser(data);
      localStorage.setItem('kuri_token', data.token);
      localStorage.setItem('kuri_user', JSON.stringify(data));
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('kuri_token');
    localStorage.removeItem('kuri_user');
    setSelectedGroup(null);
  };

  // Fetch User's Groups
  const fetchGroups = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/kuri`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setGroupsData(data);
      }
    } catch (err) {
      console.error('Failed to load groups:', err);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [token]);

  // Fetch Selected Group Details & Payments
  const fetchGroupDetails = async () => {
    if (!selectedGroup || !token) return;
    setLoadingGroup(true);
    try {
      // 1. Group info & members & draws
      const resGroup = await fetch(`${API_BASE_URL}/api/kuri/${selectedGroup._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataGroup = await resGroup.json();
      if (resGroup.ok) {
        setGroupDetails(dataGroup);
        setSelectedGroup(dataGroup.group);
      }

      // 2. Payments list
      const resPayments = await fetch(`${API_BASE_URL}/api/payment/group/${selectedGroup._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataPayments = await resPayments.json();
      if (resPayments.ok) {
        setPayments(dataPayments);
      }
    } catch (err) {
      console.error('Error fetching group details:', err);
    } finally {
      setLoadingGroup(false);
    }
  };

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupDetails();
    }
  }, [selectedGroup?._id]);

  // Admin Payment Approval / Rejection
  const handlePaymentStatus = async (paymentId, action) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/payment/${paymentId}/${action}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        fetchGroupDetails();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMember = async (member) => {
    if (!window.confirm(
      lang === 'ml'
        ? `${member.name} (#${member.kuriNumber}) എന്ന മെമ്പറെ ഗ്രൂപ്പിൽ നിന്ന് ഒഴിവാക്കണമെന്ന് ഉറപ്പാണോ?`
        : `Are you sure you want to delete ${member.name} (#${member.kuriNumber}) from this group?`
    )) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/kuri/${selectedGroup._id}/members/${member._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete member');

      setGroupDetails((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m._id !== member._id),
      }));
    } catch (err) {
      alert(err.message);
    }
  };

  // Filtered Groups for Directory List
  const adminGroups = groupsData.adminGroups || [];
  const memberGroups = groupsData.memberGroups || [];
  const allGroups = [...adminGroups, ...memberGroups];

  const displayedGroups = allGroups.filter((g) => {
    const isAdm = adminGroups.some((ag) => ag._id === g._id);
    if (groupFilter === 'ADMIN' && !isAdm) return false;
    if (groupFilter === 'MEMBER' && isAdm) return false;
    if (searchQuery.trim()) {
      return g.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const isAdmin = groupDetails.isAdmin;

  // --- Auth View (When Logged Out) ---
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex items-center justify-center p-4 relative overflow-hidden transition-colors">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-indigo-500/10 dark:bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-purple-500/10 dark:bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Floating Top Controls (Theme & Language) */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 z-20">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 shadow-sm transition"
            title={t.toggleLanguage}
          >
            <Globe className="w-3.5 h-3.5 text-indigo-500" />
            <span>{lang === 'en' ? 'മലയാളം' : 'English'}</span>
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 shadow-sm transition"
            title={t.toggleTheme}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>

        <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25 mb-3">
              <Trophy className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {t.authPortalTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t.authPortalSubtitle}
            </p>
          </div>

          {/* Toggle Tab */}
          <div className="flex bg-slate-200/70 dark:bg-slate-900/80 p-1 rounded-2xl mb-6 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => { setIsLoginMode(true); setAuthError(''); }}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition ${
                isLoginMode
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.loginTab}
            </button>
            <button
              onClick={() => { setIsLoginMode(false); setAuthError(''); }}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition ${
                !isLoginMode
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.registerTab}
            </button>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-600 dark:text-rose-300">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLoginMode && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.yourName}
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder={t.namePlaceholder}
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 placeholder-slate-400"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.emailAddress}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder={t.emailPlaceholder}
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.password}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={t.passwordPlaceholder}
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-2.5 bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 placeholder-slate-400"
                />
                {/* Password Eye Toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                  title={showPassword ? t.hidePassword : t.showPassword}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition disabled:opacity-50"
            >
              {authLoading ? t.processing : isLoginMode ? t.loginButton : t.registerButton}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Main Application View (Header, Groups List OR Specific Group Dashboard) ---
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col transition-colors pb-12">
      {/* Top Mobile-Friendly App Header */}
      <header className="glass-panel sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-2.5 sm:gap-3">
          {selectedGroup ? (
            <button
              onClick={() => setSelectedGroup(null)}
              className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 text-xs font-bold transition"
              title={t.backToKuris}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{t.backToKuris}</span>
            </button>
          ) : (
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-md">
              <Trophy className="w-5 h-5" />
            </div>
          )}

          <div>
            <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white truncate max-w-[150px] sm:max-w-none">
              {selectedGroup ? selectedGroup.name : t.appTitle}
            </h1>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
              {selectedGroup ? `${t.monthNum} #${selectedGroup.currentMonth} / ${selectedGroup.totalMonths}` : `${t.hello}, ${user?.name}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Language Switch Button */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 shadow-sm transition"
            title={t.toggleLanguage}
          >
            <Globe className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-semibold text-[11px]">{lang === 'en' ? 'മല' : 'EN'}</span>
          </button>

          {/* Theme Switch Button */}
          <button
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 shadow-sm transition"
            title={t.toggleTheme}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* New Group Button */}
          <button
            onClick={() => setShowCreateGroupModal(true)}
            className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/25 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden md:inline">{t.newKuri}</span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title={t.logout}
            className="p-1.5 sm:p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200/60 dark:hover:bg-slate-900 transition"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-5">
        {/* ======================================================== */}
        {/* VIEW 1: ALL KURI GROUPS LIST (DIRECTORY VIEW)           */}
        {/* ======================================================== */}
        {!selectedGroup ? (
          <div className="space-y-5">
            {/* Title & Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {t.myKurisTitle}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.myKurisSubtitle}
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder={t.searchKurisPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 shadow-sm placeholder-slate-400"
                />
              </div>
            </div>

            {/* Filter Tabs: ALL | ADMIN | MEMBER */}
            <div className="flex items-center gap-1.5 bg-slate-200/60 dark:bg-slate-900/60 p-1 rounded-2xl w-fit border border-slate-200 dark:border-slate-800 text-xs">
              <button
                onClick={() => setGroupFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  groupFilter === 'ALL'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t.allTab} ({allGroups.length})
              </button>
              <button
                onClick={() => setGroupFilter('ADMIN')}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  groupFilter === 'ADMIN'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t.adminGroupsTab} ({adminGroups.length})
              </button>
              <button
                onClick={() => setGroupFilter('MEMBER')}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  groupFilter === 'MEMBER'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t.memberGroupsTab} ({memberGroups.length})
              </button>
            </div>

            {/* Groups Grid / List */}
            {displayedGroups.length === 0 ? (
              <div className="py-20 text-center glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800">
                <Trophy className="w-14 h-14 text-indigo-500 mx-auto mb-3 opacity-70" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t.noGroupsTitle}</h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                  {t.noGroupsDesc}
                </p>
                <button
                  onClick={() => setShowCreateGroupModal(true)}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition inline-flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{t.createGroupAction}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedGroups.map((grp) => {
                  const isGrpAdmin = adminGroups.some((ag) => ag._id === grp._id);
                  const progressPct = Math.min(100, Math.round(((grp.currentMonth - 1) / grp.totalMonths) * 100));

                  return (
                    <div
                      key={grp._id}
                      onClick={() => setSelectedGroup(grp)}
                      className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between group active:scale-[0.99]"
                    >
                      <div>
                        {/* Top Card Badges */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                              isGrpAdmin
                                ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/30'
                                : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {isGrpAdmin ? t.adminBadge : t.memberBadge}
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              grp.status === 'ACTIVE'
                                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {grp.status === 'ACTIVE' ? t.statusActive : t.statusCompleted}
                          </span>
                        </div>

                        {/* Title & Total Pool */}
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                          {grp.name}
                        </h3>
                        <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                          ₹{grp.totalAmount?.toLocaleString('en-IN')}
                        </div>

                        {/* Key Metrics */}
                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-800 text-xs">
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                              {t.monthlyInstallment}
                            </span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                              ₹{grp.monthlyInstallment?.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                              {t.dueDateLabel}
                            </span>
                            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                              {grp.dueDayOfMonth} {t.ofEveryMonth}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3">
                          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                            <span>{t.currentMonthProgress}</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              #{grp.currentMonth} / {grp.totalMonths}
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Card Action Footer */}
                      <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          <span>{t.openDashboard}</span>
                          <ChevronRight className="w-4 h-4" />
                        </span>

                        {isGrpAdmin && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedGroup(grp);
                              setShowEditGroupModal(true);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title={t.editKuri}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ======================================================== */
          /* VIEW 2: SELECTED KURI GROUP DASHBOARD                     */
          /* ======================================================== */
          <div className="space-y-5">
            {/* Group Banner / Header Bar */}
            <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      isAdmin
                        ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/30'
                        : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {isAdmin ? t.adminBadge : t.memberBadge}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      selectedGroup.status === 'ACTIVE'
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {selectedGroup.status === 'ACTIVE' ? t.statusActive : t.statusCompleted}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {selectedGroup.name}
                </h2>
              </div>

              {/* Admin Edit Group Button */}
              {isAdmin && (
                <button
                  onClick={() => setShowEditGroupModal(true)}
                  className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-500/30 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{t.editKuri}</span>
                </button>
              )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 transition-colors">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                  <span>{t.totalAmount}</span>
                  <Award className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
                  ₹{selectedGroup.totalAmount?.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {t.totalMembers}: {groupDetails.members?.length || 0}
                </div>
              </div>

              <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 transition-colors">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                  <span>{t.monthlyInstallment}</span>
                  <Banknote className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  ₹{selectedGroup.monthlyInstallment?.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {t.dueDateLabel} {selectedGroup.dueDayOfMonth}
                </div>
              </div>

              <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 transition-colors">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                  <span>{t.currentMonthProgress}</span>
                  <Calendar className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="text-lg sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  #{selectedGroup.currentMonth}
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">
                    / {selectedGroup.totalMonths}
                  </span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {selectedGroup.status === 'ACTIVE' ? t.statusActive : t.statusCompleted}
                </div>
              </div>

              <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between transition-colors">
                <div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                    <span>{t.yourRole}</span>
                    <Users className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                    {isAdmin ? t.adminRole : t.memberRole}
                  </div>
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  {isAdmin
                    ? `${groupDetails.draws?.length || 0} ${t.tabDraws}`
                    : `${groupDetails.members?.length || 0} ${t.tabMembers}`}
                </div>
              </div>
            </div>

            {/* Quick Actions & Tabs Bar */}
            <div className="glass-panel p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
              {/* Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setActiveTab('members')}
                  className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    activeTab === 'members'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                >
                  {t.tabMembers} ({groupDetails.members?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                    activeTab === 'payments'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{t.tabPayments}</span>
                  {payments.filter((p) => p.status === 'PENDING').length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
                      {payments.filter((p) => p.status === 'PENDING').length}
                    </span>
                  )}
                </button>
                {isAdmin && (
                  <button
                    onClick={() => setActiveTab('draws')}
                    className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                      activeTab === 'draws'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
                    }`}
                  >
                    {t.tabDraws} ({groupDetails.draws?.length || 0})
                  </button>
                )}
              </div>

              {/* Action Buttons (Touch Friendly) */}
              <div className="flex items-center gap-2 overflow-x-auto pt-1 sm:pt-0">
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-xl bg-teal-50 dark:bg-teal-600/30 hover:bg-teal-100 dark:hover:bg-teal-600/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>{t.actionPayDues}</span>
                </button>

                {isAdmin && (
                  <>
                    <button
                      onClick={() => setShowAddMemberModal(true)}
                      className="px-3 sm:px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{t.actionAddMember}</span>
                    </button>

                    <button
                      onClick={() => setShowWheelModal(true)}
                      className="px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 active:scale-95 transition flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{t.actionConductDraw}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* TAB CONTENT 1: Members (Mobile Responsive Cards & Desktop Table) */}
            {activeTab === 'members' && (
              <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.membersListTitle}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.membersListSubtitle}</p>
                  </div>
                </div>

                {groupDetails.members?.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                    {t.noMembersYet}
                  </div>
                ) : (
                  <>
                    {/* MOBILE CARD VIEW (Phone screens) */}
                    <div className="block md:hidden divide-y divide-slate-200 dark:divide-slate-800/60">
                      {groupDetails.members?.map((m) => (
                        <div key={m._id} className="p-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-300 font-black text-sm flex items-center justify-center flex-shrink-0">
                              #{m.kuriNumber}
                            </span>
                            <div>
                              <div className="font-bold text-sm text-slate-900 dark:text-white">{m.name}</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">{m.email}</div>
                              {m.phone && <div className="text-[10px] text-slate-400">{m.phone}</div>}
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0 flex flex-col items-end gap-1.5">
                            {m.hasWon ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-[10px] font-bold">
                                <Trophy className="w-3 h-3 text-amber-500" />
                                <span>{t.statusWon} #{m.wonMonth})</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium">
                                <Clock className="w-2.5 h-2.5 text-indigo-500" />
                                <span>{t.statusEligible}</span>
                              </span>
                            )}

                            {isAdmin && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingMember(m)}
                                  className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/30 transition"
                                  title={t.editMemberAction}
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMember(m)}
                                  className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/30 transition"
                                  title={t.deleteMemberAction}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* DESKTOP TABLE VIEW (Tablets and Desktops) */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">
                          <tr>
                            <th className="px-5 py-3">{t.colKuriNo}</th>
                            <th className="px-5 py-3">{t.colName}</th>
                            <th className="px-5 py-3">{t.colEmail}</th>
                            <th className="px-5 py-3">{t.colPhone}</th>
                            <th className="px-5 py-3">{t.colStatus}</th>
                            {isAdmin && <th className="px-5 py-3 text-right">{t.actionCol}</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                          {groupDetails.members?.map((m) => (
                            <tr key={m._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                              <td className="px-5 py-3.5">
                                <span className="px-3 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-300 font-extrabold text-base tracking-wider">
                                  #{m.kuriNumber}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">{m.name}</td>
                              <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 text-xs">{m.email}</td>
                              <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs">{m.phone || '-'}</td>
                              <td className="px-5 py-3.5">
                                {m.hasWon ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-xs font-semibold">
                                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                                    <span>{t.statusWon} #{m.wonMonth})</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs">
                                    <Clock className="w-3 h-3 text-indigo-500" />
                                    <span>{t.statusEligible}</span>
                                  </span>
                                )}
                              </td>
                              {isAdmin && (
                                <td className="px-5 py-3.5 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setEditingMember(m)}
                                      className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/30 transition"
                                      title={t.editMemberAction}
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteMember(m)}
                                      className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/30 transition"
                                      title={t.deleteMemberAction}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: Payments & Admin Approval (Mobile Responsive Cards & Desktop Table) */}
            {activeTab === 'payments' && (
              <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.paymentsTitle}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {isAdmin ? t.paymentsAdminSubtitle : t.paymentsMemberSubtitle}
                    </p>
                  </div>
                </div>

                {payments.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                    {t.noPaymentsYet}
                  </div>
                ) : (
                  <>
                    {/* MOBILE PAYMENT CARDS (Phone Screens) */}
                    <div className="block md:hidden divide-y divide-slate-200 dark:divide-slate-800/60">
                      {payments.map((p) => (
                        <div key={p._id} className="p-4 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-bold text-sm text-slate-900 dark:text-white">
                                {p.memberId?.name}
                              </span>
                              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold ml-1.5">
                                #{p.memberId?.kuriNumber}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                              {t.monthNum} #{p.month}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                              ₹{p.amount?.toLocaleString('en-IN')}
                            </div>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold ${
                                p.paymentMethod === 'UPI'
                                  ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
                                  : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                              }`}
                            >
                              {p.paymentMethod === 'UPI' ? <QrCode className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
                              <span>{p.paymentMethod}</span>
                            </span>
                          </div>

                          {p.transactionRef && (
                            <div className="text-[11px] text-slate-500 font-mono bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-lg truncate">
                              Ref: {p.transactionRef}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1">
                            <div>
                              {p.status === 'APPROVED' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                                  <CheckCircle className="w-3 h-3" />
                                  <span>{t.statusApproved}</span>
                                </span>
                              )}
                              {p.status === 'PENDING' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                                  <Clock className="w-3 h-3" />
                                  <span>{t.statusPending}</span>
                                </span>
                              )}
                              {p.status === 'REJECTED' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                                  <XCircle className="w-3 h-3" />
                                  <span>{t.statusRejected}</span>
                                </span>
                              )}
                            </div>

                            {/* Mobile Admin Action Buttons */}
                            {isAdmin && p.status === 'PENDING' && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handlePaymentStatus(p._id, 'approve')}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition"
                                >
                                  {t.actionApprove}
                                </button>
                                <button
                                  onClick={() => handlePaymentStatus(p._id, 'reject')}
                                  className="px-3 py-1.5 rounded-xl bg-rose-100 dark:bg-rose-600/30 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 font-bold text-xs transition"
                                >
                                  {t.actionReject}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* DESKTOP TABLE VIEW */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">
                          <tr>
                            <th className="px-5 py-3">{t.colMemberAndNo}</th>
                            <th className="px-5 py-3">{t.colMonth}</th>
                            <th className="px-5 py-3">{t.colAmount}</th>
                            <th className="px-5 py-3">{t.colMethod}</th>
                            <th className="px-5 py-3">{t.colRefNotes}</th>
                            <th className="px-5 py-3">{t.colStatus}</th>
                            {isAdmin && <th className="px-5 py-3 text-right">{t.colAction}</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                          {payments.map((p) => (
                            <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                              <td className="px-5 py-3.5">
                                <div className="font-semibold text-slate-900 dark:text-white">{p.memberId?.name}</div>
                                <div className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                                  #{p.memberId?.kuriNumber}
                                </div>
                              </td>
                              <td className="px-5 py-3.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                                {t.monthNum} #{p.month}
                              </td>
                              <td className="px-5 py-3.5 text-emerald-600 dark:text-emerald-400 font-bold">
                                ₹{p.amount?.toLocaleString('en-IN')}
                              </td>
                              <td className="px-5 py-3.5">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                    p.paymentMethod === 'UPI'
                                      ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30'
                                      : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                                  }`}
                                >
                                  {p.paymentMethod === 'UPI' ? <QrCode className="w-3.5 h-3.5" /> : <Banknote className="w-3.5 h-3.5" />}
                                  <span>{p.paymentMethod}</span>
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                                {p.transactionRef || p.remarks || '-'}
                              </td>
                              <td className="px-5 py-3.5">
                                {p.status === 'APPROVED' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span>{t.statusApproved}</span>
                                  </span>
                                )}
                                {p.status === 'PENDING' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{t.statusPending}</span>
                                  </span>
                                )}
                                {p.status === 'REJECTED' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>{t.statusRejected}</span>
                                  </span>
                                )}
                              </td>
                              {isAdmin && (
                                <td className="px-5 py-3.5 text-right">
                                  {p.status === 'PENDING' ? (
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => handlePaymentStatus(p._id, 'approve')}
                                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                                      >
                                        {t.actionApprove}
                                      </button>
                                      <button
                                        onClick={() => handlePaymentStatus(p._id, 'reject')}
                                        className="px-3 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-600/30 hover:bg-rose-200 dark:hover:bg-rose-600/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 text-xs font-bold transition"
                                      >
                                        {t.actionReject}
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-400">-</span>
                                  )}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: Draw History (Mobile Responsive Cards & Desktop Table) */}
            {activeTab === 'draws' && (
              <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.drawsTitle}</h3>
                </div>

                {groupDetails.draws?.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                    {t.noDrawsYet}
                  </div>
                ) : (
                  <>
                    {/* MOBILE DRAWS CARDS */}
                    <div className="block md:hidden divide-y divide-slate-200 dark:divide-slate-800/60">
                      {groupDetails.draws?.map((d) => (
                        <div key={d._id} className="p-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 font-black text-sm flex items-center justify-center flex-shrink-0">
                              #{d.kuriNumber}
                            </span>
                            <div>
                              <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                {t.monthNum} #{d.month}
                              </div>
                              <div className="font-bold text-sm text-slate-900 dark:text-white">
                                {d.winnerMemberId?.name || 'Winner'}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {new Date(d.drawDate).toLocaleDateString(lang === 'ml' ? 'ml-IN' : 'en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs text-slate-500 block">{t.colPrize}</span>
                            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                              ₹{d.prizeAmount?.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* DESKTOP TABLE VIEW */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">
                          <tr>
                            <th className="px-5 py-3">{t.colMonth}</th>
                            <th className="px-5 py-3">{t.colWinnerNumber}</th>
                            <th className="px-5 py-3">{t.colWinnerName}</th>
                            <th className="px-5 py-3">{t.colPrize}</th>
                            <th className="px-5 py-3">{t.colDate}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                          {groupDetails.draws?.map((d) => (
                            <tr key={d._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                              <td className="px-5 py-3.5 font-bold text-indigo-600 dark:text-indigo-400">
                                {t.monthNum} #{d.month}
                              </td>
                              <td className="px-5 py-3.5">
                                <span className="px-3 py-1 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold text-base border border-amber-300 dark:border-amber-500/40">
                                  #{d.kuriNumber}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                                {d.winnerMemberId?.name || 'Unknown'}
                              </td>
                              <td className="px-5 py-3.5 text-emerald-600 dark:text-emerald-400 font-bold">
                                ₹{d.prizeAmount?.toLocaleString('en-IN')}
                              </td>
                              <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                                {new Date(d.drawDate).toLocaleDateString(lang === 'ml' ? 'ml-IN' : 'en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* MODALS                                                   */}
      {/* ======================================================== */}
      {showWheelModal && selectedGroup && (
        <SpinningWheelModal
          groupId={selectedGroup._id}
          currentMonth={selectedGroup.currentMonth}
          groupName={selectedGroup.name}
          totalAmount={selectedGroup.totalAmount}
          lang={lang}
          onClose={() => setShowWheelModal(false)}
          onDrawComplete={() => {
            fetchGroupDetails();
            fetchGroups();
          }}
        />
      )}

      {showAddMemberModal && selectedGroup && (
        <AddMemberModal
          groupId={selectedGroup._id}
          groupName={selectedGroup.name}
          lang={lang}
          onClose={() => setShowAddMemberModal(false)}
          onMemberAdded={() => fetchGroupDetails()}
        />
      )}

      {showPaymentModal && selectedGroup && (
        <PaymentModal
          groupId={selectedGroup._id}
          groupName={selectedGroup.name}
          monthlyInstallment={selectedGroup.monthlyInstallment}
          currentMonth={selectedGroup.currentMonth}
          lang={lang}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSubmitted={() => fetchGroupDetails()}
        />
      )}

      {showCreateGroupModal && (
        <CreateGroupModal
          lang={lang}
          onClose={() => setShowCreateGroupModal(false)}
          onGroupCreated={(newGroup) => {
            fetchGroups();
            setSelectedGroup(newGroup);
          }}
        />
      )}

      {showEditGroupModal && selectedGroup && (
        <EditGroupModal
          group={selectedGroup}
          lang={lang}
          onClose={() => setShowEditGroupModal(false)}
          onGroupUpdated={(updatedGroup) => {
            setSelectedGroup(updatedGroup);
            fetchGroups();
            fetchGroupDetails();
          }}
        />
      )}

      {editingMember && selectedGroup && (
        <EditMemberModal
          member={editingMember}
          groupId={selectedGroup._id}
          lang={lang}
          onClose={() => setEditingMember(null)}
          onMemberUpdated={(updatedMember) => {
            setGroupDetails((prev) => ({
              ...prev,
              members: prev.members.map((m) => (m._id === updatedMember._id ? updatedMember : m)),
            }));
            setEditingMember(null);
          }}
        />
      )}
    </div>
  );
}
