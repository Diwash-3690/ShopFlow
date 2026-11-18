import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, Store, ShoppingBag } from "lucide-react";
import { submitReport } from "../services/reportService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";

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
      }, 1800);
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent onClose={onClose} className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <Badge variant="destructive" className="text-[10px]">
              Direct Admin Review
            </Badge>
          </div>
          <DialogTitle className="text-lg font-black text-slate-900">
            Report Issue / Misbehaviour
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Your complaint will be directly submitted to the platform governance desk.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Report Registered!</h4>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              Thank you for keeping ShopFlow safe. The administrator has been notified and will take appropriate action.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}

            {shopName && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs flex items-center justify-between">
                <span className="font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5" /> Target Shop
                </span>
                <span className="font-bold text-slate-900">{shopName}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Related Order ID (Optional)
              </label>
              <div className="relative">
                <ShoppingBag className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
                <Input
                  type="text"
                  placeholder="e.g. ORD-173190..."
                  value={orderNum}
                  onChange={(e) => setOrderNum(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Subject <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                required
                placeholder="Brief summary of the issue..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Detailed Description <span className="text-rose-500">*</span>
              </label>
              <Textarea
                required
                rows={3}
                placeholder="Please describe what happened in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={loading}
                className="bg-rose-600 hover:bg-rose-700"
              >
                {loading ? "Submitting..." : "Submit Report"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
