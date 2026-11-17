import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import InputField from "../../components/InputField";
import PasswordInput from "../../components/PasswordInput";
import Button from "../../components/Button";
import { customerLogin } from "../../services/authService";

function CustomerLogin() {
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
    if (!formData.mobile || !formData.password) {
      setErrorMsg("Please enter both mobile number and password.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      const response = await customerLogin(formData);

      localStorage.setItem("token", response.token);
      localStorage.setItem("role", "CUSTOMER");
      localStorage.setItem("user", JSON.stringify(response.customer));

      navigate("/customer/dashboard");
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="Mobile Number"
          name="mobile"
          type="tel"
          placeholder="10-digit mobile number"
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

      <div className="mt-4 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
        Are you a shop owner?{" "}
        <Link to="/vendor/login" className="text-blue-600 font-medium hover:underline">
          Go to Vendor Portal
        </Link>
      </div>
    </AuthLayout>
  );
}

export default CustomerLogin;
