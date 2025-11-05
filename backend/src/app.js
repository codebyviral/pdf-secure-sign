// src/app.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import exampleRoutes from "./routes/example.router.js";
import healthRoutes from "./routes/health.router.js";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { digitallySignPdf } from "./utils/signPdf.js";

// Load environment variables from .env file
dotenv.config({ silent: true });

const app = express();

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(cookieParser());

const upload = multer({ dest: "uploads/" });

// API routes
app.use("/api/example", exampleRoutes);
app.use("/health", healthRoutes);

// Route for signing
app.post("/api/sign-pdf", upload.single("pdf"), async (req, res) => {
  try {
    const inputPath = req.file.path;
    const outputPath = await digitallySignPdf(inputPath);
    res.download(outputPath, "digitally-signed.pdf");
  } catch (err) {
    console.error("❌ Error signing PDF:", err);
    res.status(500).json({ error: "Failed to sign PDF" });
  }
});

//Resolve the certs folder relative to this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const certDir = path.join(__dirname, "certs");

const options = {
  key: fs.readFileSync(path.join(certDir, "private.key")),
  cert: fs.readFileSync(path.join(certDir, "certificate.crt")),
};

// Root route - Health check
app.get("/", (req, res) => {
  res.send(
    "✅ Server (JavaScript) is up and running smoothly! Explore API at /api/example"
  );
});

export default app;
