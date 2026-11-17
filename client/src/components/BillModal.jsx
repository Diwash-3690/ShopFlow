import { FiPrinter, FiX, FiCheckCircle } from "react-icons/fi";

function BillModal({ bill, onClose }) {
  if (!bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const isCompleted = bill.status === "COMPLETED";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-fadeIn">
        {/* Modal Top Bar (hidden during print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧾</span>
            <h3 className="font-bold text-slate-800 text-sm">Official Order Receipt</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer shadow-xs"
            >
              <FiPrinter size={14} /> Print Bill
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer transition"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* Printable Bill Area */}
        <div id="printable-bill" className="p-6 sm:p-8 space-y-6 text-slate-800">
          {/* Header */}
          <div className="border-b border-slate-200 pb-5 text-center sm:text-left sm:flex sm:justify-between sm:items-start gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {bill.shop?.shopName || "Local Store"}
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">{bill.shop?.address}</p>
              <p className="text-xs text-slate-500">Phone: {bill.shop?.contactNumber}</p>
              {bill.shop?.upiId && (
                <p className="text-xs text-slate-500">UPI: {bill.shop?.upiId}</p>
              )}
            </div>
            <div className="mt-4 sm:mt-0 text-center sm:text-right">
              <span className="inline-block px-2.5 py-1 rounded bg-slate-900 text-white font-mono text-xs font-bold uppercase tracking-wider">
                {bill.billNumber || "BILL RECEIPT"}
              </span>
              <p className="text-xs text-slate-500 mt-2">
                Date: {bill.issuedAt ? new Date(bill.issuedAt).toLocaleString() : new Date().toLocaleString()}
              </p>
              <p className="text-xs font-semibold text-slate-700">
                Order #{bill.orderNumber}
              </p>
              {bill.pickupId && (
                <div className="mt-2 inline-block bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded text-xs font-bold">
                  Pickup ID: {bill.pickupId}
                </div>
              )}
            </div>
          </div>

          {/* Customer / Order Meta */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <div>
              <p className="text-slate-400 uppercase font-semibold text-[10px]">Customer</p>
              <p className="font-semibold text-slate-700 mt-0.5">
                {bill.customer?.mobile || "Counter Walk-in"}
              </p>
            </div>
            <div>
              <p className="text-slate-400 uppercase font-semibold text-[10px]">Order Type & Status</p>
              <p className="font-semibold text-slate-700 mt-0.5 flex items-center gap-1">
                {bill.orderType === "ONLINE" ? "Online Pickup" : "Walk-in Sale"} •{" "}
                <span className={isCompleted ? "text-emerald-700" : "text-amber-700"}>
                  {bill.status}
                </span>
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2 font-semibold">Item</th>
                  <th className="py-2 text-center font-semibold">Qty</th>
                  <th className="py-2 text-right font-semibold">Unit Price</th>
                  <th className="py-2 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bill.items?.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="py-2.5 font-medium text-slate-800">
                      {item.productName}
                      <span className="text-[10px] text-slate-400 ml-1">({item.unit})</span>
                    </td>
                    <td className="py-2.5 text-center text-slate-600">{item.quantity}</td>
                    <td className="py-2.5 text-right text-slate-600">₹{item.unitPrice.toFixed(2)}</td>
                    <td className="py-2.5 text-right font-semibold text-slate-900">
                      ₹{item.lineTotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t border-slate-200 pt-4 space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Subtotal</span>
              <span>₹{(bill.subtotal || bill.totalAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-black text-slate-900 pt-1 border-t border-slate-100">
              <span>Grand Total</span>
              <span className="text-emerald-700">₹{bill.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment & Footer */}
          <div className="border-t border-dashed border-slate-200 pt-4 text-center space-y-1">
            <p className="text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5">
              <FiCheckCircle className="text-emerald-600" size={14} /> Payment {bill.payment?.status || "VERIFIED"} via{" "}
              {bill.payment?.method || "UPI"}
            </p>
            {bill.payment?.providerTransactionId && (
              <p className="text-[10px] text-slate-400 font-mono">
                Ref: {bill.payment.providerTransactionId}
              </p>
            )}
            <p className="text-[11px] text-slate-400 pt-2">
              Thank you for supporting local businesses! Powered by ShopFlow.
            </p>
          </div>
        </div>

        {/* Footer Actions (hidden during print) */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

export default BillModal;
