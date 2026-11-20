import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Store,
  ShieldCheck,
  ArrowRight,
  QrCode,
  MapPin,
  Receipt,
  LayoutDashboard,
  Sparkles,
  Zap,
  Lock,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import ShopFlowRoleLogo from "../components/ShopFlowRoleLogo";

function Home() {
  const navigate = useNavigate();
  const [authenticatedRole, setAuthenticatedRole] = useState(null);

  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (adminToken) {
      setAuthenticatedRole("ADMIN");
      navigate("/admin/dashboard", { replace: true });
    } else if (token && role === "VENDOR") {
      setAuthenticatedRole("VENDOR");
      navigate("/vendor/dashboard", { replace: true });
    } else if (token && role === "CUSTOMER") {
      setAuthenticatedRole("CUSTOMER");
      navigate("/customer/dashboard", { replace: true });
    }
  }, [navigate]);

  const dashboardPath =
    authenticatedRole === "ADMIN"
      ? "/admin/dashboard"
      : authenticatedRole === "VENDOR"
      ? "/vendor/dashboard"
      : "/customer/dashboard";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans relative overflow-hidden">
      {/* Background Subtle Grid Texture */}
      <div className="absolute inset-0 bg-grid-subtle pointer-events-none opacity-40 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

      {/* Header Navbar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center space-x-2.5">
          {authenticatedRole ? (
            <ShopFlowRoleLogo role={authenticatedRole} />
          ) : (
            <Link
              to="/"
              onClick={(e) => {
                if (window.location.pathname === "/") {
                  e.preventDefault();
                  window.location.reload();
                }
              }}
              className="flex items-center space-x-2.5 group"
              title="ShopFlow Home"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                🛒
              </div>
              <div>
                <span className="text-xl font-black text-slate-900 tracking-tight">ShopFlow</span>
                <span className="hidden sm:inline-block ml-2 text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                  COMMERCE 2.0
                </span>
              </div>
            </Link>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {authenticatedRole ? (
            <Link to={dashboardPath}>
              <Button size="sm" className="font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm gap-1.5 rounded-xl">
                <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/customer/login">
                <Button variant="ghost" size="sm" className="font-semibold text-slate-700 hover:bg-slate-100 rounded-xl">
                  Customer Sign In
                </Button>
              </Link>
              <Link to="/vendor/login">
                <Button size="sm" className="font-bold bg-slate-900 hover:bg-blue-600 text-white shadow-sm rounded-xl">
                  Vendor Portal
                </Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex-1 flex flex-col justify-center items-center text-center space-y-10 relative z-10">
        {/* Aceternity Style Ambient Pill */}
        <div className="inline-flex items-center gap-2 bg-white/90 border border-slate-200/90 text-slate-800 text-xs font-bold px-4 py-2 rounded-full shadow-2xs backdrop-blur-md hover:border-slate-300 transition-colors">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-600 font-medium">Hyperlocal Commerce:</span>
          <span className="text-slate-900 font-bold">Zero-Commission Local Retail & Direct UPI</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </div>

        {/* Hero Title & Subtitle */}
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.08]">
            Empower Local Retail. <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 bg-clip-text text-transparent">
              Connect Nearby Shoppers.
            </span>
          </h1>
          <p className="text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            ShopFlow connects neighbourhood retail shops directly with nearby customers for fast counter pickup, digital bills, and zero-fee direct merchant UPI payments.
          </p>
        </div>

        {/* Studio Bento Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl text-left pt-2">
          {/* Feature 1 */}
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <MapPin className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Hyperlocal 2km Discovery</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Strict 2 km GPS boundary ensures only reachable neighborhood stores are shown for counter pickup.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Real-Time Proximity</span>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <QrCode className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Direct Vendor UPI</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                0% payment gateway deductions. Funds transfer directly to the merchant's UPI VPA.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-purple-700">
              <Zap className="w-3.5 h-3.5" />
              <span>Zero Intermediary Cut</span>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Lock className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Cryptographic Pickup ID</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Private Pickup Code is unlocked exclusively when the merchant verifies payment receipt.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-blue-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero Fraud Risk</span>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Receipt className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Walk-In Cloud POS</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Vendors record in-person counter ticket sales with instant printable thermal receipts.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-amber-700">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Counter Speed</span>
            </div>
          </div>
        </div>

        {/* Two-Sided Portal Cards */}
        <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl pt-4 text-left">
          {/* Customer Side */}
          <Card className="hover:shadow-xl transition-all duration-300 border-slate-200/90 rounded-3xl flex flex-col justify-between bg-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
            <CardHeader className="space-y-3 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center font-black">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <CardTitle className="text-2xl font-black text-slate-900">For Buyers & Shoppers</CardTitle>
              <CardDescription className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Discover nearby verified stores within 2 km, inspect live stock, order ahead, pay with your UPI app, and pick up ready counter orders with your private code.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 relative z-10">
              <Link to="/customer/login" className="w-full sm:w-auto">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 rounded-xl h-10 px-5 shadow-sm">
                  Customer Sign In <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/customer/register" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full font-bold text-slate-700 rounded-xl h-10 px-5 border-slate-200">
                  Register as Buyer
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Vendor Side */}
          <Card className="hover:shadow-xl transition-all duration-300 border-slate-200/90 rounded-3xl flex flex-col justify-between bg-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
            <CardHeader className="space-y-3 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center font-black">
                <Store className="w-6 h-6" />
              </div>
              <CardTitle className="text-2xl font-black text-slate-900">For Store Owners</CardTitle>
              <CardDescription className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Digitize your retail store in minutes. Manage categories, track real-time inventory, generate rapid walk-in bills with thermal receipts, and receive zero-fee UPI orders.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 relative z-10">
              <Link to="/vendor/login" className="w-full sm:w-auto">
                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold gap-2 rounded-xl h-10 px-5 shadow-sm">
                  Vendor Sign In <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/vendor/register" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full font-bold text-slate-700 rounded-xl h-10 px-5 border-slate-200">
                  Register Shop
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 py-6 px-6 bg-white/90 backdrop-blur-md relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} ShopFlow. Built for modern local commerce and neighborhood merchants.</span>
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-bold transition px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 shadow-2xs"
          >
            <span>🛡️ Admin Portal</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}

export default Home;
