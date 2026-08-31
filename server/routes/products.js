import { Router } from 'express';
import {
  getAllProducts,
  getProductBySku,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkImportProducts,
} from '../controllers/productController.js';

const router = Router();

// GET /api/products — Get all products
router.get('/', getAllProducts);

// POST /api/products/bulk — Bulk import products
router.post('/bulk', bulkImportProducts);

// GET /api/products/:sku — Get product by SKU
router.get('/:sku', getProductBySku);

// POST /api/products — Create new product
router.post('/', createProduct);

// PUT /api/products/:sku — Update product by SKU
router.put('/:sku', updateProduct);

// DELETE /api/products/:sku — Delete product by SKU
router.delete('/:sku', deleteProduct);

export default router;
