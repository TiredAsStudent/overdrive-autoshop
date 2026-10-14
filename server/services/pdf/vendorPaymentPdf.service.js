const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

class VendorPaymentPdfService {
  // ISO 4217 Compliant Format
  static formatCurrency(amount) {
    return (
      "PHP " +
      parseFloat(amount || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }

  static formatDate(dateVal) {
    if (!dateVal) return "N/A";
    const str = String(dateVal).split("T")[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [year, month, day] = str.split("-");
      return `${parseInt(month, 10)}/${parseInt(day, 10)}/${year}`;
    }
    return new Date(dateVal).toLocaleDateString("en-US");
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

        // ROW 2: Logo (Left) and Document Meta (Right)
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
        const statusColor = payment.status === "VOID" ? "#ef4444" : "#10b981";
        const displayStatus =
          payment.status === "VOID" ? "VOIDED" : "COMPLETED";

        doc
          .fontSize(16)
          .font("Helvetica-Bold")
          .fillColor(statusColor)
          .text("DISBURSEMENT VOUCHER", 200, rightY, {
            align: "right",
            width: 345,
          });
        rightY += 18;

        doc
          .fontSize(9)
          .font("Helvetica-Bold")
          .fillColor("#64748b")
          .text("(AP LIQUIDATION & PAYMENT RECEIPT)", 200, rightY, {
            align: "right",
            width: 345,
          });
        rightY += 14;

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
            `Date: ${this.formatDate(payment.payment_date || payment.created_at)}`,
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

        // --- 2. ADDRESS & REFERENCE BLOCKS ---
        const addressY = startY;

        // Disbursing Branch (Left)
        doc
          .fontSize(8)
          .font("Helvetica-Bold")
          .fillColor("#94a3b8")
          .text("DISBURSING BRANCH", 50, addressY);
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

        // Vendor / Payee Info (Right)
        doc
          .fontSize(8)
          .font("Helvetica-Bold")
          .fillColor("#94a3b8")
          .text("PAID TO (SUPPLIER / PAYEE)", 300, addressY);
        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .fillColor("#0f172a")
          .text(payment.vendor_name, 300, addressY + 12);

        let vendY = addressY + 26;
        if (payment.vendor_contact_person) {
          doc
            .fontSize(9)
            .font("Helvetica")
            .fillColor("#475569")
            .text(`Attn: ${payment.vendor_contact_person}`, 300, vendY);
          vendY += 14;
        }

        if (payment.vendor_contact) {
          doc
            .fontSize(9)
            .font("Helvetica")
            .fillColor("#475569")
            .text(`Phone: ${payment.vendor_contact}`, 300, vendY);
          vendY += 14;
        }

        if (payment.vendor_address) {
          doc
            .fontSize(9)
            .font("Helvetica")
            .fillColor("#475569")
            .text(payment.vendor_address, 300, vendY, {
              width: 245,
              lineGap: 2,
            });
          vendY += Math.max(
            14,
            doc.heightOfString(payment.vendor_address, { width: 245 }),
          );
        }

        if (payment.vendor_tin) {
          doc
            .fontSize(9)
            .font("Helvetica")
            .fillColor("#64748b")
            .text(
              `TIN: ${payment.vendor_tin} ${payment.is_vat_registered ? "(VAT Registered)" : "(Non-VAT)"}`,
              300,
              vendY,
            );
        }

        startY = Math.max(addressY + 95, vendY + 20);

        // References Highlight Bar
        doc
          .roundedRect(50, startY, 495, 26, 4)
          .fill("#f8fafc")
          .stroke("#e2e8f0");
        doc
          .fillColor("#475569")
          .fontSize(8)
          .font("Helvetica-Bold")
          .text("TARGET SUPPLIER BILL:", 60, startY + 9);
        doc
          .fillColor("#0f172a")
          .fontSize(9)
          .text(payment.bill_number, 185, startY + 8.5);

        doc
          .fillColor("#475569")
          .fontSize(8)
          .font("Helvetica-Bold")
          .text("VENDOR INVOICE / O.R. NO:", 310, startY + 9);
        doc
          .fillColor("#0f172a")
          .fontSize(9)
          .text(payment.vendor_invoice_number || "N/A", 440, startY + 8.5);

        startY += 45;

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
        doc.text("AMOUNT PAID", colX.amt, headerY, {
          width: colW.amt,
          align: "right",
        });

        startY += 30;
        doc.font("Helvetica-Bold").fontSize(9).fillColor("#0f172a");

        // Main Disbursement Row
        const descriptionText = `Disbursement applied to Bill ${payment.bill_number}`;
        const methodText = payment.payment_method
          ? payment.payment_method.replace(/_/g, " ")
          : "CASH";
        const refText = payment.reference_number || "N/A";
        const amtApplied = parseFloat(payment.amount_paid || 0);

        doc.text(descriptionText, colX.desc, startY, {
          width: colW.desc,
          align: "left",
        });
        doc.font("Helvetica").text(methodText, colX.method, startY, {
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

        // --- 4. TOTALS & AP LIQUIDATION SUMMARY ---
        const labelX = 320;
        const labelW = 130;
        const valueX = 460;
        const valueW = 85;

        const billTotal = parseFloat(payment.bill_total || 0);
        const totalPaidOnBill = parseFloat(payment.bill_amount_paid || 0);
        const previouslyPaid =
          payment.prior_amount_paid !== undefined
            ? parseFloat(payment.prior_amount_paid || 0)
            : payment.status === "VOID"
              ? totalPaidOnBill
              : Math.max(0, totalPaidOnBill - amtApplied);
        const currentBalance = Math.max(0, billTotal - totalPaidOnBill);

        // Associated Bill Total
        doc.font("Helvetica-Bold").fontSize(9).fillColor("#475569");
        doc.text("Associated Bill Total:", labelX, startY, {
          width: labelW,
          align: "right",
        });
        doc
          .fillColor("#0f172a")
          .text(this.formatCurrency(billTotal), valueX, startY, {
            width: valueW,
            align: "right",
          });
        startY += 18;

        // Previously Paid
        if (previouslyPaid > 0) {
          doc.font("Helvetica").fontSize(9).fillColor("#64748b");
          doc.text("Less: Previously Paid:", labelX, startY, {
            width: labelW,
            align: "right",
          });
          doc.text(`(${this.formatCurrency(previouslyPaid)})`, valueX, startY, {
            width: valueW,
            align: "right",
          });
          startY += 18;
        }

        // Amount Paid Box
        doc
          .roundedRect(labelX, startY, 225, 24, 4)
          .fill(payment.status === "VOID" ? "#fef2f2" : "#ecfdf5");
        doc
          .fillColor(payment.status === "VOID" ? "#ef4444" : "#10b981")
          .fontSize(10)
          .font("Helvetica-Bold");
        doc.text("AMOUNT PAID:", labelX + 10, startY + 6, {
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

        startY += 32;

        // Remaining Bill Balance
        doc.font("Helvetica-Bold").fontSize(9).fillColor("#64748b");
        doc.text("Current Bill Balance:", labelX, startY, {
          width: labelW,
          align: "right",
        });
        doc
          .fillColor(currentBalance > 0 ? "#ef4444" : "#10b981")
          .text(this.formatCurrency(currentBalance), valueX, startY, {
            width: valueW,
            align: "right",
          });

        startY += 50;

        // --- 5. FOOTER & SIGNATURES ---
        if (startY > 680) {
          doc.addPage();
          startY = 50;
        }

        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .fillColor("#0f172a")
          .text("Disbursement Notes:", 50, startY);
        doc
          .fontSize(9)
          .font("Helvetica-Oblique")
          .fillColor("#64748b")
          .text(
            payment.notes ||
              "Official Accounts Payable liquidation and disbursement voucher.",
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

        // Disbursed / Authorized By Signature (Left)
        const preparerName = payment.created_by_name
          ? `${payment.created_by_name} ${payment.created_by_last_name || ""}`.trim()
          : "System";
        doc.text(
          `Disbursed By: ${preparerName} (${payment.created_by_role || "Manager"})`,
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
          .text("Authorized Disbursing Signature", 50, startY + 45);

        // Vendor / Payee Received By Signature (Right)
        doc
          .font("Helvetica-Bold")
          .fillColor("#0f172a")
          .text("Payee Acknowledgment", 345, startY);
        doc
          .moveTo(345, startY + 40)
          .lineTo(545, startY + 40)
          .lineWidth(1)
          .strokeColor("#0f172a")
          .stroke();
        doc
          .font("Helvetica")
          .fillColor("#475569")
          .text("Vendor / Payee Signature over Printed Name", 345, startY + 45);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = VendorPaymentPdfService;
