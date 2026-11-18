import React, { useState } from "react";
import { submitReport } from "../services/reportService";

const CATEGORIES = [
  { value: "MISBEHAVIOUR", label: "Misbehaviour / Unprofessional Conduct" },
  { value: "PAYMENT_DISPUTE", label: "Payment or UPI Dispute" },
  { value: "FRAUD_SUSPICION", label: "Fraud or Fake Listing Suspicion" },
  { value: "ORDER_ISSUE", label: "Order / Item Quality Issue" },
  { value: "INCORRECT_INVENTORY", label: "Incorrect Inventory or Pricing" },
  { value: "OTHER", label: "Other Concern / Inquiry" },
];

export default function ReportIssueModal({
  isOpen,
  onClose,
  shopId = null,
  shopName = null,
  orderNumber = "",
  onReportSubmitted,
}) {
  const [category, setCategory] = useState("MISBEHAVIOUR");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [orderNum, setOrderNum] = useState(orderNumber || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!subject.trim()) {
      setError("Please enter a subject");
      return;
    }
    if (!description.trim()) {
      setError("Please describe the issue in detail");
      return;
    }

    setLoading(true);
    try {
      await submitReport({
        category,
        subject: subject.trim(),
        description: description.trim(),
        shopId: shopId || undefined,
        orderNumber: orderNum.trim() || undefined,
      });

      setSuccess(true);
      if (onReportSubmitted) {
        onReportSubmitted();
      }
      setTimeout(() => {
        setSuccess(false);
        setSubject("");
        setDescription("");
        onClose();
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to submit your report. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 to-red-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-lg">
              ⚠️
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">
                Report Issue / Misbehaviour
              </h3>
              <p className="text-xs text-rose-100">
                Directly reviewed by Platform Admin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        {success ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto">
              ✓
            </div>
            <h4 className="text-xl font-bold text-slate-900">Report Registered!</h4>
            <p className="text-sm text-slate-600 max-w-sm mx-auto">
              Thank you for keeping ShopFlow safe. The administrator has been
              notified and will take appropriate action.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                {error}
              </div>
            )}

            {shopName && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 flex items-center justify-between">
                <span className="font-semibold text-slate-500 uppercase tracking-wider">
                  Target Shop
                </span>
                <span className="font-bold text-slate-900">{shopName}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium text-slate-800"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Related Order ID (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. ORD-173190..."
                value={orderNum}
                onChange={(e) => setOrderNum(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Subject <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Brief summary of the issue..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Detailed Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                placeholder="Please describe what happened in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-md shadow-rose-600/20 transition-all disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
