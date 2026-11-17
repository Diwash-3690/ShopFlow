import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import InputField from "../../components/InputField";
import PasswordInput from "../../components/PasswordInput";
import Button from "../../components/Button";
import {
  customerSendOtp,
  customerVerifyOtp,
  customerResetPassword,
} from "../../services/authService";

function CustomerForgotPassword() {
  const [step, setStep] = useState(1); // 1: Mobile, 2: OTP, 3: New Password
  const [formData, setFormData] = useState({
    mobile: "",
    code: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [devCode, setDevCode] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setErrorMsg("");
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(formData.mobile.trim())) {
      setErrorMsg("Please enter a valid 10-digit registered mobile number.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      const res = await customerSendOtp({
        mobile: formData.mobile.trim(),
        purpose: "PASSWORD_RESET",
      });

      setSuccessMsg("Password reset OTP sent to your mobile number.");
      if (res.devCode) {
        setDevCode(res.devCode);
      }
      setStep(2);
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || err.message || "Failed to send reset OTP."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!formData.code || formData.code.trim().length !== 6) {
      setErrorMsg("Please enter the 6-digit OTP code.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      await customerVerifyOtp({
        mobile: formData.mobile.trim(),
        code: formData.code.trim(),
        purpose: "PASSWORD_RESET",
      });

      setSuccessMsg("OTP verified! Please create your new password.");
      setStep(3);
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || err.message || "Invalid OTP code."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (formData.newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      await customerResetPassword({
        mobile: formData.mobile.trim(),
        newPassword: formData.newPassword,
      });

      alert("Password has been reset successfully. Please sign in.");
      navigate("/customer/login");
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || err.message || "Failed to reset password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Customer Password"
      subtitle="Verify your mobile number to set a new password"
      accent="emerald"
      brandBadge="🛍️ ShopFlow"
    >
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg">
          {successMsg}
        </div>
      )}

      {devCode && step === 2 && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center justify-between">
          <span>Dev Helper OTP: <strong>{devCode}</strong></span>
          <button
            type="button"
            onClick={() => setFormData((p) => ({ ...p, code: devCode }))}
            className="text-emerald-700 font-bold underline"
          >
            Auto-fill
          </button>
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <InputField
            label="Registered Mobile Number"
            name="mobile"
            type="tel"
            placeholder="10-digit mobile number"
            value={formData.mobile}
            onChange={handleChange}
          />
          <Button type="submit" loading={loading} variant="emerald">
            Send Reset OTP
          </Button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <InputField
            label="6-Digit OTP Code"
            name="code"
            type="text"
            placeholder="123456"
            value={formData.code}
            onChange={handleChange}
          />
          <Button type="submit" loading={loading} variant="emerald">
            Verify OTP
          </Button>
          <div className="flex justify-between items-center text-sm pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-gray-500 hover:text-gray-700 underline"
            >
              Change Mobile
            </button>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Resend OTP
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <PasswordInput
            label="New Password"
            name="newPassword"
            placeholder="At least 6 characters"
            value={formData.newPassword}
            onChange={handleChange}
          />
          <PasswordInput
            label="Confirm New Password"
            name="confirmPassword"
            placeholder="Re-enter new password"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
          <Button type="submit" loading={loading} variant="emerald">
            Update Password
          </Button>
        </form>
      )}

      <div className="mt-6 text-center text-sm text-gray-500">
        Remember your password?{" "}
        <Link to="/customer/login" className="text-emerald-600 font-semibold hover:underline">
          Back to Sign In
        </Link>
      </div>
    </AuthLayout>
  );
}

export default CustomerForgotPassword;
