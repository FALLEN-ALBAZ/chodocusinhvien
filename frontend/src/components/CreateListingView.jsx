import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Upload,
  Link as LinkIcon,
  Trash2,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Info,
  Image as ImageIcon,
  ArrowLeft,
} from 'lucide-react';
import {
  apiRequest,
  uploadImagesApi,
  CONDITION_META,
  SAMPLE_ITEM_IMAGES,
  formatVND,
} from '../api';

export default function CreateListingView({
  categories,
  token,
  currentUser,
  editingListing,
  onClearEditing,
  onSuccess,
  showNotify,
  onRequireAuth,
  myListings = [],
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('150000');
  const [condition, setCondition] = useState('LIKE_NEW');
  const [categoryId, setCategoryId] = useState(
    categories[0]?.id ? String(categories[0].id) : '1'
  );
  const [imageUrls, setImageUrls] = useState([SAMPLE_ITEM_IMAGES[0].url]);
  const [newUrlInput, setNewUrlInput] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingListing) {
      setTitle(editingListing.title || '');
      setDescription(editingListing.description || '');
      setPrice(String(editingListing.price ?? 0));
      setCondition(editingListing.condition || 'GOOD');
      setCategoryId(String(editingListing.category_id || categories[0]?.id || 1));
      const existingImgs =
        editingListing.images?.map((i) => i.image_url) || [];
      setImageUrls(
        existingImgs.length > 0 ? existingImgs : [SAMPLE_ITEM_IMAGES[0].url]
      );
    }
  }, [editingListing, categories]);

  // Tính số tin đã đăng hôm nay của sinh viên hiện tại để hiển thị hạn mức chống spam 5 tin/ngày
  const todayStr = new Date().toISOString().slice(0, 10);
  const postedTodayCount = myListings.filter((item) =>
    String(item.created_at || '').startsWith(todayStr)
  ).length;
  const dailyLimit = 5;

  // Điền nhanh dữ liệu mẫu phục vụ Demo bảo vệ ĐG2
  const handleFillSampleData = () => {
    setTitle('Giáo trình Cấu trúc Dữ liệu & Giải thuật + Máy tính Casio FX-580VN X');
    setDescription(
      'Mình vừa qua môn với điểm A nên nhượng lại combo sách giáo trình Cấu trúc dữ liệu & Giải thuật (bản in màu rõ nét, không viết bẩn) kèm máy tính bỏ túi Casio FX-580VN X chính hãng còn nguyên nắp trượt. Giao dịch trực tiếp tại sảnh thư viện trường HPU.'
    );
    setPrice('180000');
    setCondition('LIKE_NEW');
    if (categories.length > 0) {
      setCategoryId(String(categories[0].id));
    }
    setImageUrls([
      SAMPLE_ITEM_IMAGES[1].url,
      SAMPLE_ITEM_IMAGES[0].url,
    ]);
    showNotify('Đã điền dữ liệu mẫu nhanh để sẵn sàng đăng tin!', 'info');
  };

  // Tải lên nhiều file ảnh thật từ máy tính
  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    setUploadingFiles(true);
    try {
      const res = await uploadImagesApi(files, token);
      if (res?.image_urls?.length) {
        setImageUrls((prev) => [...prev, ...res.image_urls]);
        showNotify(
          `Đã tải lên thành công ${res.image_urls.length} tệp hình ảnh lên máy chủ (/uploads)!`,
          'success'
        );
      }
    } catch (err) {
      showNotify(err.message, 'error');
    } finally {
      setUploadingFiles(false);
      e.target.value = '';
    }
  };

  const handleAddUrl = () => {
    const trimmed = newUrlInput.trim();
    if (!trimmed) return;
    setImageUrls((prev) => [...prev, trimmed]);
    setNewUrlInput('');
  };

  const handleRemoveImage = (idx) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth();
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        condition,
        category_id: Number(categoryId),
        image_urls: imageUrls,
      };

      if (editingListing) {
        const updated = await apiRequest(`/listings/${editingListing.id}`, {
          method: 'PUT',
          token,
          body: payload,
        });
        showNotify(
          `Đã cập nhật thành công tin đăng "${updated.title}"!`,
          'success'
        );
        onSuccess(updated);
      } else {
        const created = await apiRequest('/listings', {
          method: 'POST',
          token,
          body: payload,
        });
        showNotify(
          `Đăng tin "${created.title}" thành công! Tin đang ở trạng thái CHỜ DUYỆT (PENDING).`,
          'success'
        );
        onSuccess(created);
      }
    } catch (err) {
      showNotify(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner thông tin quy tắc nghiệp vụ & hạn mức chống spam */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <span>Quy trình Kiểm duyệt &amp; Chống Spam Chợ Sinh Viên</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold">
            {editingListing
              ? `Chỉnh sửa tin đăng #${editingListing.id}`
              : 'Đăng Tin Bán Đồ Cũ Sinh Viên'}
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100 max-w-2xl">
            Mọi tin mới đăng sẽ có trạng thái <strong>PENDING (Chờ duyệt)</strong> để Kiểm duyệt viên xác minh trước khi hiển thị công khai trên chợ.
          </p>
        </div>

        {/* Hạn mức chống spam 5 tin/ngày */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shrink-0 text-center">
          <div className="text-[11px] uppercase tracking-wider text-indigo-200 font-bold">
            Hạn mức chống Spam hôm nay
          </div>
          <div className="text-2xl font-extrabold mt-0.5">
            {postedTodayCount} / {dailyLimit} <span className="text-sm font-medium">tin</span>
          </div>
          <div className="text-[11px] text-amber-300 font-semibold mt-0.5">
            Tối đa {dailyLimit} tin mới / ngày
          </div>
        </div>
      </div>

      {/* Thanh công cụ hỗ trợ điền mẫu nhanh */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Info className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            Bạn có thể tải ảnh thật từ thiết bị (lưu tại <code>/uploads</code>) hoặc chọn ảnh minh họa có sẵn.
          </span>
        </div>
        <div className="flex items-center gap-2">
          {editingListing && (
            <button
              type="button"
              onClick={onClearEditing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Hủy chế độ sửa
            </button>
          )}
          <button
            type="button"
            onClick={handleFillSampleData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            Điền nhanh dữ liệu mẫu (1-Click Demo)
          </button>
        </div>
      </div>

      {/* Form đăng tin */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Tiêu đề */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Tiêu đề tin đăng (Tối thiểu 5 ký tự) *
            </label>
            <input
              type="text"
              required
              minLength={5}
              maxLength={255}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Nhượng lại Giáo trình Toán Cao Cấp A1 + Đèn bàn học chống cận"
              className="w-full px-4 py-3 text-sm font-semibold rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Danh mục */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Danh mục sản phẩm *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 text-sm font-semibold rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Giá bán */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Giá bán mong muốn (VNĐ) * — Hiển thị: {formatVND(price)}
            </label>
            <input
              type="number"
              required
              min={0}
              step={1000}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Nhập 0 nếu muốn tặng miễn phí"
              className="w-full px-4 py-3 text-sm font-bold text-indigo-700 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Tình trạng món đồ */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Tình trạng thực tế của món đồ *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(CONDITION_META).map(([key, meta]) => {
                const selected = condition === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCondition(key)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      selected
                        ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500/20'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900">
                        {meta.label}
                      </span>
                      {selected && (
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {meta.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mô tả chi tiết */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Mô tả chi tiết sản phẩm &amp; địa điểm giao dịch (Tối thiểu 10 ký tự) *
            </label>
            <textarea
              rows={4}
              required
              minLength={10}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả rõ tình trạng, phụ kiện đi kèm, lý do nhượng lại và địa điểm thuận tiện giao dịch (ví dụ: Thư viện HPU, Ký túc xá...)"
              className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Khu vực Quản lý Hình ảnh (Tải file thật + Thêm URL + Gợi ý ảnh) */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                Hình ảnh minh họa sản phẩm ({imageUrls.length} ảnh)
              </h3>
              <p className="text-xs text-slate-500">
                Hỗ trợ tải nhiều file ảnh trực tiếp từ máy tính (<code>.jpg, .png, .webp</code>) hoặc dán đường dẫn URL ảnh.
              </p>
            </div>

            {/* Nút tải file ảnh thật */}
            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              <span>
                {uploadingFiles
                  ? 'Đang tải ảnh lên...'
                  : 'Tải ảnh từ máy tính (Upload thật)'}
              </span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Ô nhập thêm URL ảnh */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="url"
                value={newUrlInput}
                onChange={(e) => setNewUrlInput(e.target.value)}
                placeholder="Hoặc dán URL hình ảnh (https://...) vào đây"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleAddUrl}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shrink-0"
            >
              + Thêm URL ảnh
            </button>
          </div>

          {/* Các nút chọn nhanh ảnh mẫu theo chủ đề */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500">
              Chọn nhanh ảnh mẫu:
            </span>
            {SAMPLE_ITEM_IMAGES.map((sample) => (
              <button
                key={sample.label}
                type="button"
                onClick={() =>
                  setImageUrls((prev) =>
                    prev.includes(sample.url) ? prev : [...prev, sample.url]
                  )
                }
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 transition-colors"
              >
                + {sample.label}
              </button>
            ))}
          </div>

          {/* Lưới hiển thị các ảnh đã chọn */}
          {imageUrls.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {imageUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="relative group rounded-2xl overflow-hidden border border-slate-200 aspect-[4/3] bg-slate-100"
                >
                  <img
                    src={url}
                    alt={`Ảnh sản phẩm ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/75 text-white text-[10px] font-bold">
                    {idx === 0 ? 'Ảnh bìa chính' : `Ảnh #${idx + 1}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600 text-white opacity-90 hover:opacity-100 shadow-sm"
                    title="Xóa ảnh này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nút Submit */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-extrabold text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all"
          >
            <PlusCircle className="w-5 h-5" />
            <span>
              {submitting
                ? 'Đang xử lý...'
                : editingListing
                ? 'Lưu Cập Nhật Tin Đăng'
                : 'Đăng Tin Bán Đồ Ngay'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
