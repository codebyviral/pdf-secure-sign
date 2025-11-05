// src/utils/signPdf.js
import fs from "fs";
import path from "path";
import {
    fileURLToPath
} from "url";
import forge from "node-forge";
import {
    PDFDocument,
    StandardFonts,
    rgb
} from "pdf-lib";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const certDir = path.resolve(__dirname, "../certs");

export async function digitallySignPdf(pdfPath) {
    // Read certs
    const privateKeyPem = fs.readFileSync(path.join(certDir, "private.key"), "utf8");
    const certificatePem = fs.readFileSync(path.join(certDir, "certificate.crt"), "utf8");

    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    const certificate = forge.pki.certificateFromPem(certificatePem);

    // Load PDF
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Add visible signature note
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    firstPage.drawText("Digitally Signed by pdf-secure-sign", {
        x: 50,
        y: 50,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    // === Generate PKCS#7 detached signature ===
    const md = forge.md.sha256.create();
    md.update(pdfBytes.toString("binary"));

    const p7 = forge.pkcs7.createSignedData();
    p7.content = new forge.util.ByteBuffer(pdfBytes.toString("binary"));
    p7.addCertificate(certificate);
    p7.addSigner({
        key: privateKey,
        certificate: certificate,
        digestAlgorithm: forge.pki.oids.sha256,
        authenticatedAttributes: [{
                type: forge.pki.oids.contentType,
                value: forge.pki.oids.data
            },
            {
                type: forge.pki.oids.messageDigest,
                value: md.digest().bytes()
            },
            {
                type: forge.pki.oids.signingTime,
                value: new Date()
            },
        ],
    });
    p7.sign({
        detached: true
    });

    // Convert to ArrayBuffer
    const derBytes = forge.asn1.toDer(p7.toAsn1()).getBytes();
    const signatureArray = new Uint8Array(derBytes.length);
    for (let i = 0; i < derBytes.length; i++) {
        signatureArray[i] = derBytes.charCodeAt(i);
    }

    // Attach signature as .p7s
    await pdfDoc.attach(signatureArray, "signature.p7s", {
        description: "Detached PKCS#7 digital signature",
    });

    // Metadata
    pdfDoc.setTitle("Digitally Signed PDF");
    pdfDoc.setSubject("Contains PKCS#7 digital signature");
    pdfDoc.setProducer("Node.js Forge + pdf-lib");
    pdfDoc.setCreator("PDF Secure Sign");

    // Save
    const outputDir = "signed";
    fs.mkdirSync(outputDir, {
        recursive: true
    });
    const outputPath = pdfPath.replace("uploads", "signed").replace(".pdf", "-signed.pdf");
    const signedBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, signedBytes);

    console.log("✅ PDF digitally signed:", outputPath);
    return outputPath;
}