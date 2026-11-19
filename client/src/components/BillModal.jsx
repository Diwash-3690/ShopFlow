import React, { useRef } from "react";
import {
  Printer,
  Download,
  X,
  CheckCircle2,
  MapPin,
  Phone,
  CreditCard,
  Receipt,
} from "lucide-react";
import { Button } from "./ui/button";

function BillModal({ bill, onClose }) {
  const receiptRef = useRef(null);
  if (!bill) return null;

  const isOnline = bill.orderType === "ONLINE";
  const formattedDate = bill.issuedAt
    ? new Date(bill.issuedAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  const generateReceiptHtml = () => {
    const el = document.getElementById("printable-bill");
    if (!el) return "";
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Receipt - ${bill.billNumber || bill.orderNumber || "Invoice"}</title>
          <style>
            @page { size: auto; margin: 8mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              margin: 0 auto;
              padding: 12px;
              color: #0f172a;
              font-size: 11px;
              max-width: 400px;
              line-height: 1.4;
            }
            * { box-sizing: border-box; }
            svg {
              width: 10px !important;
              height: 10px !important;
              max-width: 10px !important;
              max-height: 10px !important;
              display: inline-block;
              vertical-align: middle;
              margin-right: 3px;
            }
            .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 10px; margin-bottom: 10px; }
            .store-name { font-size: 16px; font-weight: 900; margin: 0 0 2px 0; color: #0f172a; }
            .meta { color: #64748b; font-size: 10px; margin: 2px 0; }
            .badge { display: inline-block; padding: 2px 6px; background: #f1f5f9; border-radius: 4px; font-size: 9px; font-family: monospace; font-weight: bold; }
            .pickup-box { border: 2px dashed #10b981; background: #f0fdf4; padding: 8px; border-radius: 8px; text-align: center; margin: 8px 0; }
            .pickup-code { font-size: 18px; font-weight: 900; letter-spacing: 2px; color: #065f46; font-family: monospace; }
            table { width: 100%; border-collapse: collapse; margin: 8px 0; }
            th { border-bottom: 1px solid #0f172a; text-align: left; padding: 4px 2px; font-size: 9px; text-transform: uppercase; color: #64748b; }
            td { padding: 4px 2px; border-bottom: 1px dashed #e2e8f0; font-size: 11px; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
            .font-bold { font-weight: bold; }
            .totals { margin-top: 8px; border-top: 1px solid #0f172a; padding-top: 6px; }
            .totals-row { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 11px; }
            .grand-total { font-size: 14px; font-weight: 900; border-top: 2px solid #0f172a; padding-top: 4px; margin-top: 4px; }
            .utr-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px; margin-top: 8px; font-size: 10px; }
            .footer { text-align: center; margin-top: 12px; font-size: 9px; color: #94a3b8; border-top: 1px dashed #e2e8f0; padding-top: 8px; }
          </style>
        </head>
        <body>
          ${el.innerHTML}
        </body>
      </html>
    `;
  };

  const handlePrint = () => {
    try {
      const htmlContent = generateReceiptHtml();
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0px";
      iframe.style.height = "0px";
      iframe.style.border = "none";
      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow || iframe.contentDocument;
      const doc = frameDoc.document || frameDoc;
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }, 300);
    } catch {
      window.print();
    }
  };

  const handleDownload = () => {
    try {
      const htmlContent = generateReceiptHtml();
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Receipt_${bill.billNumber || bill.orderNumber || "Order"}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.print();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl max-w-sm sm:max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Control Bar (Hidden on Print) */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-slate-700" />
            <span className="font-bold text-xs text-slate-800">
              Receipt / Tax Invoice
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              onClick={handlePrint}
              className="h-8 px-2.5 text-xs font-bold bg-slate-900 hover:bg-emerald-600 text-white gap-1"
              title="Print Receipt"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-8 px-2 text-xs text-slate-600 hover:text-slate-900"
              title="Download Receipt HTML"
            >
              <Download className="w-3.5 h-3.5" />
            </Button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Compact Printable Receipt */}
        <div
          id="printable-bill"
          ref={receiptRef}
          className="p-4 sm:p-5 text-slate-900 bg-white space-y-3.5 text-xs font-sans"
        >
          {/* Header */}
          <div className="header text-center border-b border-dashed border-slate-300 pb-3">
            <h2 className="store-name text-base font-black tracking-tight text-slate-950">
              {bill.shop?.shopName || "Merchant Store"}
            </h2>

            <div className="flex items-center justify-center gap-1.5 mt-1 text-[10px] text-slate-500 flex-wrap">
              <span className="badge font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                Shop ID: {bill.shop?.shopId || "LOCAL"}
              </span>
              {bill.shop?.shopNumber && (
                <span className="text-slate-500 font-medium">
                  Reg: {bill.shop.shopNumber}
                </span>
              )}
            </div>

            <div className="mt-1.5 text-[11px] text-slate-600 space-y-0.5">
              <p className="flex items-center justify-center gap-1 text-center">
                <MapPin width={11} height={11} className="w-3 h-3 text-slate-400 shrink-0 inline-block" />
                <span>{bill.shop?.address || "Neighborhood Retail Merchant"}</span>
              </p>
              <p className="flex items-center justify-center gap-1">
                <Phone width={11} height={11} className="w-3 h-3 text-slate-400 shrink-0 inline-block" />
                <span>Ph: {bill.shop?.contactNumber || "N/A"}</span>
              </p>
              {bill.shop?.upiId && (
                <p className="flex items-center justify-center gap-1 font-mono text-[10px] text-purple-700">
                  <CreditCard width={11} height={11} className="w-3 h-3 text-purple-500 shrink-0 inline-block" />
                  <span>UPI: {bill.shop.upiId}</span>
                </p>
              )}
            </div>
          </div>

          {/* Invoice Metadata Strip */}
          <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <div>
              <p className="font-mono font-bold text-slate-900 text-xs">
                {bill.billNumber || `INV-${bill.orderNumber?.slice(-6) || "RECEIPT"}`}
              </p>
              <p className="text-[10px] text-slate-500">{formattedDate}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-slate-700">#{bill.orderNumber}</p>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded uppercase">
                {isOnline ? "Store Pickup" : "Walk-in"}
              </span>
            </div>
          </div>

          {/* Pickup Verification Box (If online pickup) */}
          {bill.pickupId && (
            <div className="pickup-box border border-dashed border-emerald-400 bg-emerald-50/80 p-2.5 rounded-xl text-center">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                Counter Pickup Verification Code
              </span>
              <span className="pickup-code text-lg font-black text-emerald-800 font-mono tracking-widest block mt-0.5">
                {bill.pickupId}
              </span>
            </div>
          )}

          {/* Itemized Table */}
          <div className="pt-1">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-slate-900 text-[10px] uppercase text-slate-500 font-bold">
                  <th className="py-1 px-1">Item</th>
                  <th className="py-1 px-1 text-center w-8">Qty</th>
                  <th className="py-1 px-1 text-right w-16">Price</th>
                  <th className="py-1 px-1 text-right w-16">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-slate-200">
                {bill.items?.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="py-1.5 px-1 font-medium text-slate-900">
                      {item.productName}
                      <span className="text-[9px] text-slate-400 block font-normal">
                        ({item.unit})
                      </span>
                    </td>
                    <td className="py-1.5 px-1 text-center font-bold text-slate-700">
                      {item.quantity}
                    </td>
                    <td className="py-1.5 px-1 text-right font-mono text-slate-600">
                      ₹{parseFloat(item.unitPrice || 0).toFixed(2)}
                    </td>
                    <td className="py-1.5 px-1 text-right font-bold text-slate-900 font-mono">
                      ₹{parseFloat(item.lineTotal || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="totals border-t border-slate-900 pt-2 space-y-1 text-[11px]">
            <div className="totals-row flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono">
                ₹{parseFloat(bill.subtotal || bill.totalAmount || 0).toFixed(2)}
              </span>
            </div>
            <div className="totals-row flex justify-between text-slate-500 text-[10px]">
              <span>Platform Convenience Fee:</span>
              <span className="font-bold text-emerald-700 font-mono">FREE (₹0.00)</span>
            </div>
            <div className="grand-total flex justify-between text-sm font-black text-slate-950 border-t-2 border-slate-900 pt-1.5">
              <span>Grand Total:</span>
              <span className="font-mono text-emerald-700">
                ₹{parseFloat(bill.totalAmount || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment & UTR Strip */}
          <div className="utr-box bg-slate-50 border border-slate-200 p-2 rounded-xl text-[10px] space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <CheckCircle2 width={11} height={11} className="w-3 h-3 text-emerald-600 inline-block" />
                Status: {bill.payment?.status || "VERIFIED"} ({bill.payment?.method || "UPI"})
              </span>
              {bill.payment?.paidAt && (
                <span className="text-slate-400">
                  {new Date(bill.payment.paidAt).toLocaleTimeString()}
                </span>
              )}
            </div>

            {bill.payment?.providerTransactionId && (
              <div className="flex items-center justify-between border-t border-slate-200/80 pt-1">
                <span className="text-slate-500 font-semibold">Bank Ref / UTR:</span>
                <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono font-bold text-slate-900">
                  {bill.payment.providerTransactionId}
                </code>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="footer text-center text-[10px] text-slate-400 border-t border-dashed border-slate-200 pt-2 leading-tight">
            <p className="font-semibold text-slate-600">
              Thank you for shopping local!
            </p>
            <p className="text-[9px] text-slate-400 mt-0.5">
              Issued by {bill.shop?.shopName || "Merchant"} on ShopFlow
            </p>
          </div>
        </div>

        {/* Bottom bar (hidden on print) */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between print:hidden">
          <span className="text-[10px] text-slate-400">
            Compact Retail Slip
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="h-8 text-xs font-semibold"
          >
            Close Receipt
          </Button>
        </div>
      </div>
    </div>
  );
}

export default BillModal;
