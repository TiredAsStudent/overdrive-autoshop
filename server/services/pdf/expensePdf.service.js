const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

class ExpensePdfService {
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

  static async generate(expense, settings) {
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

        // --- BACKGROUND WATERMARK (IF REJECTED) ---
        if (expense.status === "REJECTED") {
          doc
            .save()
            .translate(200, 350)
            .rotate(-45, { origin: [0, 0] })
            .fontSize(80)
            .fillColor("#ef4444")
            .opacity(0.1)
            .text("REJECTED", 0, 0, { align: "center", width: 400 })
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
        doc
          .fontSize(16)
          .font("Helvetica-Bold")
          .fillColor(
            expense.status === "REJECTED"
              ? "#ef4444"
              : expense.status === "APPROVED"
                ? "#10b981"
                : "#f59e0b",
          )
          .text("EXPENSE VOUCHER", 300, rightY, { align: "right", width: 245 });
        rightY += 18;

        let statusColor = "#f59e0b"; // Pending/Draft
        if (expense.status === "APPROVED") statusColor = "#10b981";
        if (expense.status === "REJECTED") statusColor = "#ef4444";

        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .fillColor(statusColor)
          .text(expense.status.replace(/_/g, " "), 300, rightY, {
            align: "right",
            width: 245,
          });
        rightY += 14;

        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .fillColor("#0f172a")
          .text(expense.expense_number, 300, rightY, {
            align: "right",
            width: 245,
          });
        rightY += 14;

        doc
          .font("Helvetica")
          .fillColor("#64748b")
          .fontSize(9)
          .text(
            `Date: ${new Date(expense.expense_date || expense.created_at).toLocaleDateString()}`,
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

        // --- 2. ADDRESS & GL BLOCKS ---
        const addressY = startY;

        // Origin Branch (Left)
        doc
          .fontSize(8)
          .font("Helvetica-Bold")
          .fillColor("#94a3b8")
          .text("ORIGINATING BRANCH", 50, addressY);
        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .fillColor("#0f172a")
          .text(expense.branch_name, 50, addressY + 12);

        if (expense.branch_address) {
          doc
            .fontSize(9)
            .font("Helvetica")
            .fillColor("#475569")
            .text(expense.branch_address, 50, addressY + 26, {
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

        doc
          .fontSize(8)
          .font("Helvetica-Bold")
          .fillColor("#94a3b8")
          .text("G/L CLASSIFICATION", 50, addressY + 55);
        doc
          .fontSize(9)
          .font("Helvetica-Bold")
          .fillColor("#0f172a")
          .text(
            `[${expense.account_code}] ${expense.category}`,
            50,
            addressY + 67,
            { width: 220 },
          );

        // Payee/Vendor (Right)
        doc
          .fontSize(8)
          .font("Helvetica-Bold")
          .fillColor("#94a3b8")
          .text("DISBURSED TO (PAYEE)", 300, addressY);
        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .fillColor("#0f172a")
          .text(
            expense.vendor_name || "Unregistered Payee",
            300,
            addressY + 12,
          );

        let custY = addressY + 26;
        if (expense.vendor_contact) {
          doc
            .fontSize(9)
            .font("Helvetica")
            .fillColor("#475569")
            .text(expense.vendor_contact, 300, custY);
          custY += 14;
        }

        if (expense.vendor_address) {
          doc
            .font("Helvetica")
            .text(expense.vendor_address, 300, custY, {
              width: 245,
              lineGap: 2,
            });
          custY += Math.max(
            14,
            doc.heightOfString(expense.vendor_address, { width: 245 }),
          );
        }

        if (expense.vendor_tin) {
          doc
            .font("Helvetica")
            .fillColor("#64748b")
            .text(`TIN: ${expense.vendor_tin}`, 300, custY);
        }

        startY = addressY + 95;

        // --- 3. PARTICULARS MATRIX TABLE ---
        const colX = { desc: 50, method: 250, ref: 350, amt: 460 };
        const colW = { desc: 190, method: 90, ref: 100, amt: 85 };

        doc.roundedRect(50, startY, 495, 22, 4).fill("#f1f5f9");
        doc.fillColor("#475569").font("Helvetica-Bold").fontSize(8);
        const headerY = startY + 6;

        doc.text("PARTICULARS", colX.desc, headerY, {
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
        doc.text("AMOUNT", colX.amt, headerY, {
          width: colW.amt,
          align: "right",
        });

        startY += 30;
        doc.font("Helvetica-Bold").fontSize(9).fillColor("#0f172a");

        // Main Expense Row
        const descriptionText = expense.description || "Operational Expense";
        const methodText = expense.payment_method
          ? expense.payment_method.replace(/_/g, " ")
          : "CASH";
        const refText = expense.reference_number || "N/A";
        const totalAmount = parseFloat(expense.total_amount);

        doc.text(descriptionText, colX.desc, startY, {
          width: colW.desc,
          align: "left",
        });
        const textHeight = Math.max(
          15,
          doc.heightOfString(descriptionText, { width: colW.desc }),
        );

        doc
          .font("Helvetica")
          .text(methodText, colX.method, startY, {
            width: colW.method,
            align: "left",
          });
        doc.text(refText, colX.ref, startY, { width: colW.ref, align: "left" });
        doc
          .font("Helvetica-Bold")
          .text(this.formatCurrency(totalAmount), colX.amt, startY, {
            width: colW.amt,
            align: "right",
          });

        startY += textHeight + 10;
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

        // Subtotal
        doc.font("Helvetica-Bold").fontSize(9).fillColor("#475569");
        doc.text("Subtotal (Net of VAT):", labelX, startY, {
          width: labelW,
          align: "right",
        });
        doc
          .fillColor("#0f172a")
          .text(this.formatCurrency(expense.subtotal), valueX, startY, {
            width: valueW,
            align: "right",
          });
        startY += 18;

        // Input VAT
        doc.font("Helvetica-Bold").fillColor("#475569");
        doc.text(
          `Input VAT ${expense.is_vatable ? "Allocation" : "(Exempt)"}:`,
          labelX,
          startY,
          { width: labelW, align: "right" },
        );
        doc
          .fillColor("#0f172a")
          .text(this.formatCurrency(expense.vat_amount), valueX, startY, {
            width: valueW,
            align: "right",
          });
        startY += 20;

        // Grand Total Box (Amber)
        doc.roundedRect(labelX, startY, 225, 24, 4).fill("#fffbeb");
        doc.fillColor("#d97706").fontSize(10).font("Helvetica-Bold");
        doc.text("GRAND TOTAL:", labelX + 10, startY + 6, {
          width: labelW - 10,
          align: "left",
        });
        doc.text(
          this.formatCurrency(expense.total_amount),
          valueX,
          startY + 6,
          { width: valueW - 10, align: "right" },
        );

        // If REJECTED, draw a strikethrough over the amount
        if (expense.status === "REJECTED") {
          doc
            .moveTo(valueX + 10, startY + 12)
            .lineTo(valueX + valueW, startY + 12)
            .lineWidth(1.5)
            .strokeColor("#ef4444")
            .stroke();
        }

        startY += 50;

        // --- 5. FOOTER, NOTES & AUTHORIZATION ---
        if (startY > 650) {
          doc.addPage();
          startY = 50;
        }

        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .fillColor("#0f172a")
          .text("Staff Justification / Notes:", 50, startY);
        doc
          .fontSize(9)
          .font("Helvetica-Oblique")
          .fillColor("#64748b")
          .text(
            expense.notes || "No operational notes provided.",
            50,
            startY + 15,
            { width: 495, lineGap: 2 },
          );

        if (expense.status === "REJECTED" && expense.rejection_remarks) {
          startY +=
            Math.max(
              doc.heightOfString(expense.notes || " ", { width: 495 }),
              15,
            ) + 25;
          doc
            .fontSize(10)
            .font("Helvetica-Bold")
            .fillColor("#ef4444")
            .text("Manager Rejection Remarks:", 50, startY);
          doc
            .fontSize(9)
            .font("Helvetica-Oblique")
            .fillColor("#ef4444")
            .text(expense.rejection_remarks, 50, startY + 15, {
              width: 495,
              lineGap: 2,
            });
        }

        startY = doc.y + 50;
        if (startY > 740) {
          doc.addPage();
          startY = 50;
        }

        doc.fontSize(9).font("Helvetica-Bold").fillColor("#0f172a");

        // Prepared By Signature (Left)
        doc.text(
          `Prepared By: ${expense.created_by_name} ${expense.created_by_last_name || ""} (${expense.created_by_role || "Staff"})`,
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
          .text("Disbursing Officer / Requester", 50, startY + 45);

        // Authorized By Signature (Right)
        doc.font("Helvetica-Bold").fillColor("#0f172a");
        if (expense.resolved_by_name) {
          doc.text(
            `Approved By: ${expense.resolved_by_name} ${expense.resolved_by_last_name || ""} (${expense.resolved_by_role || "Manager"})`,
            345,
            startY,
          );
        } else {
          doc.text("Authorized By:", 345, startY);
        }

        doc
          .moveTo(345, startY + 40)
          .lineTo(545, startY + 40)
          .lineWidth(1)
          .strokeColor("#0f172a")
          .stroke();
        doc
          .font("Helvetica")
          .fillColor("#475569")
          .text("Manager / Owner Signature", 345, startY + 45);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = ExpensePdfService;
