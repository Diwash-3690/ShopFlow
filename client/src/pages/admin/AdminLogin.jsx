import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, KeyRound, User, ArrowLeft } from "lucide-react";
import { adminLogin } from "../../services/adminService";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim() || !password) {
      setError("Please enter your administrator username/email and password");
      return;
    }

    setLoading(true);
    try {
      const res = await adminLogin(identifier.trim(), password);
      if (res.success) {
        navigate("/admin/dashboard");
      } else {
        setError(res.message || "Invalid credentials");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Authentication failed. Please verify your admin credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 relative overflow-hidden font-sans">
      {/* Decorative gradient glow */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10 text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 mx-auto">
          <Shield className="w-7 h-7" />
        </div>
        <h2 className="text-3xl font-black tracking-tight text-white">
          ShopFlow Admin Portal
        </h2>
        <p className="text-xs text-slate-400">
          Platform Governance & Incident Management Console
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <Card className="bg-slate-900/90 border-slate-800 backdrop-blur-xl shadow-2xl rounded-3xl p-6 sm:p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-semibold">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="identifier"
                className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Admin Identifier
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <Input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Username or email address"
                  className="pl-10 bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus-visible:ring-indigo-500 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Security Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="pl-10 bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus-visible:ring-indigo-500 rounded-xl"
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30"
              >
                {loading ? "Authenticating Authority..." : "Access Control Center"}
              </Button>
            </div>
          </form>
        </Card>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/")}
            className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to ShopFlow
          </button>
        </div>
      </div>
    </div>
  );
}
