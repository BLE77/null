import type { Express } from "express";
import multer from "multer";
import { dbStorage } from "./db-storage";
import { requireAdmin } from "./auth";
import { insertProductSchema } from "@shared/schema";
import path from "path";
import fs from "fs";
import { put } from "@vercel/blob";

const isVercel = !!process.env.VERCEL;
const useBlob = isVercel || !!process.env.BLOB_READ_WRITE_TOKEN;
let uploadsDir = path.join(process.cwd(), "uploads");
if (!useBlob) {
  // Only ensure local uploads dir when not using Blob storage
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

// Configure multer for file uploads
const storage = useBlob
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
      },
      filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      },
    });

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Accept images, videos, and .glb files
    const allowedTypes = /jpeg|jpg|png|gif|glb|mp4|webm|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith('image/') || 
                     file.mimetype.startsWith('video/') || 
                     file.mimetype === 'model/gltf-binary' || 
                     file.originalname.endsWith('.glb');
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, videos, and .glb files are allowed'));
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit for videos
  }
});

export function registerAdminRoutes(app: Express) {
  // Upload image endpoint
  app.post("/api/admin/uploads/image", requireAdmin, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      if (useBlob) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const key = `uploads/${req.file.fieldname}-${uniqueSuffix}${path.extname(req.file.originalname)}`;
        const { url } = await put(key, req.file.buffer as Buffer, {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        return res.json({ url });
      }
      const fileUrl = `/uploads/${(req.file as any).filename}`;
      res.json({ url: fileUrl });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Upload model endpoint
  app.post("/api/admin/uploads/model", requireAdmin, upload.single('model'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      if (useBlob) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const key = `uploads/${req.file.fieldname}-${uniqueSuffix}${path.extname(req.file.originalname)}`;
        const { url } = await put(key, req.file.buffer as Buffer, {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        return res.json({ url });
      }
      const fileUrl = `/uploads/${(req.file as any).filename}`;
      res.json({ url: fileUrl });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload model" });
    }
  });

  // Upload multiple images endpoint
  app.post("/api/admin/uploads/images", requireAdmin, upload.array('images', 10), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }
      if (useBlob) {
        const urls: string[] = [];
        for (const f of files) {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const key = `uploads/${f.fieldname}-${uniqueSuffix}${path.extname(f.originalname)}`;
          const { url } = await put(key, f.buffer as Buffer, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN,
          });
          urls.push(url);
        }
        return res.json({ urls });
      }
      const fileUrls = (files as any[]).map((file) => `/uploads/${file.filename}`);
      res.json({ urls: fileUrls });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload images" });
    }
  });

  // Get all products (admin view with all data)
  app.get("/api/admin/products", requireAdmin, async (req, res) => {
    try {
      const products = await dbStorage.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Create product
  app.post("/api/admin/products", requireAdmin, async (req, res) => {
    try {
      const validatedProduct = insertProductSchema.parse(req.body);
      const product = await dbStorage.createProduct(validatedProduct);
      res.status(201).json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Invalid product data" });
    }
  });

  // Update product
  app.patch("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const product = await dbStorage.updateProduct(id, updates);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update product" });
    }
  });

  // Delete product
  app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await dbStorage.deleteProduct(id);
      
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });
}
