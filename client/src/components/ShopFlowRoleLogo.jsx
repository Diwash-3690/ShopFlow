import React from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "./ui/badge";

/**
 * ShopFlowRoleLogo
 * Renders the brand logo with the signed-in role badge (Customer, Vendor, or Admin).
 * When clicked, navigates to the landing page of that role (/customer/dashboard, /vendor/dashboard, /admin/dashboard).
 * If isDirty is true (unsaved changes or task in progress), it prompts the user first to ask if they want to save or leave.
 */
function ShopFlowRoleLogo({
  role = "CUSTOMER",
  isDirty = false,
  customWarningMessage = "",
  onNavigate,
  className = "",
  variant = "light",
}) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.preventDefault();

    if (isDirty) {
      const message =
        customWarningMessage ||
        "You have an active task or unsaved changes in progress. Do you want to leave without saving? Click Cancel to stay and save your changes.";
      const confirmLeave = window.confirm(message);
      if (!confirmLeave) {
        return; // Abort navigation to let user save
      }
    }

    if (onNavigate) {
      onNavigate();
    }

    if (role === "ADMIN") {
      navigate("/admin/dashboard");
    } else if (role === "VENDOR") {
      navigate("/vendor/dashboard");
    } else {
      navigate("/customer/dashboard");
    }
  };

  const isDark = variant === "dark" || role === "ADMIN";

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-2 group text-left cursor-pointer transition select-none hover:opacity-90 ${className}`}
      title={`Go to ${role.charAt(0) + role.slice(1).toLowerCase()} Dashboard`}
    >
      {role === "ADMIN" ? (
        <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm font-black shadow-xs group-hover:scale-105 transition">
          🛡️
        </span>
      ) : role === "VENDOR" ? (
        <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm font-black shadow-xs group-hover:scale-105 transition">
          🛒
        </span>
      ) : (
        <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-sm font-black shadow-xs group-hover:scale-105 transition">
          🛍️
        </span>
      )}

      <span
        className={`font-black text-lg sm:text-xl tracking-tight ${
          isDark ? "text-white" : "text-slate-900"
        }`}
      >
        ShopFlow
      </span>

      {role === "ADMIN" ? (
        <Badge className="bg-indigo-600 text-white font-extrabold text-[10px] uppercase tracking-wider py-0.5 px-2 border-0">
          Admin
        </Badge>
      ) : role === "VENDOR" ? (
        <Badge
          variant="secondary"
          className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 bg-blue-50 text-blue-700 border-blue-200"
        >
          Vendor
        </Badge>
      ) : (
        <Badge
          variant="success"
          className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 bg-emerald-50 text-emerald-800 border-emerald-200"
        >
          Customer
        </Badge>
      )}
    </button>
  );
}

export default ShopFlowRoleLogo;
