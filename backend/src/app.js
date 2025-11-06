// src/app.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { digitallySignPdf } from "./utils/signPdf.js";

dotenv.config({ silent: true });

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

const upload = multer({ dest: "uploads/" });

app.get("/api/health", (req, res) => {
  try {
    return res.status(200).json({
      status: "OK",
      message: "Server is healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Something went wrong with the health check",
      error: error.message,
    });
  }
});

// === API: sign PDF ===
// === API: sign PDF ===
app.post("/api/sign-pdf", upload.single("pdf"), async (req, res) => {
  try {
    const inputPath = req.file.path;

    // Match the exact field names from frontend
    const userDetails = {
      commonName: req.body.commonName,
      organizationName: req.body.organizationName,
      organizationalUnit: req.body.organizationalUnit || "ICT Department",
      countryName: req.body.countryName || "IN",
      stateName: req.body.stateName || "Gujarat",
      localityName: req.body.localityName || "Gandhinagar",
      validityDays: req.body.validityDays
        ? parseInt(req.body.validityDays)
        : 365,
      notBefore: req.body.notBefore,
      notAfter: req.body.notAfter,
    };

    console.log("Received user details:", userDetails);

    const outputPath = await digitallySignPdf(inputPath, userDetails);
    res.download(outputPath, "digitally-signed.pdf");
  } catch (err) {
    console.error("Error signing PDF:", err);
    res.status(500).json({ error: "Failed to sign PDF" });
  }
});

// === Health routes & other APIs (optional) ===
app.get("/", (req, res) => {
  res.send(
    "PDF Secure Sign server is running! POST /api/sign-pdf with a PDF file to sign it dynamically."
  );
});

export default app;
