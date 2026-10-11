const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

class EstimatePdfService {
  static formatCurrency(amount) {
    return (
      "PHP " +
      parseFloat(amount).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }

  static async generate(estimate, settings) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: "A4" });
        const buffers = [];

        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => resolve(Buffer.concat(buffers)));

        // --- 1. HEADER SECTION ---
        let startY = 50;
        let logoRendered = false;

        if (settings?.logo_url) {
          const cleanLogoUrl = settings.logo_url.replace(/^\//, "");
          const logoPath = path.join(process.cwd(), cleanLogoUrl);

          if (fs.existsSync(logoPath)) {
            try {
              doc.image(logoPath, 50, 45, { width: 60 });
              doc
                .fontSize(20)
                .font("Helvetica-Bold")
                .text(settings.company_name || "Overdrive Auto Shop", 120, 55);
              doc
                .fontSize(10)
                .font("Helvetica")
                .fillColor("#64748b")
                .text(
                  `Phone: ${settings.contact_number || "N/A"} | Email: ${settings.contact_email || "N/A"}`,
                  120,
                  80,
                );
              startY = 120;
              logoRendered = true;
            } catch (imgError) {
              console.warn(
                "PDF Engine: Logo exists but is corrupted. Falling back to text.",
              );
            }
          }
        }

        if (!logoRendered) {
          doc
            .fontSize(24)
            .font("Helvetica-Bold")
            .fillColor("#0f172a")
            .text(settings?.company_name || "Overdrive Auto Shop", 50, 50);
          doc
            .fontSize(10)
            .font("Helvetica")
            .fillColor("#64748b")
            .text(
              `Phone: ${settings?.contact_number || "N/A"} | Email: ${settings?.contact_email || "N/A"}`,
              50,
              80,
            );
          startY = 110;
        }

        // Document Meta (Right Aligned)
        doc
          .fontSize(16)
          .font("Helvetica-Bold")
          .fillColor("#f59e0b")
          .text("OFFICIAL ESTIMATE", 0, 50, { align: "right" });
        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .fillColor("#0f172a")
          .text(`Doc Number: ${estimate.estimate_number}`, 0, 70, {
            align: "right",
          });
        doc
          .font("Helvetica")
          .text(
            `Date: ${new Date(estimate.created_at).toLocaleDateString()}`,
            0,
            85,
            { align: "right" },
          );
        doc
          .fillColor("#ef4444")
          .text(
            `Valid Until: ${new Date(estimate.valid_until).toLocaleDateString()}`,
            0,
            100,
            { align: "right" },
          );

        doc
          .moveTo(50, startY)
          .lineTo(545, startY)
          .strokeColor("#e2e8f0")
          .stroke();

        // --- 2. ADDRESS BLOCK ---
        startY += 20;

        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .fillColor("#94a3b8")
          .text("SERVICE BRANCH", 50, startY);
        doc
          .font("Helvetica-Bold")
          .fillColor("#0f172a")
          .text(
            `${estimate.branch_name} [${estimate.branch_code}]`,
            50,
            startY + 15,
          );
        doc
          .font("Helvetica")
          .text(
            estimate.branch_address || "Address not provided",
            50,
            startY + 30,
            {
              width: 200,
            },
          );

        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .fillColor("#94a3b8")
          .text("PREPARED FOR", 300, startY);
        doc
          .font("Helvetica-Bold")
          .fillColor("#0f172a")
          .text(
            `${estimate.customer_name} (${estimate.customer_code})`,
            300,
            startY + 15,
          );
        doc
          .font("Helvetica")
          .text(`Phone: ${estimate.contact_number}`, 300, startY + 30);
        doc.text(
          estimate.customer_address || "Address not provided",
          300,
          startY + 45,
          { width: 245 },
        );

        // --- 3. ITEMS TABLE ---
        startY += 80;

        doc.rect(50, startY, 495, 20).fill("#f8fafc");
        doc.fillColor("#475569").font("Helvetica-Bold").fontSize(9);
        doc.text("TYPE", 55, startY + 5, { width: 50 });
        doc.text("DESCRIPTION", 110, startY + 5, { width: 190 });
        doc.text("QTY", 300, startY + 5, { width: 40, align: "center" });
        doc.text("PRICE", 340, startY + 5, { width: 70, align: "right" });
        doc.text("DISC.", 410, startY + 5, { width: 50, align: "right" });
        doc.text("NET TOTAL", 460, startY + 5, { width: 80, align: "right" });

        startY += 25;
        doc.font("Helvetica").fontSize(9).fillColor("#0f172a");

        estimate.items.forEach((item) => {
          const isService = item.line_type === "SERVICE";
          const desc = isService ? item.service_name : item.item_name;
          const price = parseFloat(item.recorded_selling_price);
          const qty = item.quantity;
          const disc = parseFloat(item.discount_amount);
          const net = price * qty - disc;

          if (startY > 700) {
            doc.addPage();
            startY = 50;
          }

          doc.text(item.line_type, 55, startY, { width: 50 });
          doc.text(desc, 110, startY, { width: 180 });
          doc.text(qty.toString(), 300, startY, { width: 40, align: "center" });
          doc.text(this.formatCurrency(price), 340, startY, {
            width: 70,
            align: "right",
          });
          doc.text(this.formatCurrency(disc), 410, startY, {
            width: 50,
            align: "right",
          });
          doc.text(this.formatCurrency(net), 460, startY, {
            width: 80,
            align: "right",
          });

          startY += 20;
        });

        doc
          .moveTo(50, startY)
          .lineTo(545, startY)
          .strokeColor("#e2e8f0")
          .stroke();

        // --- 4. TOTALS SECTION ---
        startY += 10;
        doc.font("Helvetica-Bold").fontSize(10);

        doc.text("Subtotal (Gross):", 340, startY, {
          width: 110,
          align: "right",
        });
        doc.text(this.formatCurrency(estimate.subtotal), 450, startY, {
          width: 90,
          align: "right",
        });
        startY += 15;

        if (parseFloat(estimate.total_discount) > 0) {
          doc.fillColor("#ef4444");
          doc.text("Total Discounts:", 340, startY, {
            width: 110,
            align: "right",
          });
          doc.text(
            `(${this.formatCurrency(estimate.total_discount)})`,
            450,
            startY,
            {
              width: 90,
              align: "right",
            },
          );
          startY += 15;
        }

        doc.fillColor("#0f172a");
        doc.text(
          `VAT (${parseFloat(settings?.vat_percentage || 12)}%):`,
          340,
          startY,
          { width: 110, align: "right" },
        );
        doc.text(this.formatCurrency(estimate.vat_amount), 450, startY, {
          width: 90,
          align: "right",
        });
        startY += 20;

        doc.rect(340, startY, 205, 25).fill("#fffbeb");
        doc.fillColor("#d97706").fontSize(12);
        doc.text("GRAND TOTAL:", 345, startY + 6, {
          width: 100,
          align: "left",
        });
        doc.text(this.formatCurrency(estimate.grand_total), 445, startY + 6, {
          width: 95,
          align: "right",
        });

        // --- 5. FOOTER & TERMS ---
        startY += 50;
        if (startY > 650) {
          doc.addPage();
          startY = 50;
        }

        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .fillColor("#0f172a")
          .text("Terms & Conditions:");
        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor("#64748b")
          .text(
            estimate.terms_conditions || "Standard shop terms apply.",
            50,
            startY + 15,
            { width: 495 },
          );

        // Signatures
        startY += 60;
        doc
          .fontSize(9)
          .font("Helvetica-Bold")
          .fillColor("#0f172a")
          .text(
            `Prepared By: ${estimate.created_by_name} (${estimate.created_by_role})`,
            50,
            startY,
          );
        doc
          .moveTo(50, startY + 30)
          .lineTo(250, startY + 30)
          .strokeColor("#0f172a")
          .stroke();
        doc.font("Helvetica").text("Authorized Signature", 50, startY + 35);

        doc.font("Helvetica-Bold").text("Client Acknowledgment", 350, startY);
        doc
          .moveTo(350, startY + 30)
          .lineTo(545, startY + 30)
          .strokeColor("#0f172a")
          .stroke();
        doc
          .font("Helvetica")
          .text("Client Signature over Printed Name", 350, startY + 35);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = EstimatePdfService;
