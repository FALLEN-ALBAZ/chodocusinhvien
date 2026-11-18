import React, { useState } from 'react';
import {
  Package,
  Inbox,
  Send,
  CheckCircle2,
  XCircle,
  Star,
  Edit3,
  Trash2,
  Eye,
  AlertTriangle,
  Clock,
  Phone,
  MessageSquare,
} from 'lucide-react';
import {
  apiRequest,
  formatVND,
  formatDateTime,
  STATUS_META,
  CONDITION_META,
  OFFER_STATUS_META,
  getListingThumbnail,
} from '../api';

export default function TransactionsView({
  currentUser,
  token,
  myListings,
  receivedOffers,
  sentOffers,
  onSelectListing,
  onEditListing,
  onDeleteListing,
  onRefreshAll,
  showNotify,
}) {
  const [subTab, setSubTab] = useState('my_listings'); // 'my_listings' | 'received_offers' | 'sent_offers'
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [processingId, setProcessingId] = useState(null);

  // State cho form đánh giá nhanh trên thẻ Đề nghị mua đã gửi (khi đã ACCEPTED)
  const [reviewingListingId, setReviewingListingId] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState(
    'Giao dịch nhanh gọn, món đồ chất lượng đúng như mô tả, cảm ơn bạn!'
  );

  // Chấp nhận đề nghị mua -> Tự động chốt đơn SOLD
  const handleAcceptOffer = async (offer) => {
    setProcessingId(offer.id);
    try {
      await apiRequest(`/offers/${offer.id}/accept`, {
        method: 'PATCH',
        token,
      });
      showNotify(
        `Đã chấp nhận bán với giá ${formatVND(
          offer.offered_price
        )}! Tin đăng đã tự động chuyển sang trạng thái ĐÃ BÁN (SOLD).`,
        'success'
      );
      onRefreshAll();
    } catch (err) {
      showNotify(err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Từ chối đề nghị mua
  const handleRejectOffer = async (offer) => {
    setProcessingId(offer.id);
    try {
      await apiRequest(`/offers/${offer.id}/reject`, {
        method: 'PATCH',
        token,
      });
      showNotify('Đã từ chối đề nghị mua hàng.', 'info');
      onRefreshAll();
    } catch (err) {
      showNotify(err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Gửi đánh giá 1-5 sao cho người bán từ danh sách Đề nghị mua đã gửi
  const handleQuickReview = async (e, listingId) => {
    e.preventDefault();
    setProcessingId(`rev-${listingId}`);
    try {
      await apiRequest(`/listings/${listingId}/reviews`, {
        method: 'POST',
        token,
        body: {
          rating: Number(rating),
          comment: reviewComment.trim() || null,
        },
      });
      showNotify(
        `Đã gửi đánh giá ${rating} sao thành công! Điểm uy tín của người bán đã được cập nhật.`,
        'success'
      );
      setReviewingListingId(null);
      onRefreshAll();
    } catch (err) {
      showNotify(err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredMyListings =
    statusFilter === 'ALL'
      ? myListings
      : myListings.filter((item) => item.status === statusFilter);

  const pendingReceivedCount = receivedOffers.filter(
    (o) => o.status === 'PENDING'
  ).length;
  const acceptedSentCount = sentOffers.filter(
    (o) => o.status === 'ACCEPTED'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header Hồ sơ cá nhân & Điểm uy tín */}
      {currentUser && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={
                currentUser.avatar_url ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.email}`
              }
              alt={currentUser.full_name}
              className="w-16 h-16 rounded-2xl bg-indigo-50 border-2 border-indigo-200 object-cover"
            />
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">
                {currentUser.full_name}
              </h1>
              <p className="text-xs text-slate-500">
                {currentUser.university} • Email: {currentUser.email}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  Điểm uy tín: {Number(currentUser.reputation_score ?? 5.0).toFixed(2)} / 5.0 (
                  {currentUser.total_reviews || 0} lượt đánh giá)
                </span>
                {currentUser.phone && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    <Phone className="w-3.5 h-3.5" />
                    {currentUser.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200">
              <div className="text-lg font-extrabold text-indigo-600">
                {myListings.length}
              </div>
              <div className="text-[11px] font-semibold text-slate-500">
                Tin đã đăng
              </div>
            </div>
            <div className="bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200">
              <div className="text-lg font-extrabold text-emerald-600">
                {receivedOffers.length}
              </div>
              <div className="text-[11px] font-semibold text-slate-500">
                Đề nghị nhận
              </div>
            </div>
            <div className="bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200">
              <div className="text-lg font-extrabold text-blue-600">
                {sentOffers.length}
              </div>
              <div className="text-[11px] font-semibold text-slate-500">
                Đề nghị đã gửi
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3 Khu vực Quản lý Giao dịch */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <button
          type="button"
          onClick={() => setSubTab('my_listings')}
          className={`flex-1 min-w-[200px] py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
            subTab === 'my_listings'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>1. Tin đăng của tôi ({myListings.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('received_offers')}
          className={`flex-1 min-w-[200px] py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
            subTab === 'received_offers'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>2. Đề nghị mua nhận được ({receivedOffers.length})</span>
          {pendingReceivedCount > 0 && (
            <span className="px-2 py-0.5 text-[11px] rounded-full bg-amber-400 text-slate-900 font-extrabold">
              {pendingReceivedCount} chờ chốt
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setSubTab('sent_offers')}
          className={`flex-1 min-w-[200px] py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
            subTab === 'sent_offers'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>3. Đề nghị mua đã gửi ({sentOffers.length})</span>
          {acceptedSentCount > 0 && (
            <span className="px-2 py-0.5 text-[11px] rounded-full bg-emerald-400 text-slate-900 font-extrabold">
              {acceptedSentCount} đã chốt
            </span>
          )}
        </button>
      </div>

      {/* KHU VỰC 1: TIN ĐĂNG CỦA TÔI */}
      {subTab === 'my_listings' && (
        <div className="space-y-4">
          {/* Bộ lọc trạng thái */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'ALL', label: 'Tất cả trạng thái' },
              { id: 'PENDING', label: 'Chờ duyệt (PENDING)' },
              { id: 'APPROVED', label: 'Đang bán (APPROVED)' },
              { id: 'SOLD', label: 'Đã bán (SOLD)' },
              { id: 'REJECTED', label: 'Bị từ chối (REJECTED)' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  statusFilter === st.id
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {filteredMyListings.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
              <p className="text-sm font-semibold text-slate-500">
                Chưa có tin đăng nào trong mục này.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMyListings.map((item) => {
                const stMeta = STATUS_META[item.status] || {
                  label: item.status,
                  badge: 'bg-slate-600 text-white',
                };
                const condMeta = CONDITION_META[item.condition] || {
                  shortLabel: item.condition,
                };
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 flex gap-4 shadow-sm hover:shadow-md transition-all"
                  >
                    <img
                      src={getListingThumbnail(item)}
                      alt={item.title}
                      onClick={() => onSelectListing(item.id)}
                      className="w-28 h-28 rounded-xl object-cover shrink-0 cursor-pointer border border-slate-100"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${stMeta.badge}`}
                          >
                            {stMeta.label}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500">
                            {condMeta.shortLabel}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            #{item.id}
                          </span>
                        </div>
                        <h3
                          onClick={() => onSelectListing(item.id)}
                          className="font-bold text-slate-900 text-sm line-clamp-1 cursor-pointer hover:text-indigo-600"
                        >
                          {item.title}
                        </h3>
                        <div className="text-base font-extrabold text-indigo-600 mt-0.5">
                          {formatVND(item.price)}
                        </div>

                        {item.status === 'REJECTED' && item.rejection_reason && (
                          <div className="mt-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-700 flex items-start gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>
                              <strong>Lý do từ chối:</strong>{' '}
                              {item.rejection_reason}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => onSelectListing(item.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Chi tiết
                        </button>
                        {item.status !== 'SOLD' && (
                          <button
                            type="button"
                            onClick={() => onEditListing(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Sửa tin
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onDeleteListing(item.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* KHU VỰC 2: ĐỀ NGHỊ MUA NHẬN ĐƯỢC (DÀNH CHO NGƯỜI BÁN) */}
      {subTab === 'received_offers' && (
        <div className="space-y-4">
          {receivedOffers.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
              <p className="text-sm font-semibold text-slate-500">
                Hiện chưa có đề nghị mua nào gửi tới các tin đăng của bạn.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {receivedOffers.map((offer) => {
                const stMeta = OFFER_STATUS_META[offer.status] || {
                  label: offer.status,
                  badge: 'bg-slate-100 text-slate-700',
                };
                return (
                  <div
                    key={offer.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${stMeta.badge}`}
                        >
                          {stMeta.label}
                        </span>
                        <span className="text-xs text-slate-400">
                          Đề nghị #{offer.id} • {formatDateTime(offer.created_at)}
                        </span>
                      </div>

                      <div
                        onClick={() =>
                          offer.listing && onSelectListing(offer.listing.id)
                        }
                        className="font-extrabold text-slate-900 text-base hover:text-indigo-600 cursor-pointer"
                      >
                        Món đồ: {offer.listing?.title || `Tin đăng #${offer.listing_id}`}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        <div>
                          Giá niêm yết:{' '}
                          <span className="font-bold text-slate-600 line-through">
                            {formatVND(offer.listing?.price || 0)}
                          </span>
                        </div>
                        <div className="text-sm">
                          Giá người mua đề nghị:{' '}
                          <strong className="text-emerald-700 text-base">
                            {formatVND(offer.offered_price)}
                          </strong>
                        </div>
                      </div>

                      {offer.buyer && (
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/70">
                          <span>
                            Người hỏi mua: <strong>{offer.buyer.full_name}</strong> ({offer.buyer.email})
                          </span>
                          {offer.buyer.phone && (
                            <span className="font-semibold text-indigo-700">
                              • SĐT: {offer.buyer.phone}
                            </span>
                          )}
                        </div>
                      )}

                      {offer.message && (
                        <div className="flex items-start gap-2 text-xs text-slate-700 italic bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                          <MessageSquare className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                          <span>"{offer.message}"</span>
                        </div>
                      )}
                    </div>

                    {/* Nút hành động của Người bán */}
                    <div className="flex sm:flex-col gap-2 shrink-0">
                      {offer.status === 'PENDING' ? (
                        <>
                          <button
                            type="button"
                            disabled={processingId === offer.id}
                            onClick={() => handleAcceptOffer(offer)}
                            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Chấp nhận bán &amp; Chốt đơn Đã bán</span>
                          </button>
                          <button
                            type="button"
                            disabled={processingId === offer.id}
                            onClick={() => handleRejectOffer(offer)}
                            className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Từ chối đề nghị</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400 italic">
                          Đã hoàn tất phản hồi
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* KHU VỰC 3: ĐỀ NGHỊ MUA ĐÃ GỬI (DÀNH CHO NGƯỜI MUA) */}
      {subTab === 'sent_offers' && (
        <div className="space-y-4">
          {sentOffers.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
              <p className="text-sm font-semibold text-slate-500">
                Bạn chưa gửi đề nghị mua hàng nào. Hãy khám phá chợ và gửi trả giá!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sentOffers.map((offer) => {
                const stMeta = OFFER_STATUS_META[offer.status] || {
                  label: offer.status,
                  badge: 'bg-slate-100 text-slate-700',
                };
                const isAccepted = offer.status === 'ACCEPTED';
                return (
                  <div
                    key={offer.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${stMeta.badge}`}
                          >
                            {stMeta.label}
                          </span>
                          <span className="text-xs text-slate-400">
                            Gửi lúc: {formatDateTime(offer.created_at)}
                          </span>
                        </div>

                        <div
                          onClick={() =>
                            offer.listing && onSelectListing(offer.listing.id)
                          }
                          className="font-extrabold text-slate-900 text-base hover:text-indigo-600 cursor-pointer"
                        >
                          {offer.listing?.title || `Tin đăng #${offer.listing_id}`}
                        </div>

                        <div className="text-xs text-slate-600">
                          Mức giá bạn đề nghị:{' '}
                          <strong className="text-indigo-600 text-sm">
                            {formatVND(offer.offered_price)}
                          </strong>{' '}
                          (Giá gốc: {formatVND(offer.listing?.price || 0)})
                        </div>

                        {offer.message && (
                          <p className="text-xs text-slate-500 italic">
                            Lời nhắn: "{offer.message}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            offer.listing && onSelectListing(offer.listing.id)
                          }
                          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                        >
                          Xem món đồ
                        </button>
                        {isAccepted && (
                          <button
                            type="button"
                            onClick={() =>
                              setReviewingListingId(
                                reviewingListingId === offer.listing_id
                                  ? null
                                  : offer.listing_id
                              )
                            }
                            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs inline-flex items-center gap-1.5 shadow-sm"
                          >
                            <Star className="w-4 h-4 fill-white" />
                            <span>Đánh giá người bán 1-5 sao</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Khung mở rộng Đánh giá 1-5 sao ngay trên thẻ */}
                    {reviewingListingId === offer.listing_id && (
                      <form
                        onSubmit={(e) => handleQuickReview(e, offer.listing_id)}
                        className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-amber-900">
                            Đánh giá chất lượng món đồ &amp; uy tín người bán (1 - 5 sao):
                          </span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => setRating(st)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border ${
                                  rating >= st
                                    ? 'bg-amber-400 text-slate-900 border-amber-500'
                                    : 'bg-white text-slate-400 border-slate-200'
                                }`}
                              >
                                <Star className="w-3.5 h-3.5 fill-current" />
                                {st}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            required
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="Nhập nhận xét của bạn về người bán..."
                            className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-amber-300 bg-white outline-none"
                          />
                          <button
                            type="submit"
                            disabled={processingId === `rev-${offer.listing_id}`}
                            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shrink-0"
                          >
                            {processingId === `rev-${offer.listing_id}`
                              ? 'Đang gửi...'
                              : 'Gửi đánh giá ngay'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
