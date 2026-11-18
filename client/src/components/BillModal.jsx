import { FiPrinter, FiX, FiCheckCircle, FiMapPin, FiPhone, FiCreditCard } from "react-icons/fi";

function BillModal({ bill, onClose }) {
  if (!bill) return null;

  const handlePrint = () => {
    window.print();
  };

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

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-fadeIn">
        {/* Modal Top Bar (hidden during printing) */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧾</span>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Retail Invoice / Official Receipt</h3>
              <p className="text-[10px] text-slate-400">Zero-commission local commerce proof</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer shadow-xs"
            >
              <FiPrinter size={14} /> Print Receipt
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer transition hover:bg-slate-200/50"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div id="printable-bill" className="p-6 sm:p-8 space-y-6 text-slate-800 bg-white">
          {/* Shop Header Banner */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                    {bill.shop?.shopName || "Merchant Store"}
                  </h1>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                    Shop ID: {bill.shop?.shopId || "LOCAL-STORE"}
                  </span>
                  {bill.shop?.shopNumber && (
                    <span className="text-[11px] text-slate-500 font-medium">
                      Reg/Shop No: {bill.shop.shopNumber}
                    </span>
                  )}
                </div>

                {/* Shop Location & Contact Details */}
                <div className="mt-2 text-xs text-slate-600 space-y-0.5">
                  <p className="flex items-start gap-1.5 max-w-sm">
                    <FiMapPin className="text-emerald-700 shrink-0 mt-0.5" size={13} />
                    <span>{bill.shop?.address || "Neighborhood Store, Registered on ShopFlow"}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <FiPhone className="text-emerald-700 shrink-0" size={13} />
                    <span>Contact: {bill.shop?.contactNumber || "N/A"}</span>
                  </p>
                  {bill.shop?.upiId && (
                    <p className="flex items-center gap-1.5 text-purple-900 font-medium font-mono text-[11px]">
                      <FiCreditCard className="text-purple-700 shrink-0" size={13} />
                      <span>Merchant UPI: {bill.shop.upiId}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Invoice Meta Column */}
              <div className="text-left sm:text-right space-y-1 bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-2xl border sm:border-0 border-slate-100">
                <div className="inline-block px-3 py-1 bg-slate-900 text-white font-mono text-xs font-black uppercase tracking-wider rounded-lg">
                  {bill.billNumber || "RETAIL INVOICE"}
                </div>
                <p className="text-xs text-slate-500 pt-1">
                  <strong>Date:</strong> {formattedDate}
                </p>
                <p className="text-xs font-semibold text-slate-700">
                  <strong>Order:</strong> #{bill.orderNumber}
                </p>
                <p className="text-xs text-slate-500">
                  <strong>Channel:</strong> {isOnline ? "Online Pickup" : "Counter Walk-in"}
                </p>
              </div>
            </div>
          </div>

          {/* Customer & Order Metadata Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <p className="text-slate-400 uppercase font-bold text-[10px] tracking-wider">Customer Details</p>
              <p className="font-bold text-slate-800 text-sm mt-0.5">
                {bill.customer?.mobile || "Counter Walk-in Guest"}
              </p>
              <p className="text-[11px] text-slate-500">Customer Registered Account</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase font-bold text-[10px] tracking-wider">Fulfillment & Order State</p>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="font-bold text-slate-800">
                  {isOnline ? "Store Counter Pickup" : "Direct Walk-in Sale"}
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full uppercase">
                  {bill.status || "CONFIRMED"}
                </span>
              </div>
            </div>
          </div>

          {/* Online Order Unique Pickup ID Banner */}
          {bill.pickupId && (
            <div className="p-4 bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div>
                <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  Official Verification Code
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Present this code to the merchant upon counter collection
                </p>
              </div>
              <div className="bg-emerald-800 text-white font-mono text-xl font-black px-4 py-2 rounded-xl tracking-widest shadow-xs">
                {bill.pickupId}
              </div>
            </div>
          )}

          {/* Itemized Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-50/50">
                  <th className="py-2.5 px-2 font-bold w-10">#</th>
                  <th className="py-2.5 px-2 font-bold">Item Description</th>
                  <th className="py-2.5 px-2 text-center font-bold">Qty</th>
                  <th className="py-2.5 px-2 text-right font-bold">Unit Price</th>
                  <th className="py-2.5 px-2 text-right font-bold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bill.items?.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-2 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                    <td className="py-3 px-2 font-semibold text-slate-900">
                      {item.productName}
                      <span className="text-[10px] text-slate-400 font-normal ml-1">({item.unit})</span>
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-slate-700">{item.quantity}</td>
                    <td className="py-3 px-2 text-right text-slate-600 font-mono">
                      ₹{parseFloat(item.unitPrice || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-right font-bold text-slate-950 font-mono">
                      ₹{parseFloat(item.lineTotal || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Fee Breakdown */}
          <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4">
            <div className="text-xs text-slate-500 space-y-1">
              <p className="flex items-center gap-1.5 font-medium text-emerald-800">
                <FiCheckCircle size={13} className="text-emerald-600" />
                Zero Platform Commission • 100% Direct to Store
              </p>
              <p className="text-[11px] text-slate-400">All prices include applicable local taxes.</p>
            </div>

            <div className="w-full sm:w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-mono">₹{parseFloat(bill.subtotal || bill.totalAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Platform Convenience Fee</span>
                <span className="text-emerald-700 font-semibold font-mono">FREE (₹0.00)</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-950 pt-2 border-t-2 border-slate-900">
                <span>Grand Total</span>
                <span className="text-emerald-700 font-mono">₹{parseFloat(bill.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Verification & UTR Audit Box */}
          <div className="border border-slate-200 bg-slate-50/70 p-4 rounded-2xl text-xs space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700">
                  <FiCheckCircle size={13} />
                </span>
                <span className="font-bold text-slate-900">
                  Payment Status: {bill.payment?.status || "VERIFIED"}
                </span>
                <span className="text-[11px] text-slate-500">
                  via {bill.payment?.method || "UPI"}
                </span>
              </div>

              {bill.payment?.paidAt && (
                <span className="text-[11px] text-slate-400">
                  Verified on: {new Date(bill.payment.paidAt).toLocaleTimeString()}
                </span>
              )}
            </div>

            {/* Prominent UTR Display */}
            {bill.payment?.providerTransactionId && (
              <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                <span className="text-slate-500 font-medium">Bank Transaction Ref / UTR:</span>
                <code className="bg-white px-2.5 py-1 rounded-md border border-slate-300 font-mono font-bold text-slate-900 text-xs">
                  {bill.payment.providerTransactionId}
                </code>
              </div>
            )}
          </div>

          {/* Professional Footer */}
          <div className="border-t border-dashed border-slate-200 pt-4 text-center text-slate-400 text-[11px] space-y-1">
            <p className="font-medium text-slate-600">
              Thank you for supporting your local neighborhood store!
            </p>
            <p>
              This is a digitally generated store invoice issued by <strong>{bill.shop?.shopName || "the Merchant"}</strong> on ShopFlow.
            </p>
          </div>
        </div>

        {/* Modal Bottom Close Bar (hidden during print) */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between print:hidden">
          <p className="text-xs text-slate-500 font-medium">
            Press Print to download PDF or print receipt
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

export default BillModal;
