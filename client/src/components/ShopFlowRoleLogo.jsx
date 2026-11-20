import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Badge } from "./ui/badge";

/**
 * ShopFlowRoleLogo
 * Renders the brand logo with the signed-in role badge (Customer, Vendor, or Admin).
 * When clicked:
 * - If already on the role's home page (/customer/dashboard, /vendor/dashboard, /admin/dashboard), it reloads the page.
 * - If on any other page, it navigates directly to that role's home page.
 * - If isDirty is true (unsaved changes or task in progress), it prompts the user first to ask if they want to save or leave.
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
  const location = useLocation();

  const getEffectiveRole = () => {
    if (role) return role.toUpperCase();
    try {
      const adminToken = localStorage.getItem("adminToken");
      if (adminToken) return "ADMIN";
      const storedRole = localStorage.getItem("role");
      if (storedRole) return storedRole.toUpperCase();
    } catch {
      // ignore storage access errors
    }
    return "CUSTOMER";
  };

  const effectiveRole = getEffectiveRole();
  let targetPath = "/customer/dashboard";
  if (effectiveRole === "ADMIN") {
    targetPath = "/admin/dashboard";
  } else if (effectiveRole === "VENDOR") {
    targetPath = "/vendor/dashboard";
  }

  const isCurrentHomePage = location.pathname === targetPath;

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

    if (isCurrentHomePage) {
      if (location.search || location.hash) {
        window.location.href = targetPath;
      } else {
        window.location.reload();
      }
    } else {
      navigate(targetPath);
    }
  };

  const isDark = variant === "dark" || effectiveRole === "ADMIN";

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-2 group text-left cursor-pointer transition select-none hover:opacity-90 ${className}`}
      title={
        isCurrentHomePage
          ? `Reload ${effectiveRole.charAt(0) + effectiveRole.slice(1).toLowerCase()} Home Page`
          : `Go to ${effectiveRole.charAt(0) + effectiveRole.slice(1).toLowerCase()} Home Page`
      }
    >
      {effectiveRole === "ADMIN" ? (
        <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm font-black shadow-xs group-hover:scale-105 transition">
          🛡️
        </span>
      ) : effectiveRole === "VENDOR" ? (
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

      {effectiveRole === "ADMIN" ? (
        <Badge className="bg-indigo-600 text-white font-extrabold text-[10px] uppercase tracking-wider py-0.5 px-2 border-0">
          Admin
        </Badge>
      ) : effectiveRole === "VENDOR" ? (
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
