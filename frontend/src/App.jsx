import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Heart,
  Star,
  PlusCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Tag,
  CheckCircle2,
  AlertCircle,
  Info,
  BookOpen,
  Laptop,
  Home,
  Bike,
  Shirt,
  Package,
} from 'lucide-react';
import {
  apiRequest,
  formatVND,
  CONDITION_META,
  STATUS_META,
  DEMO_ACCOUNTS,
  getListingThumbnail,
} from './api';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import ListingDetailModal from './components/ListingDetailModal';
import CreateListingView from './components/CreateListingView';
import TransactionsView from './components/TransactionsView';
import ModerationView from './components/ModerationView';
import DefenseLabView from './components/DefenseLabView';

const CATEGORY_ICON_MAP = {
  BookOpen,
  Laptop,
  Home,
  Bike,
  Shirt,
  Package,
};

export default function App() {
  // Điều hướng Tab chính
  const [activeTab, setActiveTab] = useState('marketplace');

  // Trạng thái Xác thực (Lưu localStorage để duy trì phiên đăng nhập)
  const [token, setToken] = useState(
    () => localStorage.getItem('chodocu_token') || ''
  );
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('chodocu_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [switchingRole, setSwitchingRole] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  // Thông báo Toast nổi trên góc màn hình
  const [notification, setNotification] = useState(null);
  const showNotify = useCallback((message, type = 'info') => {
    setNotification({ message, type, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4500);
    return () => clearTimeout(timer);
  }, [notification]);

  // Dữ liệu Danh mục & Thống kê toàn hệ thống
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);

  // Bộ lọc Tìm kiếm & Phân trang trên Chợ công khai
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [includeSold, setIncludeSold] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const pageSize = 9;

  // Danh sách tin trên chợ
  const [marketplaceData, setMarketplaceData] = useState({
    items: [],
    total: 0,
    page: 1,
    page_size: 9,
    total_pages: 1,
  });
  const [loadingMarketplace, setLoadingMarketplace] = useState(false);

  // Dữ liệu cá nhân của người dùng đang đăng nhập
  const [favoriteListings, setFavoriteListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [receivedOffers, setReceivedOffers] = useState([]);
  const [sentOffers, setSentOffers] = useState([]);

  // Modal xem chi tiết tin đăng & Chế độ chỉnh sửa tin
  const [selectedListing, setSelectedListing] = useState(null);
  const [editingListing, setEditingListing] = useState(null);

  // Lưu thông tin đăng nhập
  const handleAuthSuccess = useCallback(
    (tokenRes, customMsg) => {
      const accessToken = tokenRes.access_token;
      const userObj = tokenRes.user;
      setToken(accessToken);
      setCurrentUser(userObj);
      localStorage.setItem('chodocu_token', accessToken);
      localStorage.setItem('chodocu_user', JSON.stringify(userObj));
      if (customMsg) {
        showNotify(customMsg, 'success');
      }
    },
    [showNotify]
  );

  // Đăng xuất
  const handleLogout = useCallback(() => {
    setToken('');
    setCurrentUser(null);
    localStorage.removeItem('chodocu_token');
    localStorage.removeItem('chodocu_user');
    setFavoriteListings([]);
    setMyListings([]);
    setReceivedOffers([]);
    setSentOffers([]);
    showNotify('Đã đăng xuất khỏi hệ thống.', 'info');
  }, [showNotify]);

  // Chuyển đổi nhanh 1-Click giữa 3 Tác nhân Demo
  const handleQuickDemoLogin = useCallback(
    async (demoAcc) => {
      setSwitchingRole(true);
      try {
        const res = await apiRequest('/auth/login', {
          method: 'POST',
          body: { email: demoAcc.email, password: demoAcc.password },
        });
        handleAuthSuccess(
          res,
          `Đã chuyển sang tác nhân: ${demoAcc.fullTitle} (${demoAcc.role})`
        );
        if (demoAcc.role === 'MODERATOR' && activeTab === 'marketplace') {
          // Giữ tab hoặc cho phép bấm sang Bàn làm việc Kiểm duyệt
        }
      } catch (err) {
        showNotify(err.message, 'error');
      } finally {
        setSwitchingRole(false);
      }
    },
    [handleAuthSuccess, showNotify, activeTab]
  );

  // Tải Danh mục & Thống kê tổng quan
  const fetchCategoriesAndStats = useCallback(async () => {
    try {
      const [catsRes, statsRes] = await Promise.all([
        apiRequest('/categories'),
        apiRequest('/stats/overview'),
      ]);
      if (Array.isArray(catsRes)) setCategories(catsRes);
      if (statsRes) setStats(statsRes);
    } catch {
      // Bỏ qua lỗi mạng lúc khởi động
    }
  }, []);

  // Tải danh sách tin đăng công khai trên Chợ
  const fetchMarketplaceListings = useCallback(async () => {
    setLoadingMarketplace(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (selectedCategoryId) params.set('category_id', selectedCategoryId);
      if (minPrice !== '') params.set('min_price', minPrice);
      if (maxPrice !== '') params.set('max_price', maxPrice);
      if (selectedCondition) params.set('condition', selectedCondition);
      if (includeSold) params.set('include_sold', 'true');
      params.set('sort_by', sortBy);
      params.set('page', String(page));
      params.set('page_size', String(pageSize));

      const res = await apiRequest(`/listings?${params.toString()}`, {
        token: token || undefined,
      });
      if (res && Array.isArray(res.items)) {
        setMarketplaceData(res);
      }
    } catch (err) {
      showNotify(err.message, 'error');
    } finally {
      setLoadingMarketplace(false);
    }
  }, [
    searchQuery,
    selectedCategoryId,
    minPrice,
    maxPrice,
    selectedCondition,
    includeSold,
    sortBy,
    page,
    token,
    showNotify,
  ]);

  // Tải dữ liệu cá nhân (Hồ sơ mới nhất, Yêu thích, Tin của tôi, Đề nghị mua nhận/gửi)
  const fetchPersonalData = useCallback(async () => {
    if (!token) return;
    try {
      const [meRes, favsRes, myRes, recRes, sentRes] = await Promise.all([
        apiRequest('/auth/me', { token }),
        apiRequest('/users/me/favorites', { token }),
        apiRequest('/listings/my', { token }),
        apiRequest('/offers/received', { token }),
        apiRequest('/offers/sent', { token }),
      ]);
      if (meRes) {
        setCurrentUser(meRes);
        localStorage.setItem('chodocu_user', JSON.stringify(meRes));
      }
      setFavoriteListings(Array.isArray(favsRes) ? favsRes : []);
      setMyListings(Array.isArray(myRes) ? myRes : []);
      setReceivedOffers(Array.isArray(recRes) ? recRes : []);
      setSentOffers(Array.isArray(sentRes) ? sentRes : []);
    } catch (err) {
      if (err.status === 401) {
        handleLogout();
      }
    }
  }, [token, handleLogout]);

  // Làm mới toàn bộ dữ liệu
  const refreshAllData = useCallback(async () => {
    await Promise.all([
      fetchCategoriesAndStats(),
      fetchMarketplaceListings(),
      fetchPersonalData(),
    ]);
    if (selectedListing?.id) {
      try {
        const detail = await apiRequest(`/listings/${selectedListing.id}`, {
          token: token || undefined,
        });
        setSelectedListing(detail);
      } catch {
        setSelectedListing(null);
      }
    }
  }, [
    fetchCategoriesAndStats,
    fetchMarketplaceListings,
    fetchPersonalData,
    selectedListing?.id,
    token,
  ]);

  useEffect(() => {
    fetchCategoriesAndStats();
  }, [fetchCategoriesAndStats]);

  useEffect(() => {
    fetchMarketplaceListings();
  }, [fetchMarketplaceListings]);

  useEffect(() => {
    fetchPersonalData();
  }, [fetchPersonalData]);

  // Xem chi tiết một tin đăng
  const handleSelectListing = async (listingId) => {
    try {
      const detail = await apiRequest(`/listings/${listingId}`, {
        token: token || undefined,
      });
      setSelectedListing(detail);
    } catch (err) {
      showNotify(err.message, 'error');
    }
  };

  // Toggle Lưu yêu thích (N:N)
  const handleToggleFavorite = async (listingId, e) => {
    if (e) e.stopPropagation();
    if (!currentUser) {
      setAuthModalMode('login');
      setAuthModalOpen(true);
      return;
    }
    try {
      const res = await apiRequest(`/listings/${listingId}/favorite`, {
        method: 'POST',
        token,
      });
      showNotify(res.message, 'success');
      refreshAllData();
    } catch (err) {
      showNotify(err.message, 'error');
    }
  };

  // Xóa tin đăng
  const handleDeleteListing = async (listingId) => {
    try {
      await apiRequest(`/listings/${listingId}`, {
        method: 'DELETE',
        token,
      });
      showNotify(`Đã xóa tin đăng #${listingId} khỏi hệ thống.`, 'info');
      if (selectedListing?.id === listingId) {
        setSelectedListing(null);
      }
      refreshAllData();
    } catch (err) {
      showNotify(err.message, 'error');
    }
  };

  // Đặt lại bộ lọc tìm kiếm
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategoryId('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedCondition('');
    setIncludeSold(true);
    setSortBy('newest');
    setPage(1);
  };

  const pendingReceivedOffersCount = receivedOffers.filter(
    (o) => o.status === 'PENDING'
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Thông báo Toast nổi */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md animate-bounce">
          <div
            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-xl border text-xs sm:text-sm font-bold ${
              notification.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : notification.type === 'error'
                ? 'bg-rose-600 text-white border-rose-500'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : notification.type === 'error' ? (
              <AlertCircle className="w-5 h-5 shrink-0" />
            ) : (
              <Info className="w-5 h-5 shrink-0 text-amber-400" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Thanh Điều Hướng Chính & 1-Click Demo Role Switcher */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onQuickDemoLogin={handleQuickDemoLogin}
        switchingRole={switchingRole}
        onOpenAuthModal={(mode) => {
          setAuthModalMode(mode);
          setAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        stats={stats}
        favoritesCount={favoriteListings.length}
        pendingReceivedOffersCount={pendingReceivedOffersCount}
      />

      {/* Nội dung chính theo Tab */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {/* TAB 1: KHÁM PHÁ CHỢ ĐỒ CŨ SINH VIÊN */}
        {activeTab === 'marketplace' && (
          <div className="space-y-6">
            {/* Hero Banner Sinh Viên */}
            <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2.5 max-w-2xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Sàn Giao Dịch Đồ Cũ Nội Bộ Sinh Viên Đại Học</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                    Cũ người mới ta — Tiết kiệm chi phí học tập &amp; sinh hoạt
                  </h1>
                  <p className="text-xs sm:text-sm text-indigo-100">
                    Mọi tin đăng đều được <strong>Kiểm duyệt viên</strong> xác minh. Gửi trả giá trực tiếp, chốt đơn tự động khóa tin và đánh giá điểm uy tín minh bạch sau giao dịch.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingListing(null);
                      setActiveTab('create');
                    }}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm shadow-md transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Đăng tin bán đồ ngay
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('demolab')}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm border border-white/25 transition-all"
                  >
                    🎯 Mở Trạm Kiểm Thử 8 Bước ĐG2
                  </button>
                </div>
              </div>
            </div>

            {/* Danh mục chọn nhanh bằng Icon */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategoryId('');
                  setPage(1);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold whitespace-nowrap border transition-all ${
                  selectedCategoryId === ''
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                Tất cả danh mục ({stats?.total_listings || 0})
              </button>
              {categories.map((cat) => {
                const IconComp = CATEGORY_ICON_MAP[cat.icon] || Package;
                const active = String(selectedCategoryId) === String(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(active ? '' : String(cat.id));
                      setPage(1);
                    }}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap border transition-all ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <IconComp className="w-3.5 h-3.5" />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Thanh công cụ Tìm kiếm & Lọc đa tiêu chí */}
            <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
                {/* Ô tìm kiếm từ khóa */}
                <div className="lg:col-span-4 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Tìm giáo trình, laptop, xe đạp, bàn học..."
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {/* Lọc tình trạng */}
                <div className="lg:col-span-2">
                  <select
                    value={selectedCondition}
                    onChange={(e) => {
                      setSelectedCondition(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Mọi tình trạng</option>
                    {Object.entries(CONDITION_META).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Khoảng giá từ - đến */}
                <div className="lg:col-span-2">
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={minPrice}
                    onChange={(e) => {
                      setMinPrice(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Giá từ (VNĐ)"
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="lg:col-span-2">
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={maxPrice}
                    onChange={(e) => {
                      setMaxPrice(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Giá đến (VNĐ)"
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Sắp xếp */}
                <div className="lg:col-span-2">
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="newest">Mới đăng nhất</option>
                    <option value="price_asc">Giá: Thấp đến Cao</option>
                    <option value="price_desc">Giá: Cao đến Thấp</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={includeSold}
                      onChange={(e) => {
                        setIncludeSold(e.target.checked);
                        setPage(1);
                      }}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Hiển thị cả các món đồ Đã bán (SOLD)</span>
                  </label>
                  <span className="text-slate-400">
                    Tìm thấy <strong>{marketplaceData.total}</strong> tin đăng
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Đặt lại bộ lọc
                </button>
              </div>
            </div>

            {/* Lưới hiển thị các Tin đăng đồ cũ */}
            {loadingMarketplace ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="bg-white rounded-3xl border border-slate-200 h-80 animate-pulse p-4"
                  />
                ))}
              </div>
            ) : marketplaceData.items.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
                <Filter className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-extrabold text-slate-800">
                  Không tìm thấy món đồ nào phù hợp với bộ lọc
                </h3>
                <p className="text-xs text-slate-500">
                  Hãy thử xóa từ khóa tìm kiếm hoặc nới rộng khoảng giá để xem thêm tin đăng.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                >
                  Xem toàn bộ tin trên chợ
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {marketplaceData.items.map((item) => {
                  const condMeta = CONDITION_META[item.condition] || {
                    shortLabel: item.condition,
                    badge: 'bg-slate-100 text-slate-700',
                  };
                  const statusMeta = STATUS_META[item.status] || {
                    label: item.status,
                    badge: 'bg-slate-700 text-white',
                  };
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectListing(item.id)}
                      className="group bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col"
                    >
                      {/* Ảnh sản phẩm */}
                      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                        <img
                          src={getListingThumbnail(item)}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold shadow-sm ${statusMeta.badge}`}
                          >
                            {statusMeta.label}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-sm bg-white/95 ${condMeta.badge}`}
                          >
                            {condMeta.shortLabel}
                          </span>
                        </div>

                        {/* Nút thả tim Yêu thích N:N */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleFavorite(item.id, e)}
                          title="Lưu vào danh sách Yêu thích"
                          className={`absolute top-3 right-3 px-2.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-md transition-all ${
                            item.is_favorited
                              ? 'bg-rose-600 text-white'
                              : 'bg-white/90 hover:bg-white text-slate-700'
                          }`}
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              item.is_favorited
                                ? 'fill-white'
                                : 'text-rose-500'
                            }`}
                          />
                          <span>{item.favorites_count || 0}</span>
                        </button>

                        {item.images?.length > 1 && (
                          <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-slate-900/75 text-white text-[10px] font-semibold">
                            {item.images.length} ảnh
                          </span>
                        )}
                      </div>

                      {/* Nội dung thẻ */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-1.5">
                          {item.category && (
                            <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                              {item.category.name}
                            </div>
                          )}
                          <h3 className="font-extrabold text-slate-900 text-base line-clamp-2 group-hover:text-indigo-600 transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-2">
                            {item.description}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 space-y-2.5">
                          <div className="flex items-baseline justify-between">
                            <span className="text-lg font-extrabold text-indigo-600">
                              {formatVND(item.price)}
                            </span>
                            <span className="text-[11px] font-semibold text-indigo-600 group-hover:underline">
                              Xem &amp; Trả giá →
                            </span>
                          </div>

                          {/* Thông tin người bán trên thẻ */}
                          {item.seller && (
                            <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl">
                              <div className="flex items-center gap-2 truncate">
                                <img
                                  src={
                                    item.seller.avatar_url ||
                                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.seller.email}`
                                  }
                                  alt={item.seller.full_name}
                                  className="w-5 h-5 rounded-full bg-white border border-slate-200"
                                />
                                <span className="font-semibold truncate">
                                  {item.seller.full_name}
                                </span>
                              </div>
                              <span className="inline-flex items-center gap-0.5 font-bold text-amber-600 shrink-0">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                {Number(
                                  item.seller.reputation_score ?? 5.0
                                ).toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Thanh Phân trang (Pagination) */}
            {marketplaceData.total_pages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-100"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Trang trước
                </button>
                <span className="text-xs font-bold text-slate-600 px-3">
                  Trang {marketplaceData.page} / {marketplaceData.total_pages}
                </span>
                <button
                  type="button"
                  disabled={page >= marketplaceData.total_pages}
                  onClick={() =>
                    setPage((p) => Math.min(marketplaceData.total_pages, p + 1))
                  }
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-100"
                >
                  Trang tiếp
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ĐĂNG TIN BÁN ĐỒ CŨ MỚI / CHỈNH SỬA TIN */}
        {activeTab === 'create' && (
          <CreateListingView
            categories={categories}
            token={token}
            currentUser={currentUser}
            editingListing={editingListing}
            onClearEditing={() => setEditingListing(null)}
            myListings={myListings}
            showNotify={showNotify}
            onRequireAuth={() => {
              setAuthModalMode('login');
              setAuthModalOpen(true);
            }}
            onSuccess={() => {
              setEditingListing(null);
              refreshAllData();
              setActiveTab('dashboard');
            }}
          />
        )}

        {/* TAB 3: DANH SÁCH TIN YÊU THÍCH (QUAN HỆ N:N) */}
        {activeTab === 'favorites' && (
          <div className="space-y-5">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
                  Danh Sách Món Đồ Yêu Thích Đã Lưu (Quan hệ N:N)
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Các món đồ cũ bạn đã bấm lưu quan tâm qua bảng trung gian <code>favorites</code>.
                </p>
              </div>
              <span className="px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-extrabold">
                {favoriteListings.length} món đã lưu
              </span>
            </div>

            {!currentUser ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 space-y-3">
                <p className="text-sm font-semibold text-slate-600">
                  Vui lòng đăng nhập hoặc chọn 1 tác nhân Demo trên thanh công cụ để xem danh sách yêu thích.
                </p>
              </div>
            ) : favoriteListings.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 space-y-3">
                <p className="text-sm font-semibold text-slate-500">
                  Bạn chưa lưu tin đăng nào vào danh sách yêu thích.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('marketplace')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                >
                  Khám phá Chợ ngay
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {favoriteListings.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectListing(item.id)}
                    className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col"
                  >
                    <div className="relative aspect-[16/10] bg-slate-100">
                      <img
                        src={getListingThumbnail(item)}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => handleToggleFavorite(item.id, e)}
                        className="absolute top-3 right-3 px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-bold flex items-center gap-1 shadow-md"
                      >
                        <Heart className="w-3.5 h-3.5 fill-white" />
                        Bỏ lưu ({item.favorites_count || 1})
                      </button>
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="font-extrabold text-slate-900 text-sm line-clamp-1">
                        {item.title}
                      </h3>
                      <div className="text-base font-extrabold text-indigo-600">
                        {formatVND(item.price)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: QUẢN LÝ GIAO DỊCH & CÁ NHÂN */}
        {activeTab === 'dashboard' && (
          <TransactionsView
            currentUser={currentUser}
            token={token}
            myListings={myListings}
            receivedOffers={receivedOffers}
            sentOffers={sentOffers}
            onSelectListing={handleSelectListing}
            onEditListing={(item) => {
              setEditingListing(item);
              setActiveTab('create');
            }}
            onDeleteListing={handleDeleteListing}
            onRefreshAll={refreshAllData}
            showNotify={showNotify}
          />
        )}

        {/* TAB 5: BÀN LÀM VIỆC KIỂM DUYỆT VIÊN */}
        {activeTab === 'moderation' && (
          <ModerationView
            currentUser={currentUser}
            token={token}
            stats={stats}
            categories={categories}
            onSelectListing={handleSelectListing}
            onRefreshGlobal={refreshAllData}
            onQuickDemoLogin={handleQuickDemoLogin}
            showNotify={showNotify}
          />
        )}

        {/* TAB 6: TRẠM KIỂM THỬ 8 BƯỚC BẢO VỆ ĐG2 */}
        {activeTab === 'demolab' && (
          <DefenseLabView
            currentUser={currentUser}
            token={token}
            onQuickDemoLogin={handleQuickDemoLogin}
            onRefreshAll={refreshAllData}
            showNotify={showNotify}
          />
        )}
      </main>

      {/* Footer Học Thuật Chuẩn ĐG2 — Nhóm 4 Lớp CT2802 */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8 px-4 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="space-y-1">
              <div className="text-sm font-extrabold text-slate-900">
                Chợ Đồ Cũ Sinh Viên (chodocusinhvien v1.0.0) — Đề tài 4: Nền tảng trao đổi đồ cũ cho sinh viên
              </div>
              <div>
                <strong>Học phần:</strong> Lập trình mã nguồn mở (<code className="font-bold text-indigo-600">POS02024</code>) •{' '}
                <strong>Nhóm thực hiện:</strong> <span className="font-extrabold text-indigo-700">Nhóm 4 – Lớp CT2802</span> •{' '}
                <strong>GVHD:</strong> <span className="font-extrabold text-slate-900">ThS. Đỗ Văn Tuyên</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-semibold">
                FastAPI + SQLAlchemy 2.0 + React 18 + TailwindCSS
              </span>
              <a
                href="/docs"
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 font-extrabold hover:bg-indigo-100 transition-colors"
              >
                Swagger API Docs (/docs)
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="text-[11px] font-bold text-indigo-600 uppercase">1. Trưởng nhóm • DevOps</div>
              <div className="font-extrabold text-slate-900 text-xs mt-0.5">Nguyễn Hải Long</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="text-[11px] font-bold text-indigo-600 uppercase">2. Back-end API &amp; Bảo mật</div>
              <div className="font-extrabold text-slate-900 text-xs mt-0.5">Nguyễn Đức Anh</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="text-[11px] font-bold text-indigo-600 uppercase">3. Front-end UI/UX</div>
              <div className="font-extrabold text-slate-900 text-xs mt-0.5">Nguyễn Huy Hoàng</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="text-[11px] font-bold text-indigo-600 uppercase">4. CSDL &amp; Kiểm thử QA</div>
              <div className="font-extrabold text-slate-900 text-xs mt-0.5">Hoàng Nhật Thắng</div>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal Đăng nhập / Đăng ký */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        onQuickDemoLogin={handleQuickDemoLogin}
      />

      {/* Modal Chi tiết Món đồ cũ */}
      <ListingDetailModal
        listing={selectedListing}
        onClose={() => setSelectedListing(null)}
        currentUser={currentUser}
        token={token}
        onToggleFavorite={(id) => handleToggleFavorite(id)}
        onEditListing={(item) => {
          setEditingListing(item);
          setActiveTab('create');
        }}
        onDeleteListing={handleDeleteListing}
        onRefreshData={refreshAllData}
        showNotify={showNotify}
        onRequireAuth={() => {
          setAuthModalMode('login');
          setAuthModalOpen(true);
        }}
      />
    </div>
  );
}
