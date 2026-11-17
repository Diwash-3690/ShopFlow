import { Link } from "react-router-dom";
import { useState } from "react";

import AuthLayout from "../components/AuthLayout";
import InputField from "../components/InputField";
import PasswordInput from "../components/PasswordInput";
import Button from "../components/Button";

import { registerOwner } from "../services/authService";
import { useNavigate } from "react-router-dom";

function Register() {
  const [formData, setFormData] = useState({
    ownerName: "",
    shopName: "",
    mobile: "",
    password: "",
    shopNumber: "",
    address: "",
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

  await registerOwner({
      ownerName: formData.ownerName,
      shopName: formData.shopName,
      mobile: formData.mobile,
      password: formData.password,
      shopNumber: formData.shopNumber,
      location: {
        address: formData.address,
      },
    });
    
    alert("Account created successfully!");

    navigate("/");

  } catch (error) {
   
    alert(
      error.response?.data?.message ||
      error.message ||
      "Registration failed."
    );

  } finally {

    setLoading(false);

  }
};

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Create your ShopFlow account"
    >
      <form onSubmit={handleSubmit}>

        <InputField
          label="Owner Name"
          name="ownerName"
          placeholder="Enter owner name"
          value={formData.ownerName}
          onChange={handleChange}
        />

        <InputField
          label="Shop Name"
          name="shopName"
          placeholder="Enter shop name"
          value={formData.shopName}
          onChange={handleChange}
        />

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

        <InputField
          label="Shop Number (Optional)"
          name="shopNumber"
          placeholder="Enter shop number"
          value={formData.shopNumber}
          onChange={handleChange}
        />

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Shop Address
          </label>

          <textarea
            rows="3"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter shop address"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <Button
          type="submit"
          loading={loading}
        >
          Create Account
        </Button>

        <p className="text-center mt-6 text-gray-600">
          Already have an account?{" "}
          <Link
            to="/"
            className="text-blue-600 font-semibold hover:underline"
          >
            Login
          </Link>
        </p>

      </form>
    </AuthLayout>
  );
}

export default Register;