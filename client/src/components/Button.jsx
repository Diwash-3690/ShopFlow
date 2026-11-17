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
      ? "bg-emerald-400 cursor-not-allowed"
      : "bg-blue-400 cursor-not-allowed"
    : isEmerald
    ? "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800"
    : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      className={`w-full py-3 rounded-lg font-semibold transition duration-200 shadow-sm ${bgClasses} text-white cursor-pointer`}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}

export default Button;
