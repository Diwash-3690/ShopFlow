function AuthLayout({ title, subtitle, children, accent = "blue", brandBadge = "🛒 ShopFlow" }) {
  const isEmerald = accent === "emerald";

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Section */}
      <div
        className={`hidden lg:flex flex-col justify-center items-center ${
          isEmerald ? "bg-emerald-600" : "bg-blue-600"
        } text-white p-12`}
      >
        <h1 className="text-5xl font-black mb-4 tracking-tight">
          {brandBadge}
        </h1>

        <p className="text-xl text-center max-w-md font-medium text-white/90">
          {isEmerald
            ? "Discover local shops, browse fresh products, and pick up hassle-free."
            : "Smart shop management, inventory, and instant verified billing."}
        </p>

        <div className="mt-8 flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider bg-white/10 px-4 py-2 rounded-full">
          <span>{isEmerald ? "Customer Platform" : "Vendor Portal"}</span>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-3xl font-extrabold text-slate-900 text-center mb-2 tracking-tight">
            {title}
          </h2>

          <p className="text-center text-slate-500 mb-8 text-sm">
            {subtitle}
          </p>

          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
