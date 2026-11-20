import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
  TrendingUp,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import ShopFlowRoleLogo from "../components/ShopFlowRoleLogo";

// Framer motion variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

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
      {/* Background Subtle Grid & Aceternity Light Spot */}
      <div className="absolute inset-0 bg-grid-subtle pointer-events-none opacity-40 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-blue-400/10 via-indigo-400/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header Navbar */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-panel px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-2xs"
      >
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
              className="flex items-center space-x-2.5 group cursor-pointer"
              title="ShopFlow Home"
            >
              <motion.div
                whileHover={{ scale: 1.08, rotate: -3 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-500/25"
              >
                🛒
              </motion.div>
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
              <Button size="sm" className="font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm gap-1.5 rounded-xl active:scale-[0.98]">
                <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/customer/login">
                <Button variant="ghost" size="sm" className="font-semibold text-slate-700 hover:bg-slate-100 rounded-xl active:scale-[0.98]">
                  Customer Sign In
                </Button>
              </Link>
              <Link to="/vendor/login">
                <Button size="sm" className="font-bold bg-slate-900 hover:bg-blue-600 text-white shadow-sm rounded-xl active:scale-[0.98]">
                  Vendor Portal
                </Button>
              </Link>
            </>
          )}
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex-1 flex flex-col justify-center items-center text-center space-y-10 relative z-10"
      >
        {/* Aceternity Style Ambient Pill */}
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.03 }}
          className="inline-flex items-center gap-2 bg-white/95 border border-slate-200/90 text-slate-800 text-xs font-bold px-4 py-2 rounded-full shadow-2xs backdrop-blur-md cursor-pointer"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-slate-500 font-medium">Hyperlocal Commerce:</span>
          <span className="text-slate-900 font-bold">Zero-Commission Local Retail & Direct UPI</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </motion.div>

        {/* Hero Title & Subtitle */}
        <motion.div variants={itemVariants} className="space-y-4 max-w-3xl">
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.08]">
            Empower Local Retail. <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 bg-clip-text text-transparent">
              Connect Nearby Shoppers.
            </span>
          </h1>
          <p className="text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            ShopFlow connects neighbourhood retail shops directly with nearby customers for fast counter pickup, digital bills, and zero-fee direct merchant UPI payments.
          </p>
        </motion.div>

        {/* Live Ambient Ticker */}
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-semibold text-slate-600 pt-1"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 rounded-full border border-slate-200/70 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Strict 2 km Boundary</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 rounded-full border border-slate-200/70 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>0% Gateway Fees</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 rounded-full border border-slate-200/70 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Cryptographic Pickup ID</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 rounded-full border border-slate-200/70 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Rapid Cloud POS</span>
          </span>
        </motion.div>

        {/* Studio Bento Feature Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl text-left pt-2">
          {/* Feature 1: Hyperlocal Discovery */}
          <motion.div
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="bento-card p-5 flex flex-col justify-between group"
          >
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
          </motion.div>

          {/* Feature 2: Direct UPI */}
          <motion.div
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="bento-card p-5 flex flex-col justify-between group"
          >
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
          </motion.div>

          {/* Feature 3: Pickup PIN */}
          <motion.div
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="bento-card p-5 flex flex-col justify-between group"
          >
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
          </motion.div>

          {/* Feature 4: Cloud POS */}
          <motion.div
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="bento-card p-5 flex flex-col justify-between group"
          >
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
          </motion.div>
        </motion.div>

        {/* Two-Sided Portal Cards */}
        <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-6 w-full max-w-4xl pt-4 text-left">
          {/* Customer Side */}
          <motion.div whileHover={{ y: -6, transition: { duration: 0.25 } }}>
            <Card className="rounded-3xl border-slate-200/90 flex flex-col justify-between bg-white relative overflow-hidden shadow-2xs hover:shadow-xl transition-shadow">
              <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
              <CardHeader className="space-y-3 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center font-black">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">For Buyers & Shoppers</CardTitle>
                <CardDescription className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Discover nearby verified stores within 2 km, inspect live stock, order ahead, pay with your UPI app, and pick up ready counter orders with your private code.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 relative z-10">
                <Link to="/customer/login" className="w-full sm:w-auto">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 rounded-xl h-10 px-5 shadow-sm active:scale-[0.98]">
                    Customer Sign In <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/customer/register" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full font-bold text-slate-700 rounded-xl h-10 px-5 border-slate-200 active:scale-[0.98]">
                    Register as Buyer
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Vendor Side */}
          <motion.div whileHover={{ y: -6, transition: { duration: 0.25 } }}>
            <Card className="rounded-3xl border-slate-200/90 flex flex-col justify-between bg-white relative overflow-hidden shadow-2xs hover:shadow-xl transition-shadow">
              <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
              <CardHeader className="space-y-3 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center font-black">
                  <Store className="w-6 h-6" />
                </div>
                <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">For Store Owners</CardTitle>
                <CardDescription className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Digitize your retail store in minutes. Manage categories, track real-time inventory, generate rapid walk-in bills with thermal receipts, and receive zero-fee UPI orders.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 relative z-10">
                <Link to="/vendor/login" className="w-full sm:w-auto">
                  <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold gap-2 rounded-xl h-10 px-5 shadow-sm active:scale-[0.98]">
                    Vendor Sign In <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/vendor/register" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full font-bold text-slate-700 rounded-xl h-10 px-5 border-slate-200 active:scale-[0.98]">
                    Register Shop
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
      </motion.main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 py-6 px-6 bg-white/90 backdrop-blur-md relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} ShopFlow. Built for modern local commerce and neighborhood merchants.</span>
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-bold transition px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 shadow-2xs active:scale-[0.98]"
          >
            <span>🛡️ Admin Portal</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}

export default Home;
