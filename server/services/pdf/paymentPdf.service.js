const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

class PaymentPdfService {
  // ISO 4217 Compliant Format
  static formatCurrency(amount) {
    return (
      "PHP " +
      parseFloat(amount).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }

  static async generate(payment, settings) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: 50,
          size: "A4",
          bufferPages: true,
        });
        const buffers = [];

        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => resolve(Buffer.concat(buffers)));

        // --- BACKGROUND WATERMARK (IF VOID) ---
        if (payment.status === "VOID") {
          doc
            .save()
            .translate(200, 350)
            .rotate(-45, { origin: [0, 0] })
            .fontSize(80)
            .fillColor("#ef4444")
            .opacity(0.1)
            .text("VOIDED", 0, 0, { align: "center", width: 400 })
            .restore();
        }

        // --- 1. HEADER SECTION ---
        let currentY = 40;

        doc
          .fontSize(22)
          .font("Helvetica-Bold")
          .fillColor("#0f172a")
          .text(settings?.company_name || "Overdrive Auto Shop", 50, currentY, {
            align: "center",
            width: 495,
          });
        currentY += 24;

        const contactInfo = [settings?.contact_number, settings?.contact_email]
          .filter(Boolean)
          .join("  |  ");

        if (contactInfo) {
          doc
            .fontSize(9)
            .font("Helvetica")
            .fillColor("#64748b")
            .text(contactInfo, 50, currentY, { align: "center", width: 495 });
          currentY += 14;
        }

        currentY += 25;

        // ROW 2: Logo (Left) and Document Meta (Right) aligned perfectly
        const row2StartY = currentY;
        let rightY = row2StartY;

        // LEFT SIDE: Logo
        if (settings?.logo_url) {
          const cleanLogoUrl = settings.logo_url.replace(/^\//, "");
          const logoPath = path.join(process.cwd(), cleanLogoUrl);

          if (fs.existsSync(logoPath)) {
            try {
              doc.image(logoPath, 50, row2StartY, {
                fit: [100, 75],
                align: "left",
              });
            } catch (imgError) {
              console.warn("PDF Engine: Logo exists but is corrupted.");
            }
          }
        }

        // RIGHT SIDE: Document Title & Meta
        doc
          .fontSize(16)
          .font("Helvetica-Bold")
          .fillColor(payment.status === "VOID" ? "#ef4444" : "#10b981")
          .text("OFFICIAL RECEIPT", 300, rightY, {
            align: "right",
            width: 245,
          });
        rightY += 18;

        const statusColor = payment.status === "VOID" ? "#ef4444" : "#10b981";
        const displayStatus =
          payment.status === "VALID" ? "COMPLETED" : "VOIDED";

        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .fillColor(statusColor)
          .text(displayStatus, 300, rightY, { align: "right", width: 245 });
        rightY += 14;

        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .fillColor(payment.status === "VOID" ? "#ef4444" : "#0f172a")
          .text(payment.payment_number, 300, rightY, {
            align: "right",
            width: 245,
          });
        rightY += 14;

        doc
          .font("Helvetica")
          .fillColor("#64748b")
          .fontSize(9)
          .text(
            `Date: ${new Date(payment.payment_date || payment.created_at).toLocaleDateString()}`,
            300,
            rightY,
            { align: "right", width: 245 },
          );
        rightY += 12;

        let startY = Math.max(row2StartY + 85, rightY + 15);

        // Line Separator
        doc
          .moveTo(50, startY)
          .lineTo(545, startY)
          .lineWidth(1)
          .strokeColor("#e2e8f0")
          .stroke();
        startY += 20;

        // --- 2. ADDRESS BLOCKS ---
        const addressY = startY;

        // Branch Address (Left)
        doc
          .fontSize(8)
          .font("Helvetica-Bold")
          .fillColor("#94a3b8")
          .text("SERVICE BRANCH", 50, addressY);
        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .fillColor("#0f172a")
          .text(payment.branch_name, 50, addressY + 12);

        if (payment.branch_address) {
          doc
            .fontSize(9)
            .font("Helvetica")
            .fillColor("#475569")
            .text(payment.branch_address, 50, addressY + 26, {
              width: 220,
              lineGap: 2,
            });
        } else {
          doc
            .fontSize(9)
            .font("Helvetica-Oblique")
            .fillColor("#94a3b8")
            .text("Address not provided", 50, addressY + 26);
        }

        // Customer Address (Right)
        doc
          .fontSize(8)
          .font("Helvetica-Bold")
          .fillColor("#94a3b8")
          .text("RECEIVED FROM", 300, addressY);
        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .fillColor("#0f172a")
          .text(payment.customer_name, 300, addressY + 12);

        let custY = addressY + 26;
        if (payment.contact_number) {
          doc
            .fontSize(9)
            .font("Helvetica")
            .fillColor("#475569")
            .text(payment.contact_number, 300, custY);
          custY += 14;
        }

        if (payment.customer_address) {
          doc
            .font("Helvetica")
            .text(payment.customer_address, 300, custY, {
              width: 245,
              lineGap: 2,
            });
        } else {
          doc
            .font("Helvetica-Oblique")
            .fillColor("#94a3b8")
            .text("Address not provided", 300, custY);
        }

        startY = doc.y + 35;

        // --- 3. SETTLEMENT MATRIX TABLE ---
        const colX = { desc: 50, method: 250, ref: 350, amt: 460 };
        const colW = { desc: 190, method: 90, ref: 100, amt: 85 };

        doc.roundedRect(50, startY, 495, 22, 4).fill("#f1f5f9");
        doc.fillColor("#475569").font("Helvetica-Bold").fontSize(8);
        const headerY = startY + 6;

        doc.text("DESCRIPTION", colX.desc, headerY, {
          width: colW.desc,
          align: "left",
        });
        doc.text("METHOD", colX.method, headerY, {
          width: colW.method,
          align: "left",
        });
        doc.text("REF. NO", colX.ref, headerY, {
          width: colW.ref,
          align: "left",
        });
        doc.text("AMOUNT APPLIED", colX.amt, headerY, {
          width: colW.amt,
          align: "right",
        });

        startY += 30;
        doc.font("Helvetica-Bold").fontSize(9).fillColor("#0f172a");

        // Main Payment Row
        const descriptionText = `Payment applied to Invoice ${payment.invoice_number}`;
        const methodText = payment.payment_method.replace(/_/g, " ");
        const refText = payment.reference_number || "N/A";
        const amtApplied = parseFloat(payment.amount_received);

        doc.text(descriptionText, colX.desc, startY, {
          width: colW.desc,
          align: "left",
        });
        doc
          .font("Helvetica")
          .text(methodText, colX.method, startY, {
            width: colW.method,
            align: "left",
          });
        doc.text(refText, colX.ref, startY, { width: colW.ref, align: "left" });
        doc
          .font("Helvetica-Bold")
          .text(this.formatCurrency(amtApplied), colX.amt, startY, {
            width: colW.amt,
            align: "right",
          });

        startY += 25;
        doc
          .moveTo(50, startY - 5)
          .lineTo(545, startY - 5)
          .lineWidth(1)
          .strokeColor("#cbd5e1")
          .stroke();
        startY += 10;

        // --- 4. TOTALS SECTION ---
        const labelX = 320;
        const labelW = 130;
        const valueX = 460;
        const valueW = 85;

        // Invoice Grand Total
        doc.font("Helvetica-Bold").fontSize(9).fillColor("#475569");
        doc.text(`Invoice Total (${payment.invoice_number}):`, labelX, startY, {
          width: labelW,
          align: "right",
        });
        doc
          .fillColor("#0f172a")
          .text(this.formatCurrency(payment.invoice_total), valueX, startY, {
            width: valueW,
            align: "right",
          });
        startY += 20;

        // Amount Applied Box (Emerald Green)
        doc
          .roundedRect(labelX, startY, 225, 24, 4)
          .fill(payment.status === "VOID" ? "#fef2f2" : "#ecfdf5");
        doc
          .fillColor(payment.status === "VOID" ? "#ef4444" : "#10b981")
          .fontSize(10)
          .font("Helvetica-Bold");
        doc.text("AMOUNT APPLIED:", labelX + 10, startY + 6, {
          width: labelW - 10,
          align: "left",
        });
        doc.text(this.formatCurrency(amtApplied), valueX, startY + 6, {
          width: valueW - 10,
          align: "right",
        });

        // If VOIDED, draw a strikethrough over the amount
        if (payment.status === "VOID") {
          doc
            .moveTo(valueX + 15, startY + 12)
            .lineTo(valueX + valueW, startY + 12)
            .lineWidth(1.5)
            .strokeColor("#ef4444")
            .stroke();
        }

        startY += 30;

        // Remaining Balance
        doc.font("Helvetica-Bold").fontSize(9).fillColor("#64748b");
        doc.text("Current Balance Due:", labelX, startY, {
          width: labelW,
          align: "right",
        });
        const currentBalance =
          parseFloat(payment.invoice_total) -
          parseFloat(payment.invoice_amount_paid);
        doc
          .fillColor(currentBalance > 0 ? "#ef4444" : "#10b981")
          .text(
            this.formatCurrency(Math.max(0, currentBalance)),
            valueX,
            startY,
            { width: valueW, align: "right" },
          );

        startY += 50;

        // --- 5. FOOTER & TERMS ---
        if (startY > 680) {
          doc.addPage();
          startY = 50;
        }

        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .fillColor("#0f172a")
          .text("Collection Notes:", 50, startY);
        doc
          .fontSize(9)
          .font("Helvetica-Oblique")
          .fillColor("#64748b")
          .text(
            payment.notes || "Thank you for your payment.",
            50,
            startY + 15,
            { width: 495, lineGap: 2 },
          );

        startY = doc.y + 40;
        if (startY > 740) {
          doc.addPage();
          startY = 50;
        }

        doc.fontSize(9).font("Helvetica-Bold").fillColor("#0f172a");

        // Prepared By Signature (Left)
        doc.text(
          `Received By: ${payment.created_by_name} ${payment.created_by_last_name || ""} (${payment.created_by_role || "Staff"})`,
          50,
          startY,
        );
        doc
          .moveTo(50, startY + 40)
          .lineTo(250, startY + 40)
          .lineWidth(1)
          .strokeColor("#0f172a")
          .stroke();
        doc
          .font("Helvetica")
          .fillColor("#475569")
          .text("Authorized Signature", 50, startY + 45);

        // Client Received By Signature (Right)
        doc
          .font("Helvetica-Bold")
          .fillColor("#0f172a")
          .text("Client Acknowledgment", 345, startY);
        doc
          .moveTo(345, startY + 40)
          .lineTo(545, startY + 40)
          .lineWidth(1)
          .strokeColor("#0f172a")
          .stroke();
        doc
          .font("Helvetica")
          .fillColor("#475569")
          .text("Client Signature over Printed Name", 345, startY + 45);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = PaymentPdfService;
