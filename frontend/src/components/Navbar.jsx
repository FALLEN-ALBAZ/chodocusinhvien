import React from 'react';
import {
  ShoppingBag,
  PlusCircle,
  Heart,
  Handshake,
  ShieldCheck,
  Terminal,
  LogOut,
  LogIn,
  UserPlus,
  Star,
  Sparkles,
  BookOpen,
  ExternalLink,
  CheckCircle2,
  Clock,
  Users,
} from 'lucide-react';
import { DEMO_ACCOUNTS, ROLE_META } from '../api';

export default function Navbar({
  activeTab,
  setActiveTab,
  currentUser,
  onQuickDemoLogin,
  switchingRole,
  onOpenAuthModal,
  onLogout,
  stats,
  favoritesCount = 0,
  pendingReceivedOffersCount = 0,
}) {
  const isStaff =
    currentUser?.role === 'MODERATOR' || currentUser?.role === 'ADMIN';
  const pendingModerationTotal =
    (stats?.pending_listings || 0) + (stats?.pending_reports || 0);

  const navItems = [
    {
      id: 'marketplace',
      label: 'Khám phá Chợ',
      icon: ShoppingBag,
      badge: stats?.approved_listings || null,
      badgeColor: 'bg-indigo-100 text-indigo-700',
    },
    {
      id: 'create',
      label: 'Đăng tin bán đồ',
      icon: PlusCircle,
      highlight: true,
    },
    {
      id: 'favorites',
      label: 'Tin yêu thích (N:N)',
      icon: Heart,
      badge: favoritesCount > 0 ? favoritesCount : null,
      badgeColor: 'bg-rose-100 text-rose-700',
    },
    {
      id: 'dashboard',
      label: 'Quản lý Giao dịch & Cá nhân',
      icon: Handshake,
      badge: pendingReceivedOffersCount > 0 ? pendingReceivedOffersCount : null,
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'moderation',
      label: 'Bàn làm việc Kiểm duyệt',
      icon: ShieldCheck,
      staffHighlight: isStaff,
      badge: pendingModerationTotal > 0 ? pendingModerationTotal : null,
      badgeColor: 'bg-amber-200 text-amber-900',
    },
    {
      id: 'demolab',
      label: 'Trạm Kiểm Thử 8 Bước ĐG2',
      icon: Terminal,
      badge: 'Lab',
      badgeColor: 'bg-purple-100 text-purple-800',
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      {/* Thanh trên cùng: Chuyển đổi nhanh 1-Click 3 Tác nhân Demo & Thống kê nhanh */}
      <div className="bg-slate-900 text-slate-100 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Khu vực 1-Click Demo Role Switcher */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 font-semibold text-amber-400 mr-1">
              <Sparkles className="w-3.5 h-3.5" />
              Chuyển nhanh Tác nhân Demo (1-Click):
            </span>
            {DEMO_ACCOUNTS.map((acc) => {
              const isCurrent =
                currentUser?.email?.toLowerCase() === acc.email.toLowerCase();
              return (
                <button
                  key={acc.key}
                  type="button"
                  disabled={switchingRole}
                  onClick={() => onQuickDemoLogin(acc)}
                  title={`${acc.fullTitle} — ${acc.description}`}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium transition-all ${
                    isCurrent
                      ? 'bg-white text-slate-900 ring-2 ring-amber-400 shadow-sm font-bold'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  } ${switchingRole ? 'opacity-60 cursor-wait' : ''}`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isCurrent ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                    }`}
                  />
                  <span>{acc.label}</span>
                  <span className="text-[10px] opacity-75 hidden sm:inline">
                    ({acc.email.split('@')[0]})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Khu vực Thống kê nhanh Hệ thống & Link Swagger */}
          <div className="hidden lg:flex items-center gap-4 text-slate-300">
            {stats && (
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Đang bán: <strong className="text-white">{stats.approved_listings}</strong>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Chờ duyệt: <strong className="text-white">{stats.pending_listings}</strong>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Handshake className="w-3.5 h-3.5 text-rose-400" />
                  Đã bán: <strong className="text-white">{stats.sold_listings}</strong>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-sky-400" />
                  Thành viên: <strong className="text-white">{stats.total_users}</strong>
                </span>
              </div>
            )}
            <a
              href="/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-indigo-300 hover:text-indigo-200 font-medium underline underline-offset-2"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Swagger OpenAPI
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Thanh chính: Thương hiệu + Thông tin tài khoản đang đăng nhập */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Logo & Tên dự án */}
        <div
          onClick={() => setActiveTab('marketplace')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900">
                Chợ Đồ Cũ Sinh Viên
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
                HPU Campus
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Trao đổi giáo trình, đồ điện tử, gia dụng phòng trọ an toàn &amp; minh bạch
            </p>
          </div>
        </div>

        {/* Khu vực trạng thái User */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 rounded-2xl px-3 py-1.5">
              <img
                src={
                  currentUser.avatar_url ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.email}`
                }
                alt={currentUser.full_name}
                className="w-9 h-9 rounded-full bg-white border border-slate-200 object-cover"
              />
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-slate-800 line-clamp-1">
                    {currentUser.full_name}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      ROLE_META[currentUser.role]?.badge ||
                      'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {ROLE_META[currentUser.role]?.label || currentUser.role}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{currentUser.email}</span>
                  <span className="inline-flex items-center gap-0.5 text-amber-600 font-semibold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {Number(currentUser.reputation_score ?? 5.0).toFixed(1)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                title="Đăng xuất tài khoản"
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenAuthModal('login')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                <LogIn className="w-4 h-4 text-indigo-600" />
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => onOpenAuthModal('register')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Đăng ký SV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Thanh các Tab Điều hướng Nghiệp vụ */}
      <div className="max-w-7xl mx-auto px-4 border-t border-slate-100">
        <nav className="flex items-center gap-1 overflow-x-auto py-1.5 no-scrollbar">
          {navItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : tab.staffHighlight
                    ? 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
                {tab.badge !== null && tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 text-[11px] font-bold rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : tab.badgeColor || 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
