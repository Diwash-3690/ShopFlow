import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import InputField from "../../components/InputField";
import PasswordInput from "../../components/PasswordInput";
import Button from "../../components/Button";
import {
  vendorSendOtp,
  vendorVerifyOtp,
  vendorRegister,
} from "../../services/authService";

function VendorRegister() {
  const [step, setStep] = useState(1); // 1: Info, 2: OTP, 3: Password
  const [formData, setFormData] = useState({
    ownerName: "",
    mobile: "",
    email: "",
    code: "",
    password: "",
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

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!formData.ownerName.trim()) {
      setErrorMsg("Please enter your name.");
      return;
    }
    if (!/^\d{10}$/.test(formData.mobile.trim())) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      const res = await vendorSendOtp({
        mobile: formData.mobile.trim(),
        email: formData.email?.trim() || undefined,
        purpose: "VENDOR_REGISTER",
      });

      setSuccessMsg("Verification OTP sent to your mobile number.");
      if (res.devCode) {
        setDevCode(res.devCode);
      }
      setStep(2);
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || err.message || "Failed to send OTP."
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!formData.code || formData.code.trim().length !== 6) {
      setErrorMsg("Please enter the 6-digit OTP received.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      await vendorVerifyOtp({
        mobile: formData.mobile.trim(),
        code: formData.code.trim(),
        purpose: "VENDOR_REGISTER",
      });

      setSuccessMsg("Mobile verified successfully! Please set your password.");
      setStep(3);
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || err.message || "Invalid OTP code."
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Complete Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      const res = await vendorRegister({
        ownerName: formData.ownerName.trim(),
        mobile: formData.mobile.trim(),
        password: formData.password,
        email: formData.email.trim() || undefined,
      });

      localStorage.setItem("token", res.token);
      localStorage.setItem("role", "VENDOR");
      localStorage.setItem("user", JSON.stringify(res.vendor));

      navigate("/vendor/dashboard");
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || err.message || "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Register as Vendor"
      subtitle={
        step === 1
          ? "Step 1 of 3: Enter your details"
          : step === 2
          ? "Step 2 of 3: Verify your mobile"
          : "Step 3 of 3: Set your password"
      }
    >
      {/* Progress Indicators */}
      <div className="flex items-center justify-between mb-6">
        <div
          className={`flex-1 h-1.5 rounded-full ${
            step >= 1 ? "bg-blue-600" : "bg-gray-200"
          } mr-2`}
        />
        <div
          className={`flex-1 h-1.5 rounded-full ${
            step >= 2 ? "bg-blue-600" : "bg-gray-200"
          } mr-2`}
        />
        <div
          className={`flex-1 h-1.5 rounded-full ${
            step >= 3 ? "bg-blue-600" : "bg-gray-200"
          }`}
        />
      </div>

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
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-lg flex items-center justify-between">
          <span>Dev Helper OTP: <strong>{devCode}</strong></span>
          <button
            type="button"
            onClick={() => setFormData((p) => ({ ...p, code: devCode }))}
            className="text-blue-600 font-bold underline"
          >
            Auto-fill
          </button>
        </div>
      )}

      {/* Step 1: Owner Details */}
      {step === 1 && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <InputField
            label="Shop Owner Full Name"
            name="ownerName"
            placeholder="e.g. Ramesh Kumar"
            value={formData.ownerName}
            onChange={handleChange}
          />

          <InputField
            label="Mobile Number (will be verified via OTP)"
            name="mobile"
            type="tel"
            placeholder="10-digit mobile number"
            value={formData.mobile}
            onChange={handleChange}
          />

          <InputField
            label="Email Address (Optional)"
            name="email"
            type="email"
            placeholder="owner@example.com"
            value={formData.email}
            onChange={handleChange}
          />

          <Button type="submit" loading={loading}>
            Send Verification OTP
          </Button>
        </form>
      )}

      {/* Step 2: OTP Code */}
      {step === 2 && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <p className="text-sm text-gray-600">
            Enter the 6-digit code sent to <strong>{formData.mobile}</strong>.
          </p>

          <InputField
            label="6-Digit OTP Code"
            name="code"
            type="text"
            placeholder="123456"
            value={formData.code}
            onChange={handleChange}
          />

          <Button type="submit" loading={loading}>
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
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Resend OTP
            </button>
          </div>
        </form>
      )}

      {/* Step 3: Password */}
      {step === 3 && (
        <form onSubmit={handleRegister} className="space-y-4">
          <PasswordInput
            label="Create Password"
            name="password"
            placeholder="At least 6 characters"
            value={formData.password}
            onChange={handleChange}
          />

          <PasswordInput
            label="Confirm Password"
            name="confirmPassword"
            placeholder="Re-enter password"
            value={formData.confirmPassword}
            onChange={handleChange}
          />

          <Button type="submit" loading={loading}>
            Complete Vendor Registration
          </Button>
        </form>
      )}

      <div className="mt-6 text-center text-sm text-gray-500">
        Already have a vendor account?{" "}
        <Link to="/vendor/login" className="text-blue-600 font-semibold hover:underline">
          Sign In
        </Link>
      </div>
    </AuthLayout>
  );
}

export default VendorRegister;
