import React from "react";

function Button({
  children,
  type = "button",
  onClick,
  loading = false,
  variant = "blue",
}) {
  const isEmerald = variant === "emerald";

  const bgClasses = loading
    ? isEmerald
      ? "bg-emerald-500/70 text-white cursor-not-allowed"
      : "bg-blue-500/70 text-white cursor-not-allowed"
    : isEmerald
    ? "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs"
    : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      className={`w-full h-11 px-4 rounded-xl font-bold text-xs transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${bgClasses}`}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Please wait...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

export default Button;
