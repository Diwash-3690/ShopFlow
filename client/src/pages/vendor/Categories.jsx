import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Layers,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../services/categoryService";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Alert, AlertDescription } from "../../components/ui/alert";

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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center space-x-3">
          <Link
            to="/vendor/dashboard"
            className="text-slate-500 hover:text-slate-900 transition flex items-center gap-1.5 text-xs sm:text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-slate-900 text-xs sm:text-sm">Categories</span>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        <div>
          <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 bg-blue-50 text-blue-700 border-blue-200">
            Shop Catalog
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 tracking-tight">
            Manage Product Categories
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Group products into shop categories so customers can easily browse your catalog.
          </p>
        </div>

        {errorMsg && (
          <Alert variant="destructive" className="py-2.5 text-xs font-medium">
            <AlertDescription className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{errorMsg}</span>
            </AlertDescription>
          </Alert>
        )}

        {successMsg && (
          <Alert variant="success" className="py-2.5 text-xs font-medium">
            <AlertDescription className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </AlertDescription>
          </Alert>
        )}

        {/* Create Category Bar */}
        <Card className="rounded-3xl border-slate-200/90 shadow-2xs p-5 sm:p-6 bg-white">
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
            <Input
              type="text"
              placeholder="e.g. Dairy & Eggs, Snacks, Beverages, Bakery"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 text-xs bg-slate-50 border-slate-200 rounded-xl h-11"
            />
            <Button
              type="submit"
              disabled={creating || !newCatName.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 h-11 rounded-xl text-xs gap-1.5 shadow-xs whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>{creating ? "Adding..." : "Add Category"}</span>
            </Button>
          </form>
        </Card>

        {/* Categories List */}
        <Card className="rounded-3xl border-slate-200/90 shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-100 p-4 sm:p-5 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Categories ({categories.length})</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p>Loading categories...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs space-y-1">
                <p className="font-bold text-slate-700 text-sm">No categories created yet.</p>
                <p className="text-xs text-slate-400">Add your first category above to begin organizing your products.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {categories.map((cat) => (
                  <li key={cat.id} className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition text-xs">
                    {editingId === cat.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <Input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 text-xs h-9 bg-white"
                        />
                        <Button
                          size="icon"
                          onClick={() => handleSaveEdit(cat.id)}
                          className="h-9 w-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
                          title="Save"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingId(null)}
                          className="h-9 w-9 text-slate-400 hover:text-slate-700 rounded-lg"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">{cat.name}</span>
                          <Badge variant="outline" className="text-[10px] font-semibold bg-slate-50">
                            {cat._count?.products || 0} products
                          </Badge>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStartEdit(cat)}
                            className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(cat.id, cat.name)}
                            className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default Categories;
