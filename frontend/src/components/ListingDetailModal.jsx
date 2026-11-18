import React, { useState, useEffect } from 'react';
import {
  X,
  Heart,
  MessageSquare,
  Star,
  Flag,
  Phone,
  GraduationCap,
  Calendar,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Edit3,
  Send,
  ShieldAlert,
} from 'lucide-react';
import {
  apiRequest,
  formatVND,
  formatDateTime,
  CONDITION_META,
  STATUS_META,
  getListingThumbnail,
} from '../api';

const REPORT_REASONS = [
  'Thông tin sai sự thật / Giá ảo',
  'Nghi vấn lừa đảo cọc tiền',
  'Hàng cấm / Vi phạm nội quy sinh viên',
  'Trùng lặp tin đăng (Spam)',
  'Ngôn từ không phù hợp',
];

export default function ListingDetailModal({
  listing,
  onClose,
  currentUser,
  token,
  onToggleFavorite,
  onEditListing,
  onDeleteListing,
  onRefreshData,
  showNotify,
  onRequireAuth,
}) {
  const [selectedImgIdx, setSelectedImgIdx] = useState(0);
  const [activeAction, setActiveAction] = useState('offer'); // 'offer' | 'review' | 'report'
  const [sellerReviews, setSellerReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // State cho Gửi đề nghị mua / trả giá
  const [offeredPrice, setOfferedPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [submittingOffer, setSubmittingOffer] = useState(false);

  // State cho Đánh giá người bán (1-5 sao)
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState(
    'Món đồ đúng như mô tả, bạn sinh viên bán hàng nhiệt tình và đúng hẹn!'
  );
  const [submittingReview, setSubmittingReview] = useState(false);

  // State cho Báo cáo vi phạm
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportDesc, setReportDesc] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    if (!listing) return;
    setSelectedImgIdx(0);
    setOfferedPrice(String(Math.round(Number(listing.price || 0) * 0.95)));
    setOfferMessage(
      `Chào bạn, mình đang học tại trường và rất quan tâm món "${listing.title}". Mình có thể hẹn xem đồ trực tiếp tại khuôn viên trường được không?`
    );
    if (listing.status === 'SOLD') {
      setActiveAction('review');
    } else {
      setActiveAction('offer');
    }

    // Tải danh sách nhận xét đánh giá của Người bán
    if (listing.seller?.id) {
      setLoadingReviews(true);
      apiRequest(`/users/${listing.seller.id}/reviews`)
        .then((res) => setSellerReviews(Array.isArray(res) ? res : []))
        .catch(() => setSellerReviews([]))
        .finally(() => setLoadingReviews(false));
    }
  }, [listing]);

  if (!listing) return null;

  const images =
    listing.images && listing.images.length > 0
      ? listing.images.map((img) => img.image_url)
      : [getListingThumbnail(listing)];

  const isOwner = currentUser && currentUser.id === listing.seller_id;
  const isStaff =
    currentUser?.role === 'MODERATOR' || currentUser?.role === 'ADMIN';
  const condMeta = CONDITION_META[listing.condition] || {
    label: listing.condition,
    badge: 'bg-slate-100 text-slate-700',
  };
  const statusMeta = STATUS_META[listing.status] || {
    label: listing.status,
    badge: 'bg-slate-600 text-white',
  };

  // Gửi đề nghị mua / trả giá
  const handleSendOffer = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    const priceNum = Number(offeredPrice);
    if (!priceNum || priceNum <= 0) {
      showNotify('Vui lòng nhập mức giá đề nghị hợp lệ (> 0 VNĐ).', 'error');
      return;
    }
    setSubmittingOffer(true);
    try {
      await apiRequest(`/listings/${listing.id}/offers`, {
        method: 'POST',
        token,
        body: {
          offered_price: priceNum,
          message: offerMessage.trim() || null,
        },
      });
      showNotify(
        `Đã gửi đề nghị mua giá ${formatVND(priceNum)} tới ${listing.seller?.full_name}!`,
        'success'
      );
      onRefreshData();
    } catch (err) {
      showNotify(err.message, 'error');
    } finally {
      setSubmittingOffer(false);
    }
  };

  // Gửi đánh giá 1-5 sao sau khi giao dịch thành công
  const handleSendReview = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    setSubmittingReview(true);
    try {
      await apiRequest(`/listings/${listing.id}/reviews`, {
        method: 'POST',
        token,
        body: {
          rating: Number(rating),
          comment: reviewComment.trim() || null,
        },
      });
      showNotify(
        `Cảm ơn bạn! Đã gửi đánh giá ${rating} sao và cập nhật điểm uy tín người bán.`,
        'success'
      );
      // Tải lại danh sách đánh giá của người bán
      const updatedReviews = await apiRequest(
        `/users/${listing.seller.id}/reviews`
      );
      setSellerReviews(Array.isArray(updatedReviews) ? updatedReviews : []);
      onRefreshData();
    } catch (err) {
      showNotify(err.message, 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Gửi báo cáo tin vi phạm
  const handleSendReport = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    setSubmittingReport(true);
    try {
      await apiRequest(`/listings/${listing.id}/reports`, {
        method: 'POST',
        token,
        body: {
          reason: reportReason,
          description: reportDesc.trim() || null,
        },
      });
      showNotify(
        'Đã gửi báo cáo vi phạm tới Kiểm duyệt viên! Cảm ơn bạn đã chung tay bảo vệ cộng đồng.',
        'success'
      );
      setReportDesc('');
      onRefreshData();
    } catch (err) {
      showNotify(err.message, 'error');
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Thanh tiêu đề Modal */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-bold text-slate-400">
              Mã tin #{listing.id}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusMeta.badge}`}
            >
              {statusMeta.label}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${condMeta.badge}`}
            >
              {condMeta.label}
            </span>
            {listing.category && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Tag className="w-3 h-3" />
                {listing.category.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {(isOwner || isStaff) && (
              <>
                {isOwner && listing.status !== 'SOLD' && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onEditListing(listing);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Sửa tin
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDeleteListing(listing.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Xóa tin
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Nội dung chính có cuộn */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Cột trái (7 phần): Bộ sưu tập ảnh (Image Gallery) + Mô tả + Đánh giá người bán */}
          <div className="lg:col-span-7 space-y-5">
            {/* Ảnh lớn */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-[16/11] border border-slate-200">
              <img
                src={images[selectedImgIdx] || images[0]}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
              {listing.status === 'SOLD' && (
                <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                  <span className="px-6 py-2.5 rounded-2xl bg-rose-600 text-white font-extrabold text-xl tracking-wider uppercase shadow-xl border-2 border-white">
                    ĐÃ BÁN (SOLD)
                  </span>
                </div>
              )}
              {/* Nút Yêu thích nổi trên góc ảnh */}
              <button
                type="button"
                onClick={() => onToggleFavorite(listing.id)}
                className={`absolute top-3 right-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold shadow-lg transition-all ${
                  listing.is_favorited
                    ? 'bg-rose-600 text-white'
                    : 'bg-white/95 text-slate-800 hover:bg-white'
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${
                    listing.is_favorited ? 'fill-white' : 'text-rose-500'
                  }`}
                />
                <span>
                  {listing.is_favorited ? 'Đã lưu yêu thích' : 'Lưu yêu thích'} (
                  {listing.favorites_count || 0})
                </span>
              </button>
            </div>

            {/* Hàng ảnh thu nhỏ (Thumbnails) */}
            {images.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImgIdx(idx)}
                    className={`relative w-20 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                      selectedImgIdx === idx
                        ? 'border-indigo-600 ring-2 ring-indigo-300 scale-105'
                        : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Ảnh ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Cảnh báo nếu tin bị từ chối */}
            {listing.status === 'REJECTED' && listing.rejection_reason && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-sm">
                    Tin đăng đã bị Kiểm duyệt viên từ chối
                  </div>
                  <p>
                    <strong>Lý do:</strong> {listing.rejection_reason}
                  </p>
                </div>
              </div>
            )}

            {/* Tiêu đề, Giá & Mô tả chi tiết */}
            <div className="space-y-3">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
                {listing.title}
              </h1>
              <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600">
                  {formatVND(listing.price)}
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  Đăng lúc: {formatDateTime(listing.created_at)}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Mô tả chi tiết tình trạng món đồ
                </h3>
                <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  {listing.description}
                </div>
              </div>
            </div>
          </div>

          {/* Cột phải (5 phần): Thẻ Người bán + Khung Tương tác Giao dịch + Đánh giá */}
          <div className="lg:col-span-5 space-y-5">
            {/* Thẻ thông tin Sinh viên Bán hàng */}
            {listing.seller && (
              <div className="bg-gradient-to-br from-slate-50 to-indigo-50/40 rounded-2xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                    Thông tin Sinh viên Bán hàng
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    {Number(listing.seller.reputation_score ?? 5.0).toFixed(1)}{' '}
                    / 5.0 ({listing.seller.total_reviews || 0} đánh giá)
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={
                      listing.seller.avatar_url ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${listing.seller.email}`
                    }
                    alt={listing.seller.full_name}
                    className="w-12 h-12 rounded-full bg-white border-2 border-indigo-200 object-cover"
                  />
                  <div>
                    <div className="font-extrabold text-slate-900 text-sm">
                      {listing.seller.full_name}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-600 mt-0.5">
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="line-clamp-1">
                        {listing.seller.university || 'Sinh viên Đại học'}
                      </span>
                    </div>
                    {listing.seller.phone && (
                      <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700 mt-0.5">
                        <Phone className="w-3.5 h-3.5" />
                        <span>SĐT liên hệ: {listing.seller.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Danh sách các đánh giá uy tín của người bán */}
                <div className="pt-2 border-t border-slate-200/80">
                  <div className="text-xs font-bold text-slate-700 mb-2">
                    Nhận xét từ các bạn sinh viên đã giao dịch ({sellerReviews.length}):
                  </div>
                  {loadingReviews ? (
                    <p className="text-xs text-slate-400">Đang tải đánh giá...</p>
                  ) : sellerReviews.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">
                      Chưa có nhận xét nào. Điểm uy tín khởi tạo mặc định 5.0 ⭐.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {sellerReviews.map((rev) => (
                        <div
                          key={rev.id}
                          className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">
                              {rev.reviewer?.full_name || 'Sinh viên'}
                            </span>
                            <span className="inline-flex items-center gap-0.5 font-bold text-amber-600">
                              {Array.from({ length: rev.rating }).map((_, i) => (
                                <Star
                                  key={i}
                                  className="w-3 h-3 fill-amber-400 text-amber-400"
                                />
                              ))}
                            </span>
                          </div>
                          {rev.comment && (
                            <p className="text-slate-600">{rev.comment}</p>
                          )}
                          {rev.listing_title && (
                            <div className="text-[10px] text-slate-400 truncate">
                              Giao dịch: {rev.listing_title}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Các tab Tương tác: Trả giá / Đánh giá / Báo cáo */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="grid grid-cols-3 bg-slate-100 p-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveAction('offer')}
                  className={`flex items-center justify-center gap-1 py-2 rounded-xl transition-all ${
                    activeAction === 'offer'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Đề nghị mua
                </button>
                <button
                  type="button"
                  onClick={() => setActiveAction('review')}
                  className={`flex items-center justify-center gap-1 py-2 rounded-xl transition-all ${
                    activeAction === 'review'
                      ? 'bg-white text-amber-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Star className="w-3.5 h-3.5" />
                  Đánh giá 1-5⭐
                </button>
                <button
                  type="button"
                  onClick={() => setActiveAction('report')}
                  className={`flex items-center justify-center gap-1 py-2 rounded-xl transition-all ${
                    activeAction === 'report'
                      ? 'bg-white text-rose-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  Báo cáo tin
                </button>
              </div>

              <div className="p-4">
                {/* TAB 1: GỬI ĐỀ NGHỊ MUA / TRẢ GIÁ */}
                {activeAction === 'offer' && (
                  <form onSubmit={handleSendOffer} className="space-y-3">
                    <div className="text-xs text-slate-600">
                      Gửi mức giá đề xuất và lời nhắn hẹn xem đồ trực tiếp cho người bán.
                    </div>

                    {/* Gợi ý mức giá nhanh */}
                    {listing.price > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-slate-500">
                          Gợi ý nhanh:
                        </span>
                        {[0.9, 0.95, 1].map((ratio) => {
                          const suggested = Math.round(listing.price * ratio);
                          return (
                            <button
                              key={ratio}
                              type="button"
                              onClick={() => setOfferedPrice(String(suggested))}
                              className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                            >
                              {ratio === 1 ? 'Giá gốc' : `-${Math.round((1 - ratio) * 100)}%`}{' '}
                              ({formatVND(suggested)})
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mức giá đề nghị mua (VNĐ) *
                      </label>
                      <input
                        type="number"
                        required
                        min={1000}
                        step={1000}
                        value={offeredPrice}
                        onChange={(e) => setOfferedPrice(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm font-bold text-indigo-700 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Lời nhắn gửi người bán
                      </label>
                      <textarea
                        rows={3}
                        value={offerMessage}
                        onChange={(e) => setOfferMessage(e.target.value)}
                        placeholder="Hẹn thời gian, địa điểm xem đồ tại thư viện hoặc giảng đường..."
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={
                        submittingOffer ||
                        isOwner ||
                        listing.status !== 'APPROVED'
                      }
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <Send className="w-4 h-4" />
                      {isOwner
                        ? 'Bạn là chủ sở hữu tin đăng này'
                        : listing.status !== 'APPROVED'
                        ? `Tin đang ở trạng thái ${statusMeta.label}`
                        : submittingOffer
                        ? 'Đang gửi đề nghị...'
                        : 'Gửi Đề Nghị Mua / Trả Giá'}
                    </button>
                  </form>
                )}

                {/* TAB 2: ĐÁNH GIÁ NGƯỜI BÁN 1-5 SAO */}
                {activeAction === 'review' && (
                  <form onSubmit={handleSendReview} className="space-y-3">
                    <div className="text-xs text-slate-600">
                      Dành cho sinh viên mua đã chốt đơn thành công (trạng thái tin{' '}
                      <strong>ĐÃ BÁN</strong>). Đánh giá sẽ tự động cập nhật điểm uy tín của người bán.
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Chọn mức điểm hài lòng (1 – 5 sao):
                      </label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className={`flex-1 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                              rating >= star
                                ? 'bg-amber-50 border-amber-400 text-amber-700'
                                : 'bg-slate-50 border-slate-200 text-slate-400'
                            }`}
                          >
                            <Star
                              className={`w-4 h-4 ${
                                rating >= star
                                  ? 'fill-amber-400 text-amber-400'
                                  : ''
                              }`}
                            />
                            {star}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nhận xét chi tiết sau giao dịch
                      </label>
                      <textarea
                        rows={3}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Chia sẻ trải nghiệm thực tế về chất lượng món đồ..."
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingReview || isOwner}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {submittingReview
                        ? 'Đang gửi đánh giá...'
                        : `Gửi Đánh Giá ${rating} Sao`}
                    </button>
                  </form>
                )}

                {/* TAB 3: BÁO CÁO TIN VI PHẠM */}
                {activeAction === 'report' && (
                  <form onSubmit={handleSendReport} className="space-y-3">
                    <div className="text-xs text-slate-600">
                      Phát hiện tin lừa đảo, hàng cấm hoặc sai sự thật? Báo cáo ngay để Kiểm duyệt viên xử lý.
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Lý do báo cáo vi phạm *
                      </label>
                      <select
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 outline-none bg-white"
                      >
                        {REPORT_REASONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mô tả chi tiết bằng chứng
                      </label>
                      <textarea
                        rows={3}
                        value={reportDesc}
                        onChange={(e) => setReportDesc(e.target.value)}
                        placeholder="Nêu rõ dấu hiệu vi phạm để Kiểm duyệt viên xác minh..."
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingReport || isOwner}
                      className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      {isOwner
                        ? 'Không thể tự báo cáo tin của mình'
                        : submittingReport
                        ? 'Đang gửi báo cáo...'
                        : 'Gửi Báo Cáo Vi Phạm'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
