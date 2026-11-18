import { Link } from "react-router-dom";
import { FiShoppingBag, FiBriefcase, FiShield, FiArrowRight } from "react-icons/fi";

function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-3xl">🛒</span>
          <span className="text-2xl font-black text-slate-900 tracking-tight">ShopFlow</span>
        </div>
        <div className="flex items-center space-x-4 text-sm font-medium">
          <Link to="/customer/login" className="text-slate-600 hover:text-blue-600 transition">
            Customer Sign In
          </Link>
          <Link
            to="/vendor/login"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Vendor Portal
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-16 flex-1 flex flex-col justify-center items-center text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <FiShield size={16} /> Multi-Vendor Local Shopping & Digital Invoicing
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight max-w-3xl leading-tight">
          Connect Local Shops With Nearby Customers.
        </h1>
        <p className="mt-4 text-lg md:text-xl text-slate-600 max-w-2xl">
          ShopFlow empowers local shop owners with smart inventory, billing, and verified UPI pickup orders — while customers discover nearby stores and shop with ease.
        </p>

        {/* Two-Sided Portal Cards */}
        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl mt-12 text-left">
          {/* Customer Side */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6">
                <FiShoppingBag size={24} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">For Customers</h3>
              <p className="mt-2 text-slate-600 leading-relaxed">
                Discover neighborhood stores, explore product catalogs, place orders, pay seamlessly via UPI, and collect with a secure pickup ID.
              </p>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/customer/login"
                className="flex items-center justify-center gap-2 bg-emerald-600 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-emerald-700 transition text-sm"
              >
                Customer Sign In <FiArrowRight />
              </Link>
              <Link
                to="/customer/register"
                className="flex items-center justify-center border border-slate-300 text-slate-700 font-medium px-5 py-2.5 rounded-lg hover:bg-slate-100 transition text-sm"
              >
                Register as Customer
              </Link>
            </div>
          </div>

          {/* Vendor Side */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6">
                <FiBriefcase size={24} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">For Shop Owners</h3>
              <p className="mt-2 text-slate-600 leading-relaxed">
                Digitize your inventory, manage categories and prices, create walk-in bills with instant PDF receipts, and receive incoming verified online orders.
              </p>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/vendor/login"
                className="flex items-center justify-center gap-2 bg-blue-600 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-blue-700 transition text-sm"
              >
                Vendor Sign In <FiArrowRight />
              </Link>
              <Link
                to="/vendor/register"
                className="flex items-center justify-center border border-slate-300 text-slate-700 font-medium px-5 py-2.5 rounded-lg hover:bg-slate-100 transition text-sm"
              >
                Register Your Shop
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500 bg-white">
        © {new Date().getFullYear()} ShopFlow. Built for local retail businesses and smart commerce.
      </footer>
    </div>
  );
}

export default Home;
