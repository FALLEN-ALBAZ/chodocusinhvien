import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Flag,
  FolderPlus,
  BarChart3,
  RefreshCw,
  Eye,
  AlertTriangle,
  Sparkles,
  Lock,
} from 'lucide-react';
import {
  apiRequest,
  formatVND,
  formatDateTime,
  STATUS_META,
  CONDITION_META,
  REPORT_STATUS_META,
  DEMO_ACCOUNTS,
  getListingThumbnail,
} from '../api';

export default function ModerationView({
  currentUser,
  token,
  stats,
  categories,
  onSelectListing,
  onRefreshGlobal,
  onQuickDemoLogin,
  showNotify,
}) {
  const [subTab, setSubTab] = useState('listings'); // 'listings' | 'reports' | 'categories' | 'stats'
  const [modListings, setModListings] = useState([]);
  const [listingStatusFilter, setListingStatusFilter] = useState('PENDING');
  const [reports, setReports] = useState([]);
  const [reportStatusFilter, setReportStatusFilter] = useState('PENDING');
  const [loading, setLoading] = useState(false);

  // Lý do từ chối từng tin đăng
  const [rejectReasons, setRejectReasons] = useState({});
  // Ghi chú xử lý từng báo cáo vi phạm
  const [modNotes, setModNotes] = useState({});

  // Form tạo danh mục mới
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catIcon, setCatIcon] = useState('Package');
  const [creatingCat, setCreatingCat] = useState(false);

  const isStaff =
    currentUser?.role === 'MODERATOR' || currentUser?.role === 'ADMIN';

  const fetchModerationData = useCallback(async () => {
    if (!token || !isStaff) return;
    setLoading(true);
    try {
      const [listingsRes, reportsRes] = await Promise.all([
        apiRequest(
          listingStatusFilter === 'ALL'
            ? '/moderation/listings'
            : `/moderation/listings?status=${listingStatusFilter}`,
          { token }
        ),
        apiRequest(
          reportStatusFilter === 'ALL'
            ? '/moderation/reports'
            : `/moderation/reports?status=${reportStatusFilter}`,
          { token }
        ),
      ]);
      setModListings(Array.isArray(listingsRes) ? listingsRes : []);
      setReports(Array.isArray(reportsRes) ? reportsRes : []);
    } catch (err) {
      showNotify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [token, isStaff, listingStatusFilter, reportStatusFilter, showNotify]);

  useEffect(() => {
    fetchModerationData();
  }, [fetchModerationData]);

  // Nếu đang đăng nhập bằng tài khoản Sinh viên, hiển thị thông báo phân quyền RBAC kèm nút 1-Click chuyển sang Kiểm duyệt viên
  if (!isStaff) {
    const modAccount = DEMO_ACCOUNTS.find((a) => a.key === 'moderator');
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-amber-300 p-8 text-center shadow-sm space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">
          Khu vực dành riêng cho Kiểm duyệt viên (MODERATOR / ADMIN)
        </h2>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Tài khoản hiện tại của bạn đang có vai trò{' '}
          <strong>{currentUser?.role || 'KHÁCH'}</strong>. Theo cơ chế phân quyền{' '}
          <strong>RBAC (Role-Based Access Control)</strong>, chỉ Kiểm duyệt viên mới được duyệt tin đăng, xử lý báo cáo vi phạm và thêm danh mục.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          {modAccount && (
            <button
              type="button"
              onClick={() => onQuickDemoLogin(modAccount)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm shadow-md transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Chuyển sang Kiểm duyệt viên (1-Click: {modAccount.email})
            </button>
          )}
        </div>
      </div>
    );
  }

  // Duyệt tin đăng (PENDING -> APPROVED)
  const handleApproveListing = async (listing) => {
    try {
      await apiRequest(`/moderation/listings/${listing.id}/status`, {
        method: 'PATCH',
        token,
        body: { status: 'APPROVED' },
      });
      showNotify(
        `Đã PHÊ DUYỆT tin đăng #${listing.id} "${listing.title}" hiển thị lên chợ!`,
        'success'
      );
      fetchModerationData();
      onRefreshGlobal();
    } catch (err) {
      showNotify(err.message, 'error');
    }
  };

  // Từ chối tin đăng (PENDING -> REJECTED kèm lý do bắt buộc)
  const handleRejectListing = async (listing) => {
    const reason = (
      rejectReasons[listing.id] ||
      'Hình ảnh hoặc thông tin mô tả chưa rõ ràng, vui lòng bổ sung ảnh thật của món đồ.'
    ).trim();
    if (reason.length < 3) {
      showNotify('Vui lòng nhập lý do từ chối tối thiểu 3 ký tự.', 'error');
      return;
    }
    try {
      await apiRequest(`/moderation/listings/${listing.id}/status`, {
        method: 'PATCH',
        token,
        body: {
          status: 'REJECTED',
          rejection_reason: reason,
        },
      });
      showNotify(
        `Đã TỪ CHỐI tin đăng #${listing.id} kèm lý do phản hồi cho người bán.`,
        'info'
      );
      fetchModerationData();
      onRefreshGlobal();
    } catch (err) {
      showNotify(err.message, 'error');
    }
  };

  // Xử lý báo cáo vi phạm (RESOLVED hoặc DISMISSED)
  const handleProcessReport = async (report, newStatus, rejectListing) => {
    const note =
      modNotes[report.id] ||
      (newStatus === 'RESOLVED'
        ? 'Đã xác minh vi phạm quy định chợ sinh viên và gỡ tin đăng.'
        : 'Qua kiểm tra, tin đăng hợp lệ, bác bỏ báo cáo.');
    try {
      await apiRequest(`/moderation/reports/${report.id}`, {
        method: 'PATCH',
        token,
        body: {
          status: newStatus,
          moderator_note: note,
          reject_listing: rejectListing,
        },
      });
      showNotify(
        newStatus === 'RESOLVED'
          ? `Đã xử lý báo cáo #${report.id} (RESOLVED) và tự động gỡ tin vi phạm!`
          : `Đã bác bỏ báo cáo #${report.id} (DISMISSED).`,
        'success'
      );
      fetchModerationData();
      onRefreshGlobal();
    } catch (err) {
      showNotify(err.message, 'error');
    }
  };

  // Tạo danh mục mới
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setCreatingCat(true);
    try {
      const created = await apiRequest('/categories', {
        method: 'POST',
        token,
        body: {
          name: catName.trim(),
          slug: catSlug.trim() || null,
          description: catDesc.trim() || null,
          icon: catIcon || 'Package',
        },
      });
      showNotify(
        `Đã tạo danh mục mới "${created.name}" (slug: ${created.slug}) thành công!`,
        'success'
      );
      setCatName('');
      setCatSlug('');
      setCatDesc('');
      onRefreshGlobal();
    } catch (err) {
      showNotify(err.message, 'error');
    } finally {
      setCreatingCat(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Kiểm duyệt viên */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 rounded-3xl p-6 text-white shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-900/25 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Trung tâm Kiểm duyệt Nội dung &amp; Quản trị Hệ thống</span>
          </div>
          <h1 className="text-2xl font-extrabold">
            Bàn Làm Việc Kiểm Duyệt Viên ({currentUser.full_name})
          </h1>
          <p className="text-xs sm:text-sm text-amber-50">
            Duyệt tin đăng mới, xử lý báo cáo vi phạm từ sinh viên và quản lý danh mục sản phẩm.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            fetchModerationData();
            onRefreshGlobal();
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-amber-900 font-extrabold text-xs shadow-sm hover:bg-amber-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới dữ liệu
        </button>
      </div>

      {/* Thẻ chỉ số tổng quan toàn hệ thống */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm">
            <div className="text-xs font-bold text-amber-700">Tin chờ duyệt</div>
            <div className="text-2xl font-extrabold text-amber-600 mt-1">
              {stats.pending_listings}
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm">
            <div className="text-xs font-bold text-emerald-700">Tin đang bán</div>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">
              {stats.approved_listings}
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-sm">
            <div className="text-xs font-bold text-rose-700">Tin đã bán</div>
            <div className="text-2xl font-extrabold text-rose-600 mt-1">
              {stats.sold_listings}
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-slate-600">Báo cáo chờ xử lý</div>
            <div className="text-2xl font-extrabold text-rose-600 mt-1">
              {stats.pending_reports} / {stats.total_reports}
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-slate-600">Đề nghị mua</div>
            <div className="text-2xl font-extrabold text-indigo-600 mt-1">
              {stats.total_offers}
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-slate-600">Đánh giá uy tín</div>
            <div className="text-2xl font-extrabold text-amber-500 mt-1">
              {stats.total_reviews} ⭐
            </div>
          </div>
        </div>
      )}

      {/* Thanh chuyển đổi chức năng kiểm duyệt */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <button
          type="button"
          onClick={() => setSubTab('listings')}
          className={`flex-1 min-w-[180px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
            subTab === 'listings'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Duyệt Tin Đăng ({stats?.pending_listings || 0} chờ)</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('reports')}
          className={`flex-1 min-w-[180px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
            subTab === 'reports'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Flag className="w-4 h-4" />
          <span>Xử Lý Báo Cáo Vi Phạm ({stats?.pending_reports || 0} chờ)</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('categories')}
          className={`flex-1 min-w-[180px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
            subTab === 'categories'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FolderPlus className="w-4 h-4" />
          <span>Quản Lý &amp; Tạo Danh Mục ({categories.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('stats')}
          className={`flex-1 min-w-[180px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
            subTab === 'stats'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Phân Bố Theo Danh Mục</span>
        </button>
      </div>

      {/* TAB 1: DUYỆT TIN ĐĂNG */}
      {subTab === 'listings' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'PENDING', label: 'Chờ duyệt (PENDING)' },
              { id: 'APPROVED', label: 'Đã duyệt (APPROVED)' },
              { id: 'REJECTED', label: 'Đã từ chối (REJECTED)' },
              { id: 'SOLD', label: 'Đã bán (SOLD)' },
              { id: 'ALL', label: 'Tất cả tin' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setListingStatusFilter(st.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  listingStatusFilter === st.id
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {modListings.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
              <p className="text-sm font-semibold text-slate-500">
                Không có tin đăng nào ở trạng thái {listingStatusFilter}.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {modListings.map((item) => {
                const stMeta = STATUS_META[item.status] || {
                  label: item.status,
                  badge: 'bg-slate-600 text-white',
                };
                const condMeta = CONDITION_META[item.condition] || {
                  label: item.condition,
                };
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col lg:flex-row gap-5"
                  >
                    <img
                      src={getListingThumbnail(item)}
                      alt={item.title}
                      onClick={() => onSelectListing(item.id)}
                      className="w-full lg:w-44 h-40 rounded-xl object-cover cursor-pointer border border-slate-100 shrink-0"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${stMeta.badge}`}
                        >
                          {stMeta.label}
                        </span>
                        <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                          {item.category?.name}
                        </span>
                        <span className="text-xs text-slate-500">
                          {condMeta.label} • Mã tin #{item.id}
                        </span>
                      </div>

                      <h3
                        onClick={() => onSelectListing(item.id)}
                        className="text-base font-extrabold text-slate-900 hover:text-indigo-600 cursor-pointer"
                      >
                        {item.title}
                      </h3>

                      <div className="text-lg font-extrabold text-indigo-600">
                        {formatVND(item.price)}
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2">
                        {item.description}
                      </p>

                      <div className="text-xs text-slate-500 pt-1">
                        Người đăng: <strong>{item.seller?.full_name}</strong> (
                        {item.seller?.email}) • Lúc:{' '}
                        {formatDateTime(item.created_at)}
                      </div>

                      {item.rejection_reason && (
                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                          <strong>Lý do từ chối đã lưu:</strong>{' '}
                          {item.rejection_reason}
                        </div>
                      )}
                    </div>

                    {/* Khung thao tác Duyệt / Từ chối */}
                    <div className="lg:w-72 shrink-0 flex flex-col justify-between gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => handleApproveListing(item)}
                          className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Duyệt tin (APPROVED)</span>
                        </button>

                        <div className="pt-1 space-y-1.5">
                          <input
                            type="text"
                            value={rejectReasons[item.id] ?? ''}
                            onChange={(e) =>
                              setRejectReasons((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                            placeholder="Nhập lý do từ chối (bắt buộc khi từ chối)..."
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-rose-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleRejectListing(item)}
                            className="w-full py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Từ chối tin (REJECTED)</span>
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectListing(item.id)}
                        className="w-full py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Xem chi tiết tin
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: XỬ LÝ BÁO CÁO VI PHẠM */}
      {subTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'PENDING', label: 'Chờ xử lý (PENDING)' },
              { id: 'RESOLVED', label: 'Đã xử lý & Gỡ tin (RESOLVED)' },
              { id: 'DISMISSED', label: 'Đã bác bỏ (DISMISSED)' },
              { id: 'ALL', label: 'Tất cả báo cáo' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setReportStatusFilter(st.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  reportStatusFilter === st.id
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {reports.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
              <p className="text-sm font-semibold text-slate-500">
                Không có báo cáo vi phạm nào ở trạng thái {reportStatusFilter}.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((rep) => {
                const stMeta = REPORT_STATUS_META[rep.status] || {
                  label: rep.status,
                  badge: 'bg-slate-100 text-slate-700',
                };
                return (
                  <div
                    key={rep.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col lg:flex-row justify-between gap-5"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${stMeta.badge}`}
                        >
                          {stMeta.label}
                        </span>
                        <span className="text-xs text-slate-400">
                          Báo cáo #{rep.id} • {formatDateTime(rep.created_at)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm font-extrabold text-rose-700">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Lý do báo cáo: {rep.reason}</span>
                      </div>

                      {rep.description && (
                        <p className="text-xs text-slate-700 bg-rose-50/60 p-3 rounded-xl border border-rose-100">
                          Bằng chứng / Mô tả: "{rep.description}"
                        </p>
                      )}

                      {rep.listing && (
                        <div
                          onClick={() => onSelectListing(rep.listing.id)}
                          className="text-xs font-bold text-indigo-700 hover:underline cursor-pointer"
                        >
                          Tin bị báo cáo: #{rep.listing.id} — {rep.listing.title}{' '}
                          ({formatVND(rep.listing.price)}) [Trạng thái hiện tại:{' '}
                          {rep.listing.status}]
                        </div>
                      )}

                      {rep.reporter && (
                        <div className="text-xs text-slate-500">
                          Sinh viên gửi báo cáo:{' '}
                          <strong>{rep.reporter.full_name}</strong> (
                          {rep.reporter.email})
                        </div>
                      )}

                      {rep.moderator_note && (
                        <div className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                          <strong>Kết luận của Kiểm duyệt viên:</strong>{' '}
                          {rep.moderator_note}
                        </div>
                      )}
                    </div>

                    {/* Khung xử lý báo cáo */}
                    <div className="lg:w-80 shrink-0 bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                      <input
                        type="text"
                        value={modNotes[rep.id] ?? ''}
                        onChange={(e) =>
                          setModNotes((prev) => ({
                            ...prev,
                            [rep.id]: e.target.value,
                          }))
                        }
                        placeholder="Ghi chú kết luận xử lý..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleProcessReport(rep, 'RESOLVED', true)}
                        className="w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Xác nhận vi phạm &amp; Tự động Gỡ tin (RESOLVED)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleProcessReport(rep, 'DISMISSED', false)
                        }
                        className="w-full py-2 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        Bác bỏ báo cáo (DISMISSED)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TẠO DANH MỤC MỚI */}
      {subTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleCreateCategory}
            className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 h-fit"
          >
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-amber-600" />
              Thêm Danh Mục Đồ Cũ Mới
            </h3>
            <p className="text-xs text-slate-500">
              API <code>POST /api/v1/categories</code> tự động chuẩn hóa tiếng Việt có dấu thành slug URL thân thiện.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên danh mục *
              </label>
              <input
                type="text"
                required
                minLength={2}
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="Ví dụ: Nhạc cụ & Đồ câu lạc bộ"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Slug tĩnh (Có thể để trống để tự sinh)
              </label>
              <input
                type="text"
                value={catSlug}
                onChange={(e) => setCatSlug(e.target.value)}
                placeholder="nhac-cu-do-cau-lac-bo"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Biểu tượng (Lucide Icon)
              </label>
              <select
                value={catIcon}
                onChange={(e) => setCatIcon(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white outline-none"
              >
                <option value="BookOpen">BookOpen (Sách / Giáo trình)</option>
                <option value="Laptop">Laptop (Đồ công nghệ)</option>
                <option value="Home">Home (Đồ phòng trọ)</option>
                <option value="Bike">Bike (Xe đạp / Di chuyển)</option>
                <option value="Shirt">Shirt (Thời trang / Đồng phục)</option>
                <option value="Package">Package (Đồ dùng đa năng)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mô tả danh mục
              </label>
              <textarea
                rows={3}
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                placeholder="Mô tả các mặt hàng thuộc danh mục này..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={creatingCat}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-sm"
            >
              {creatingCat ? 'Đang tạo...' : '+ Tạo Danh Mục Mới'}
            </button>
          </form>

          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h3 className="text-base font-extrabold text-slate-900">
              Danh sách Danh mục hiện có ({categories.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-sm">
                      {cat.name}
                    </span>
                    <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-500">
                      #{cat.id}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-indigo-600">
                    slug: {cat.slug}
                  </div>
                  {cat.description && (
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {cat.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: THỐNG KÊ PHÂN BỐ THEO DANH MỤC */}
      {subTab === 'stats' && stats?.listings_by_category && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-slate-900">
            Biểu đồ Phân bố Số lượng Tin đăng theo từng Danh mục (
            <code>GET /api/v1/stats/overview</code>)
          </h3>
          <div className="space-y-3">
            {stats.listings_by_category.map((row) => {
              const maxCount = Math.max(
                1,
                ...stats.listings_by_category.map((r) => r.count)
              );
              const pct = Math.round((row.count / maxCount) * 100);
              return (
                <div key={row.category_id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-800">
                      {row.category_name}{' '}
                      <span className="text-slate-400 font-normal">
                        ({row.slug})
                      </span>
                    </span>
                    <span className="text-indigo-600">{row.count} tin đăng</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, 6)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
