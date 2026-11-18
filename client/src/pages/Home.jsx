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
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/card";

function Home() {
  const navigate = useNavigate();
  const [authenticatedRole, setAuthenticatedRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (token && role === "VENDOR") {
      setAuthenticatedRole("VENDOR");
      navigate("/vendor/dashboard", { replace: true });
    } else if (token && role === "CUSTOMER") {
      setAuthenticatedRole("CUSTOMER");
      navigate("/customer/dashboard", { replace: true });
    }
  }, [navigate]);

  const dashboardPath =
    authenticatedRole === "VENDOR" ? "/vendor/dashboard" : "/customer/dashboard";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      {/* Header Navbar */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-2.5">
          <Link
            to={authenticatedRole ? dashboardPath : "/"}
            className="flex items-center space-x-2.5"
          >
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-500/20">
              🛒
            </div>
            <div>
              <span className="text-xl font-black text-slate-900 tracking-tight">ShopFlow</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                COMMERCE 2.0
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center space-x-3">
          {authenticatedRole ? (
            <Link to={dashboardPath}>
              <Button size="sm" className="font-bold bg-blue-600 hover:bg-blue-700 shadow-sm gap-1.5">
                <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/customer/login">
                <Button variant="ghost" size="sm" className="font-semibold text-slate-700">
                  Customer Sign In
                </Button>
              </Link>
              <Link to="/vendor/login">
                <Button size="sm" className="font-bold bg-blue-600 hover:bg-blue-700 shadow-sm">
                  Vendor Portal
                </Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-14 sm:py-20 flex-1 flex flex-col justify-center items-center text-center space-y-8">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-3.5 py-1.5 rounded-full shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Zero-Commission Local Retail & Direct UPI Invoicing</span>
        </div>

        <div className="space-y-4 max-w-3xl">
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
            Empower Local Retail. <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Connect Nearby Shoppers.
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            ShopFlow connects neighbourhood retail shops directly with nearby customers for fast counter pickup, digital bills, and zero-fee UPI payments.
          </p>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-slate-600 pt-2">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Storefront Geolocation</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
            <QrCode className="w-3.5 h-3.5 text-purple-600" />
            <span>Direct Vendor UPI</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
            <Receipt className="w-3.5 h-3.5 text-blue-600" />
            <span>Instant Digital Receipts</span>
          </div>
        </div>

        {/* Two-Sided Portal Cards */}
        <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl pt-6 text-left">
          {/* Customer Side */}
          <Card className="hover:shadow-lg transition-all border-slate-200/90 rounded-3xl flex flex-col justify-between">
            <CardHeader className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <CardTitle className="text-2xl font-black text-slate-900">For Buyers & Shoppers</CardTitle>
              <CardDescription className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Browse nearby retail stores, check live product inventory and pricing, place pickup orders, pay securely via UPI, and collect with a private Pickup Code.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
              <Link to="/customer/login" className="w-full sm:w-auto">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2">
                  Customer Sign In <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/customer/register" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full font-semibold">
                  Register as Buyer
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Vendor Side */}
          <Card className="hover:shadow-lg transition-all border-slate-200/90 rounded-3xl flex flex-col justify-between">
            <CardHeader className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                <Store className="w-6 h-6" />
              </div>
              <CardTitle className="text-2xl font-black text-slate-900">For Store Owners</CardTitle>
              <CardDescription className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Digitize your shop in minutes. Manage categories, track stock, create rapid counter walk-in bills with PDF receipts, and receive verified customer orders.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
              <Link to="/vendor/login" className="w-full sm:w-auto">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2">
                  Vendor Sign In <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/vendor/register" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full font-semibold">
                  Register Shop
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 py-6 px-6 bg-white">
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
