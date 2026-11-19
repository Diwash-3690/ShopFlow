import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Search,
  Package,
  AlertCircle,
  Minus,
} from "lucide-react";
import {
  getProducts,
  createProduct,
  updateProduct,
  updateProductStock,
  deleteProduct,
} from "../../services/productService";
import { getCategories } from "../../services/categoryService";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import { Alert, AlertDescription } from "../../components/ui/alert";
import ShopFlowRoleLogo from "../../components/ShopFlowRoleLogo";

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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navbar */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center space-x-3">
          <ShopFlowRoleLogo
            role="VENDOR"
            isDirty={isModalOpen}
            customWarningMessage="You have an active product editing task in progress. Do you want to leave without saving? Click Cancel to stay."
            onNavigate={() => setIsModalOpen(false)}
          />
          <span className="text-slate-300">/</span>
          <span className="font-bold text-slate-900 text-xs sm:text-sm">Products & Inventory</span>
        </div>

        <Button
          onClick={handleOpenAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 px-4 rounded-xl text-xs gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </Button>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Products & Stock Management
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage your catalog, set cost & selling prices, and track real-time stock levels.
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200/90 text-xs font-semibold shadow-2xs">
            <Button
              variant={stockFilter === "ALL" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStockFilter("ALL")}
              className={`rounded-lg h-7 px-3 text-xs font-bold ${
                stockFilter === "ALL" ? "bg-blue-600 text-white" : "text-slate-600"
              }`}
            >
              All
            </Button>
            <Button
              variant={stockFilter === "AVAILABLE" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStockFilter("AVAILABLE")}
              className={`rounded-lg h-7 px-3 text-xs font-bold ${
                stockFilter === "AVAILABLE" ? "bg-emerald-600 text-white" : "text-slate-600"
              }`}
            >
              In Stock
            </Button>
            <Button
              variant={stockFilter === "OUT_OF_STOCK" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStockFilter("OUT_OF_STOCK")}
              className={`rounded-lg h-7 px-3 text-xs font-bold ${
                stockFilter === "OUT_OF_STOCK" ? "bg-rose-600 text-white" : "text-slate-600"
              }`}
            >
              Out of Stock
            </Button>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <Card className="rounded-2xl border-slate-200/90 shadow-2xs p-3.5 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search product by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs bg-slate-50/70 border-slate-200 rounded-xl h-9"
              />
            </div>

            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 h-9 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/70 text-slate-700 font-medium"
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
        </Card>

        {/* Products Table */}
        {loading ? (
          <Card className="p-16 text-center text-slate-500 text-xs bg-white rounded-3xl border-slate-200">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="font-semibold">Loading products...</p>
          </Card>
        ) : products.length === 0 ? (
          <Card className="p-16 text-center text-slate-400 text-xs bg-white rounded-3xl border-slate-200 shadow-sm space-y-2">
            <Package className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-bold text-slate-800 text-sm">No products found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchTerm || selectedCategory !== "ALL" || stockFilter !== "ALL"
                ? "Try clearing filters to see all products."
                : "Click 'Add Product' above to start adding products to your shop."}
            </p>
          </Card>
        ) : (
          <Card className="rounded-3xl border-slate-200/90 shadow-sm overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <TableHead className="py-3 px-6">Product</TableHead>
                    <TableHead className="py-3 px-4">Category</TableHead>
                    <TableHead className="py-3 px-4">Selling Price</TableHead>
                    <TableHead className="py-3 px-4">Cost / Profit</TableHead>
                    <TableHead className="py-3 px-4">Stock Status</TableHead>
                    <TableHead className="py-3 px-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 text-xs">
                  {products.map((p) => {
                    const profit = (parseFloat(p.sellingPrice) - parseFloat(p.costPrice)).toFixed(2);
                    const isOutOfStock = p.stockQuantity <= 0;

                    return (
                      <TableRow key={p.id} className="hover:bg-slate-50/70 transition">
                        {/* Product Name & Image */}
                        <TableCell className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                <Package className="w-5 h-5 text-slate-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{p.name}</p>
                              <p className="text-[11px] text-slate-400 line-clamp-1">{p.description || "No description"}</p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Category */}
                        <TableCell className="py-3.5 px-4">
                          <Badge variant="outline" className="font-medium text-[11px] bg-slate-50">
                            {p.category?.name || "Uncategorized"}
                          </Badge>
                        </TableCell>

                        {/* Selling Price */}
                        <TableCell className="py-3.5 px-4">
                          <span className="font-black text-slate-900 text-sm">
                            ₹{parseFloat(p.sellingPrice).toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1">/ {p.unit}</span>
                        </TableCell>

                        {/* Cost & Profit */}
                        <TableCell className="py-3.5 px-4">
                          <p className="text-[11px] text-slate-500 font-mono">Cost: ₹{parseFloat(p.costPrice).toFixed(2)}</p>
                          <p className="text-[11px] font-bold text-emerald-600 mt-0.5">
                            Profit: +₹{profit}
                          </p>
                        </TableCell>

                        {/* Stock & Quick Adjust */}
                        <TableCell className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={isOutOfStock ? "destructive" : "success"}
                              className="font-bold text-[10px] uppercase py-0.5 px-2"
                            >
                              {isOutOfStock ? "Out of Stock" : `${p.stockQuantity} ${p.unit}s`}
                            </Badge>

                            {/* Quick Increment/Decrement */}
                            <div className="inline-flex rounded-lg border border-slate-200 bg-white shadow-2xs">
                              <button
                                onClick={() => handleQuickStock(p.id, -1)}
                                disabled={p.stockQuantity <= 0}
                                className="px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                                title="Decrease Stock by 1"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleQuickStock(p.id, 1)}
                                className="px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100 border-l border-slate-200 cursor-pointer"
                                title="Increase Stock by 1"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-3.5 px-6 text-right">
                          <div className="inline-flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(p)}
                              className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Edit Product"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(p.id, p.name)}
                              className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </main>

      {/* Add / Edit Product Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg p-6 sm:p-7 rounded-3xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-black text-slate-900">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Fill in product information. Cost price and stock quantities remain private.
            </DialogDescription>
          </DialogHeader>

          {modalError && (
            <Alert variant="destructive" className="py-2.5 text-xs">
              <AlertDescription className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>{modalError}</span>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmitModal} className="space-y-3.5 pt-1">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. Amul Milk 500ml, Basmati Rice 1kg"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Category
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 h-9 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None (Uncategorized)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Unit of Measurement
                </label>
                <Input
                  type="text"
                  placeholder="piece, kg, liter, pack, box"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Selling Price (₹) <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.sellingPrice}
                  onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Cost Price (₹) <span className="text-rose-500">*</span> <span className="text-[10px] text-slate-400 font-normal">(Private)</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.costPrice}
                  onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Stock Quantity <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={form.stockQuantity}
                onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Image URL (Optional)
              </label>
              <Input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Description (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Brief details about product size, ingredients, or brand"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="text-xs font-bold h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 px-5 text-xs shadow-xs"
              >
                {submitting ? "Saving..." : editingProduct ? "Save Changes" : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Products;
