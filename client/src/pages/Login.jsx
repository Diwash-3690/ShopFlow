import { Link } from "react-router-dom";
import { useState } from "react";

import AuthLayout from "../components/AuthLayout";
import InputField from "../components/InputField";
import PasswordInput from "../components/PasswordInput";
import Button from "../components/Button";
import { loginOwner } from "../services/authService";
import { useNavigate } from "react-router-dom";

function Login() {
  const [formData, setFormData] = useState({
    mobile: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    setLoading(true);

    const response = await loginOwner(formData);

    // Save token
    localStorage.setItem("token", response.token);

    // Save owner details
    localStorage.setItem(
      "owner",
      JSON.stringify(response.owner)
    );

    alert(response.message);

    navigate("/dashboard");

  } catch (error) {

    alert(
      error.response?.data?.message ||
      "Login failed"
    );

  } finally {

    setLoading(false);

  }
};

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your ShopFlow account"
    >
      <form onSubmit={handleSubmit}>

        <InputField
          label="Mobile Number"
          name="mobile"
          placeholder="Enter mobile number"
          value={formData.mobile}
          onChange={handleChange}
        />

        <PasswordInput
          label="Password"
          name="password"
          placeholder="Enter password"
          value={formData.password}
          onChange={handleChange}
        />

        <Button
          type="submit"
          loading={loading}
        >
          Login
        </Button>

        <p className="text-center mt-6 text-gray-600">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-blue-600 font-semibold hover:underline"
          >
            Create Account
          </Link>
        </p>

      </form>
    </AuthLayout>
  );
}

export default Login;