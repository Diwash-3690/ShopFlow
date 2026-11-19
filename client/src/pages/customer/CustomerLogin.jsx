import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import InputField from "../../components/InputField";
import PasswordInput from "../../components/PasswordInput";
import Button from "../../components/Button";
import {
  customerLogin,
  customerSendMobileVerifyOtp,
  customerVerifyMobileVerifyOtp,
} from "../../services/authService";

function CustomerLogin() {
  const [formData, setFormData] = useState({
    mobile: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [unverifiedMobile, setUnverifiedMobile] = useState("");
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [mobileOtpCode, setMobileOtpCode] = useState("");
  const [mobileOtpDevCode, setMobileOtpDevCode] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setErrorMsg("");
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSendMobileOtp = async () => {
    try {
      setVerifyingOtp(true);
      setErrorMsg("");
      const res = await customerSendMobileVerifyOtp({ mobile: unverifiedMobile });
      setMobileOtpSent(true);
      setMobileOtpDevCode(res.devCode || "");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to send verification code.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleVerifyMobileOtp = async () => {
    if (!mobileOtpCode.trim()) {
      setErrorMsg("Please enter the 6-digit verification code.");
      return;
    }
    try {
      setVerifyingOtp(true);
      setErrorMsg("");
      const response = await customerVerifyMobileVerifyOtp({
        mobile: unverifiedMobile,
        code: mobileOtpCode.trim(),
      });
      localStorage.setItem("token", response.token);
      localStorage.setItem("role", "CUSTOMER");
      localStorage.setItem("user", JSON.stringify(response.customer));
      navigate("/customer/dashboard");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to verify mobile number.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.mobile?.trim() || !formData.password) {
      setErrorMsg("Please enter your mobile number or verified email, and password.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      setUnverifiedMobile("");

      const response = await customerLogin({
        mobile: formData.mobile.trim(),
        identifier: formData.mobile.trim(),
        password: formData.password,
      });

      localStorage.setItem("token", response.token);
      localStorage.setItem("role", "CUSTOMER");
      localStorage.setItem("user", JSON.stringify(response.customer));

      navigate("/customer/dashboard");
    } catch (err) {
      if (err.response?.data?.requiresMobileVerification) {
        setUnverifiedMobile(err.response.data.mobile || formData.mobile.trim());
      }
      setErrorMsg(
        err.response?.data?.message ||
        err.message ||
        "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Customer Sign In"
      subtitle="Sign in to browse shops and track your orders"
      accent="emerald"
      brandBadge="🛍️ ShopFlow"
    >
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {errorMsg}
        </div>
      )}

      {unverifiedMobile && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900">
              Verify Phone Number: <span className="font-mono">{unverifiedMobile}</span>
            </span>
            {mobileOtpDevCode && (
              <span className="text-[10px] font-mono font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
                Dev OTP: {mobileOtpDevCode}
              </span>
            )}
          </div>
          {!mobileOtpSent ? (
            <Button
              type="button"
              onClick={handleSendMobileOtp}
              disabled={verifyingOtp}
              variant="outline"
              className="w-full text-xs font-bold h-9 border-amber-300 text-amber-900 hover:bg-amber-100"
            >
              {verifyingOtp ? "Sending Code..." : "Send Verification OTP"}
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={mobileOtpCode}
                  onChange={(e) => setMobileOtpCode(e.target.value)}
                  className="w-full px-3 py-1.5 border border-amber-300 rounded-xl text-xs bg-white font-mono tracking-widest text-center"
                />
                <Button
                  type="button"
                  onClick={handleVerifyMobileOtp}
                  disabled={verifyingOtp || !mobileOtpCode.trim()}
                  variant="emerald"
                  className="h-9 text-xs font-bold px-4 shrink-0"
                >
                  {verifyingOtp ? "Verifying..." : "Verify & Sign In"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="Mobile Number or Verified Email"
          name="mobile"
          type="text"
          placeholder="10-digit mobile or verified email"
          value={formData.mobile}
          onChange={handleChange}
        />

        <PasswordInput
          label="Password"
          name="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
        />

        <div className="flex justify-end">
          <Link
            to="/customer/forgot-password"
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={loading} variant="emerald">
          Sign In
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        New to ShopFlow?{" "}
        <Link
          to="/customer/register"
          className="text-emerald-600 font-semibold hover:underline"
        >
          Create customer account
        </Link>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
        <span>
          Are you a shop owner?{" "}
          <Link to="/vendor/login" className="text-blue-600 font-medium hover:underline">
            Go to Vendor Portal
          </Link>
        </span>
        <Link
          to="/admin/login"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1 rounded-lg transition"
        >
          <span>🛡️ Admin</span>
        </Link>
      </div>
    </AuthLayout>
  );
}

export default CustomerLogin;
