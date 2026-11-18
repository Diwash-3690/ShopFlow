import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Badge } from "./ui/badge";

function AuthLayout({ title, subtitle, children, accent = "blue", brandBadge = "ShopFlow" }) {
  const isEmerald = accent === "emerald";

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50 font-sans">
      {/* Left Visual Brand Section */}
      <div
        className={`hidden lg:flex flex-col justify-between p-12 relative overflow-hidden ${
          isEmerald
            ? "bg-gradient-to-br from-emerald-800 via-teal-800 to-emerald-950 text-white"
            : "bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-950 text-white"
        }`}
      >
        {/* Brand Top Bar */}
        <div className="flex items-center justify-between relative z-10">
          <Link to="/" className="flex items-center gap-2.5 text-white group">
            <span
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shadow-md transition group-hover:scale-105 ${
                isEmerald ? "bg-emerald-500 text-white" : "bg-blue-500 text-white"
              }`}
            >
              {isEmerald ? "🛍️" : "🛒"}
            </span>
            <span className="font-black text-xl tracking-tight">{brandBadge}</span>
          </Link>

          <Badge
            variant="secondary"
            className="bg-white/15 text-white hover:bg-white/20 border-0 text-xs font-bold py-1 px-3"
          >
            {isEmerald ? "Customer Experience" : "Vendor Portal"}
          </Badge>
        </div>

        {/* Center Copy */}
        <div className="relative z-10 space-y-4 max-w-md my-auto">
          <Badge
            variant="secondary"
            className="bg-white/10 text-white hover:bg-white/20 border-white/20 text-[11px] font-bold py-1 px-3 gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Zero Platform Fees • Direct UPI</span>
          </Badge>

          <h2 className="text-4xl xl:text-5xl font-black tracking-tight leading-tight text-white">
            {isEmerald
              ? "Shop local, pay direct, collect hassle-free."
              : "Grow your local shop with modern commerce tools."}
          </h2>

          <p className="text-white/80 text-sm leading-relaxed">
            {isEmerald
              ? "Discover neighborhood stores, browse live catalog stocks, pay direct to merchant UPI, and collect with a counter pickup ID."
              : "Manage inventory, run walk-in POS, verify customer payments directly into your bank account with zero middleman commissions."}
          </p>
        </div>

        {/* Footer info */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
          <span>ShopFlow Multi-Vendor Platform</span>
          <span>Hyperlocal Commerce System</span>
        </div>

        {/* Subtle background decorative shapes */}
        <div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-white/5 pointer-events-none blur-3xl" />
        <div className="absolute -left-24 -top-24 w-96 h-96 rounded-full bg-white/5 pointer-events-none blur-3xl" />
      </div>

      {/* Right Form Container */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile Back & Brand */}
          <div className="flex items-center justify-between mb-6 lg:hidden">
            <Link
              to="/"
              className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back Home</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-lg">{isEmerald ? "🛍️" : "🛒"}</span>
              <span className="font-black text-slate-900 text-sm">ShopFlow</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                {subtitle}
              </p>
            </div>

            {children}
          </div>

          {/* Bottom Admin Link */}
          <div className="mt-6 text-center">
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition font-medium py-1 px-2.5 rounded-lg hover:bg-slate-200/50"
            >
              <span>🛡️ Admin Portal</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
