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

// POST /api/products/bulk & /bulk-import — Bulk import products
router.post('/bulk', bulkImportProducts);
router.post('/bulk-import', bulkImportProducts);

// GET /api/products/:sku — Get product by SKU or ID
router.get('/:sku', getProductBySku);

// POST /api/products — Create new product
router.post('/', createProduct);

// PUT & PATCH /api/products/:sku (and /:sku/stock, /:id/stock) — Update product
router.put('/:sku', updateProduct);
router.patch('/:sku', updateProduct);
router.put('/:sku/stock', updateProduct);
router.patch('/:sku/stock', updateProduct);

// DELETE /api/products/:sku — Delete product by SKU
router.delete('/:sku', deleteProduct);

export default router;

