import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiLayers } from "react-icons/fi";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../services/categoryService";

function Categories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCatName, setNewCatName] = useState("");
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const loadCategories = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await getCategories();
      setCategories(res.categories || []);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token || role !== "VENDOR") {
      navigate("/vendor/login");
      return;
    }
    loadCategories();
  }, [navigate]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      setCreating(true);
      setErrorMsg("");
      setSuccessMsg("");
      await createCategory({ name: newCatName.trim() });
      setNewCatName("");
      setSuccessMsg("Category created successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
      await loadCategories();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to create category");
    } finally {
      setCreating(false);
    }
  };

  const handleStartEdit = (cat) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const handleSaveEdit = async (id) => {
    if (!editName.trim()) return;
    try {
      setErrorMsg("");
      await updateCategory(id, { name: editName.trim() });
      setEditingId(null);
      await loadCategories();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to update category");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"? Any products in this category will become Uncategorized.`)) {
      return;
    }

    try {
      setErrorMsg("");
      await deleteCategory(id);
      await loadCategories();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to delete category");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <Link to="/vendor/dashboard" className="text-slate-500 hover:text-slate-800 transition flex items-center gap-1.5 text-sm font-medium">
            <FiArrowLeft /> Dashboard
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-slate-900 text-sm">Categories</span>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-6 py-8 flex-1 w-full space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
            Shop Catalog
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
            Manage Product Categories
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Group products into shop categories so customers can easily browse your catalog.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl">
            {successMsg}
          </div>
        )}

        {/* Create Category Bar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="e.g. Dairy & Eggs, Snacks, Beverages, Bakery"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={creating || !newCatName.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold px-6 py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm whitespace-nowrap cursor-pointer"
            >
              <FiPlus /> {creating ? "Adding..." : "Add Category"}
            </button>
          </form>
        </div>

        {/* Categories List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <FiLayers className="text-blue-600" /> Categories ({categories.length})
            </h3>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <p className="font-medium text-slate-600">No categories created yet.</p>
              <p className="text-xs text-slate-400 mt-1">Add your first category above to begin organizing your products.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {categories.map((cat) => (
                <li key={cat.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                  {editingId === cat.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 border border-blue-500 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveEdit(cat.id)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                        title="Save"
                      >
                        <FiCheck size={18} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition"
                        title="Cancel"
                      >
                        <FiX size={18} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-800 text-sm">{cat.name}</span>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-medium">
                          {cat._count?.products || 0} products
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStartEdit(cat)}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id, cat.name)}
                          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}

export default Categories;
