// src/utils/signPdf.js
import fs from "fs";
import forge from "node-forge";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/**
 * Dynamically generate a self-signed certificate with user-provided details.
 */
function generateSelfSignedCertificate({
  commonName = "Default User",
  organizationName = "PDF Secure Sign",
  organizationalUnit = "ICT Department",
  countryName = "IN",
  stateName = "Gujarat",
  localityName = "Gandhinagar",
  validityDays = 365,
  notBefore, // start date
  notAfter, // end date
}) {
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = new Date().getTime().toString();

  // Validity period
  const startDate = notBefore ? new Date(notBefore) : new Date();
  const endDate = notAfter
    ? new Date(notAfter)
    : new Date(startDate.getTime() + validityDays * 24 * 60 * 60 * 1000);

  cert.validity.notBefore = startDate;
  cert.validity.notAfter = endDate;

  // Certificate subject details
  const attrs = [
    { name: "commonName", value: commonName },
    { name: "organizationName", value: organizationName },
    { shortName: "OU", value: organizationalUnit },
    { name: "countryName", value: countryName },
    { shortName: "ST", value: stateName },
    { name: "localityName", value: localityName },
  ];

  cert.setSubject(attrs);
  cert.setIssuer(attrs); // self-signed

  // Add certificate extensions
  cert.setExtensions([
    { name: "basicConstraints", cA: true },
    {
      name: "keyUsage",
      digitalSignature: true,
      nonRepudiation: true,
      keyCertSign: true,
      dataEncipherment: true,
    },
    {
      name: "extKeyUsage",
      clientAuth: true,
      emailProtection: true,
      codeSigning: true,
    },
    {
      name: "subjectAltName",
      altNames: [
        { type: 2, value: "localhost" },
        { type: 7, ip: "127.0.0.1" },9
      ],
    },
  ]);

  // Self-sign the certificate
  cert.sign(keys.privateKey, forge.md.sha256.create());

  // Convert to PEM format
  const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);
  const certificatePem = forge.pki.certificateToPem(cert);

  return { privateKeyPem, certificatePem, details: { startDate, endDate } };
}

/**
 * Sign PDF using dynamically generated certificate.
 */
export async function digitallySignPdf(pdfPath, userDetails) {
  // Generate new self-signed cert + key
  const { privateKeyPem, certificatePem, details } =
    generateSelfSignedCertificate(userDetails);

  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
  const certificate = forge.pki.certificateFromPem(certificatePem);

  // Load PDF
  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // Add visible text note on PDF
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  firstPage.drawText(`Digitally Signed by ${userDetails.commonName}`, {
    x: 50,
    y: 50,
    size: 9,
    font,
    color: rgb(0, 0, 0),
  });
  firstPage.drawText(`Organization: ${userDetails.organizationName}`, {
    x: 50,
    y: 35,
    size: 9,
    font,
    color: rgb(0, 0, 0),
  });
  firstPage.drawText(
    `Valid: ${details.startDate.toDateString()} - ${details.endDate.toDateString()}`,
    {
      x: 50,
      y: 20,
      size: 9,
      font,
      color: rgb(0, 0, 0),
    }
  );

  // Create PKCS#7 detached signature
  const md = forge.md.sha256.create();
  md.update(pdfBytes.toString("binary"));

  const p7 = forge.pkcs7.createSignedData();
  p7.content = new forge.util.ByteBuffer(pdfBytes.toString("binary"));
  p7.addCertificate(certificate);
  p7.addSigner({
    key: privateKey,  
    certificate,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest, value: md.digest().bytes() },
      { type: forge.pki.oids.signingTime, value: new Date() },
    ],
  });
  p7.sign({ detached: true });

  // Convert signature to Uint8Array
  const derBytes = forge.asn1.toDer(p7.toAsn1()).getBytes();
  const signatureArray = new Uint8Array(derBytes.length);
  for (let i = 0; i < derBytes.length; i++) {
    signatureArray[i] = derBytes.charCodeAt(i);
  }

  // Attach signature
  await pdfDoc.attach(signatureArray, "signature.p7s", {
    description: `Detached PKCS#7 signature for ${userDetails.commonName}`,
  });

  // Add metadata
  pdfDoc.setTitle("Digitally Signed PDF");
  pdfDoc.setSubject("Contains dynamically generated PKCS#7 signature");
  pdfDoc.setProducer("Node.js Forge + pdf-lib");
  pdfDoc.setCreator("PDF Secure Sign Dynamic System");

  // Save output
  const outputDir = "signed";
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = pdfPath
    .replace("uploads", "signed")
    .replace(".pdf", "-signed.pdf");
  const signedBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, signedBytes);

  console.log(
    "PDF signed using user-provided certificate details:",
    outputPath
  );
  return outputPath;
}
