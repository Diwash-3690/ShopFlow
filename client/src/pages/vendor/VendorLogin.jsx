import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import InputField from "../../components/InputField";
import PasswordInput from "../../components/PasswordInput";
import Button from "../../components/Button";
import { vendorLogin } from "../../services/authService";

function VendorLogin() {
  const [formData, setFormData] = useState({
    mobile: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setErrorMsg("");
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
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

      const response = await vendorLogin({
        mobile: formData.mobile.trim(),
        identifier: formData.mobile.trim(),
        password: formData.password,
      });

      localStorage.setItem("token", response.token);
      localStorage.setItem("role", "VENDOR");
      localStorage.setItem("user", JSON.stringify(response.vendor));
      if (response.shop) {
        localStorage.setItem("shop", JSON.stringify(response.shop));
      } else {
        localStorage.removeItem("shop");
      }

      navigate("/vendor/dashboard");
    } catch (err) {
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
      title="Vendor Sign In"
      subtitle="Access your shop dashboard and orders"
    >
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {errorMsg}
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
            to="/vendor/forgot-password"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={loading}>
          Sign In as Vendor
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        Don't have a vendor account?{" "}
        <Link
          to="/vendor/register"
          className="text-blue-600 font-semibold hover:underline"
        >
          Register your shop
        </Link>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
        Are you a customer?{" "}
        <Link to="/customer/login" className="text-emerald-600 font-medium hover:underline">
          Customer Sign In
        </Link>
      </div>
    </AuthLayout>
  );
}

export default VendorLogin;
