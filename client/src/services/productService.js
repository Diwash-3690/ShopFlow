import api from "./api";

export const createProduct = async (productData) => {
  const response = await api.post("/products", productData);
  return response.data;
};

export const getProducts = async (params = {}) => {
  const response = await api.get("/products", { params });
  return response.data;
};

export const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const updateProduct = async (id, productData) => {
  const response = await api.put(`/products/${id}`, productData);
  return response.data;
};

export const updateProductStock = async (id, stockData) => {
  const response = await api.patch(`/products/${id}/stock`, stockData);
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};

export const getPublicShopProducts = async (shopId, params = {}) => {
  const response = await api.get(`/products/public/shop/${shopId}`, { params });
  return response.data;
};
