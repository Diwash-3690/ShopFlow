import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiPackage,
  FiX,
  FiAlertCircle,
} from "react-icons/fi";
import {
  getProducts,
  createProduct,
  updateProduct,
  updateProductStock,
  deleteProduct,
} from "../../services/productService";
import { getCategories } from "../../services/categoryService";

function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [stockFilter, setStockFilter] = useState("ALL"); // ALL, AVAILABLE, OUT_OF_STOCK

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    description: "",
    imageUrl: "",
    costPrice: "",
    sellingPrice: "",
    stockQuantity: "0",
    unit: "piece",
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        getProducts({
          search: searchTerm || undefined,
          categoryId: selectedCategory !== "ALL" ? selectedCategory : undefined,
          status: stockFilter !== "ALL" ? stockFilter : undefined,
        }),
        getCategories(),
      ]);

      setProducts(prodRes.products || []);
      setCategories(catRes.categories || []);
    } catch (err) {
      console.error("Failed to load products/categories:", err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, stockFilter]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token || role !== "VENDOR") {
      navigate("/vendor/login");
      return;
    }
    loadData();
  }, [navigate, loadData]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setForm({
      name: "",
      categoryId: categories[0]?.id || "",
      description: "",
      imageUrl: "",
      costPrice: "",
      sellingPrice: "",
      stockQuantity: "10",
      unit: "piece",
    });
    setModalError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      categoryId: p.categoryId || "",
      description: p.description || "",
      imageUrl: p.imageUrl || "",
      costPrice: p.costPrice !== undefined ? p.costPrice.toString() : "",
      sellingPrice: p.sellingPrice !== undefined ? p.sellingPrice.toString() : "",
      stockQuantity: p.stockQuantity !== undefined ? p.stockQuantity.toString() : "0",
      unit: p.unit || "piece",
    });
    setModalError("");
    setIsModalOpen(true);
  };

  const handleSubmitModal = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setModalError("Product name is required.");
      return;
    }
    if (!form.sellingPrice || parseFloat(form.sellingPrice) < 0) {
      setModalError("Please enter a valid selling price.");
      return;
    }
    if (!form.costPrice || parseFloat(form.costPrice) < 0) {
      setModalError("Please enter a valid cost price.");
      return;
    }

    try {
      setSubmitting(true);
      setModalError("");

      const payload = {
        name: form.name.trim(),
        categoryId: form.categoryId || undefined,
        description: form.description.trim() || undefined,
        imageUrl: form.imageUrl.trim() || undefined,
        costPrice: parseFloat(form.costPrice),
        sellingPrice: parseFloat(form.sellingPrice),
        stockQuantity: parseInt(form.stockQuantity, 10) || 0,
        unit: form.unit.trim() || "piece",
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
      } else {
        await createProduct(payload);
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStock = async (id, delta) => {
    try {
      await updateProductStock(id, { delta });
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to adjust stock");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await deleteProduct(id);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete product");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <Link to="/vendor/dashboard" className="text-slate-500 hover:text-slate-800 transition flex items-center gap-1.5 text-sm font-medium">
            <FiArrowLeft /> Dashboard
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-slate-900 text-sm">Products & Inventory</span>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold px-4 py-2 rounded-xl text-sm transition flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <FiPlus size={16} /> Add Product
        </button>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Products & Stock Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your catalog, set cost & selling prices, and track real-time stock levels.
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setStockFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                stockFilter === "ALL" ? "bg-blue-600 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStockFilter("AVAILABLE")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                stockFilter === "AVAILABLE" ? "bg-emerald-600 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              In Stock
            </button>
            <button
              onClick={() => setStockFilter("OUT_OF_STOCK")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                stockFilter === "OUT_OF_STOCK" ? "bg-red-600 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Out of Stock
            </button>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="sm:col-span-2 relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search product by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Table / Cards */}
        {loading ? (
          <div className="p-16 text-center text-slate-500 text-sm bg-white rounded-2xl border border-slate-200">
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200 shadow-sm">
            <FiPackage size={36} className="mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700">No products found</p>
            <p className="text-xs text-slate-400 mt-1">
              {searchTerm || selectedCategory !== "ALL" || stockFilter !== "ALL"
                ? "Try clearing filters to see all products."
                : "Click 'Add Product' above to start adding products to your shop."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Product</th>
                    <th className="py-3.5 px-6">Category</th>
                    <th className="py-3.5 px-6">Selling Price</th>
                    <th className="py-3.5 px-6">Cost / Profit</th>
                    <th className="py-3.5 px-6">Stock Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {products.map((p) => {
                    const profit = (parseFloat(p.sellingPrice) - parseFloat(p.costPrice)).toFixed(2);
                    const isOutOfStock = p.stockQuantity <= 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition">
                        {/* Product Name & Image */}
                        <td className="py-4 px-6 flex items-center gap-3">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                              <FiPackage size={22} />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900">{p.name}</p>
                            <p className="text-xs text-slate-400 line-clamp-1">{p.description || "No description"}</p>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-4 px-6">
                          <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium">
                            {p.category?.name || "Uncategorized"}
                          </span>
                        </td>

                        {/* Selling Price */}
                        <td className="py-4 px-6">
                          <span className="font-extrabold text-slate-900">
                            ₹{parseFloat(p.sellingPrice).toFixed(2)}
                          </span>
                          <span className="text-xs text-slate-500 ml-1">/ {p.unit}</span>
                        </td>

                        {/* Cost & Profit */}
                        <td className="py-4 px-6">
                          <p className="text-xs text-slate-500">Cost: ₹{parseFloat(p.costPrice).toFixed(2)}</p>
                          <p className="text-xs font-semibold text-emerald-600 mt-0.5">
                            Profit: +₹{profit}
                          </p>
                        </td>

                        {/* Stock & Quick Adjust */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                isOutOfStock
                                  ? "bg-red-100 text-red-700"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {isOutOfStock ? "Out of Stock" : `${p.stockQuantity} ${p.unit}s`}
                            </span>

                            {/* Quick Increment/Decrement */}
                            <div className="inline-flex rounded-lg border border-slate-200 bg-white shadow-xs">
                              <button
                                onClick={() => handleQuickStock(p.id, -1)}
                                disabled={p.stockQuantity <= 0}
                                className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                                title="Decrease Stock by 1"
                              >
                                -
                              </button>
                              <button
                                onClick={() => handleQuickStock(p.id, 1)}
                                className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 border-l border-slate-200 cursor-pointer"
                                title="Increase Stock by 1"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Edit Product"
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Delete Product"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-xl border border-slate-200 relative my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <FiX size={20} />
            </button>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Fill in product information. Cost price and stock quantities remain private.
            </p>

            {modalError && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <FiAlertCircle size={16} /> {modalError}
              </div>
            )}

            <form onSubmit={handleSubmitModal} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Amul Milk 500ml, Basmati Rice 1kg"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None (Uncategorized)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit of Measurement
                  </label>
                  <input
                    type="text"
                    placeholder="piece, kg, liter, pack, box"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.sellingPrice}
                    onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cost Price (₹) * <span className="text-[10px] text-slate-400 font-normal">(Private)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.costPrice}
                    onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.stockQuantity}
                  onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief details about product size, ingredients, or brand"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="border border-slate-300 px-4 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-xl text-sm transition shadow-sm cursor-pointer"
                >
                  {submitting ? "Saving..." : editingProduct ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;
