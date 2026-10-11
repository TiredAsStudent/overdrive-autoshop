const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

class BillPdfService {
  static formatCurrency(amount) {
    return (
      "PHP " +
      parseFloat(amount).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }

  static async generate(bill, settings) {
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

        // --- BACKGROUND WATERMARK (SECURITY PROTOCOL) ---
        if (bill.status === "PENDING_RECEIPT") {
          doc
            .save()
            .translate(200, 350)
            .rotate(-45, { origin: [0, 0] })
            .fontSize(65)
            .fillColor("#f59e0b")
            .opacity(0.1)
            .text("PENDING RECEIPT", 0, 0, { align: "center", width: 400 })
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

        // ROW 2: Logo & Meta
        const row2StartY = currentY;
        let rightY = row2StartY;

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
        let titleColor = "#3b82f6";
        if (bill.payment_status === "PAID") titleColor = "#10b981";

        doc
          .fontSize(16)
          .font("Helvetica-Bold")
          .fillColor(titleColor)
          .text("ACCOUNTS PAYABLE VOUCHER", 200, rightY, {
            align: "right",
            width: 345,
          });
        rightY += 18;

        doc
          .fontSize(9)
          .font("Helvetica-Bold")
          .fillColor("#64748b")
          .text("(SUPPLIER BILL & RECEIVING SLIP)", 200, rightY, {
            align: "right",
            width: 345,
          });
        rightY += 16;

        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .fillColor("#0f172a")
          .text(bill.bill_number, 300, rightY, { align: "right", width: 245 });
        rightY += 14;

        doc
          .font("Helvetica")
          .fillColor("#64748b")
          .fontSize(9)
          .text(
            `Bill Date: ${new Date(bill.bill_date).toLocaleDateString()}`,
            300,
            rightY,
            { align: "right", width: 245 },
          );
        rightY += 12;

        if (bill.due_date) {
          doc
            .fillColor(
              bill.payment_status === "UNPAID" &&
                new Date(bill.due_date) < new Date()
                ? "#ef4444"
                : "#64748b",
            )
            .text(
              `Due Date: ${new Date(bill.due_date).toLocaleDateString()}`,
              300,
              rightY,
              { align: "right", width: 245 },
            );
          rightY += 12;
        }

        let startY = Math.max(row2StartY + 85, rightY + 15);

        doc
          .moveTo(50, startY)
          .lineTo(545, startY)
          .lineWidth(1)
          .strokeColor("#e2e8f0")
          .stroke();
        startY += 20;

        // --- 2. ADDRESS & REFERENCE BLOCKS ---
        const addressY = startY;

        doc
          .fontSize(8)
          .font("Helvetica-Bold")
          .fillColor("#94a3b8")
          .text("RECEIVING BRANCH", 50, addressY);
        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .fillColor("#0f172a")
          .text(bill.branch_name, 50, addressY + 12);

        if (bill.branch_address) {
          doc
            .fontSize(9)
            .font("Helvetica")
            .fillColor("#475569")
            .text(bill.branch_address, 50, addressY + 26, {
              width: 220,
              lineGap: 2,
            });
        }

        doc
          .fontSize(8)
          .font("Helvetica-Bold")
          .fillColor("#94a3b8")
          .text("SUPPLIER INFORMATION", 300, addressY);
        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .fillColor("#0f172a")
          .text(bill.vendor_name, 300, addressY + 12);

        let custY = addressY + 26;
        if (bill.vendor_contact) {
          doc
            .fontSize(9)
            .font("Helvetica")
            .fillColor("#475569")
            .text(`Phone: ${bill.vendor_contact}`, 300, custY);
          custY += 14;
        }
        if (bill.vendor_address) {
          doc
            .font("Helvetica")
            .text(bill.vendor_address, 300, custY, { width: 245, lineGap: 2 });
          custY += Math.max(
            14,
            doc.heightOfString(bill.vendor_address, { width: 245 }),
          );
        }
        if (bill.vendor_tin) {
          doc
            .font("Helvetica")
            .fillColor("#64748b")
            .text(
              `TIN: ${bill.vendor_tin} ${bill.is_vat_registered ? "(VAT Registered)" : "(Non-VAT)"}`,
              300,
              custY,
            );
        }

        startY = addressY + 95;

        // References Block
        doc
          .roundedRect(50, startY, 495, 26, 4)
          .fill("#f8fafc")
          .stroke("#e2e8f0");
        doc
          .fillColor("#475569")
          .fontSize(8)
          .font("Helvetica-Bold")
          .text("VENDOR INVOICE / O.R. NO:", 60, startY + 9);
        doc
          .fillColor("#0f172a")
          .fontSize(9)
          .text(bill.vendor_invoice_number, 200, startY + 8.5);

        doc
          .fillColor("#475569")
          .fontSize(8)
          .font("Helvetica-Bold")
          .text("SOURCE PURCHASE ORDER:", 310, startY + 9);
        doc
          .fillColor("#0f172a")
          .fontSize(9)
          .text(bill.purchase_order_number, 440, startY + 8.5);

        startY += 45;

        // --- 3. ITEMS TABLE ---
        const colX = {
          sku: 50,
          desc: 120,
          qty: 320,
          price: 370,
          disc: 430,
          net: 485,
        };
        const colW = {
          sku: 60,
          desc: 190,
          qty: 40,
          price: 50,
          disc: 45,
          net: 60,
        };

        doc.roundedRect(50, startY, 495, 22, 4).fill("#f1f5f9");
        doc.fillColor("#475569").font("Helvetica-Bold").fontSize(8);
        const headerY = startY + 6;

        doc.text("SKU", colX.sku, headerY, { width: colW.sku, align: "left" });
        doc.text("ITEM DESCRIPTION", colX.desc, headerY, {
          width: colW.desc,
          align: "left",
        });
        doc.text("QTY", colX.qty, headerY, {
          width: colW.qty,
          align: "center",
        });
        doc.text("UNIT COST", colX.price, headerY, {
          width: colW.price,
          align: "right",
        });
        doc.text("DISC.", colX.disc, headerY, {
          width: colW.disc,
          align: "right",
        });
        doc.text("NET TOTAL", colX.net, headerY, {
          width: colW.net,
          align: "right",
        });

        startY += 30;
        doc.font("Helvetica").fontSize(9).fillColor("#0f172a");

        bill.items.forEach((item, index) => {
          const cost = parseFloat(item.recorded_unit_cost);
          const qty = parseInt(item.quantity_received, 10);
          const disc = parseFloat(item.discount_amount);
          const net = cost * qty - disc;

          if (startY > 700) {
            doc.addPage();
            startY = 50;
          }

          doc.text(item.sku, colX.sku, startY, {
            width: colW.sku,
            align: "left",
          });
          doc.text(item.item_name, colX.desc, startY, {
            width: colW.desc,
            align: "left",
          });
          doc.text(`${qty} ${item.uom}`, colX.qty, startY, {
            width: colW.qty,
            align: "center",
          });
          doc.text(this.formatCurrency(cost), colX.price, startY, {
            width: colW.price,
            align: "right",
          });

          if (disc > 0) {
            doc
              .fillColor("#ef4444")
              .text(`-${this.formatCurrency(disc)}`, colX.disc, startY, {
                width: colW.disc,
                align: "right",
              })
              .fillColor("#0f172a");
          } else {
            doc
              .fillColor("#94a3b8")
              .text("-", colX.disc, startY, {
                width: colW.disc,
                align: "right",
              })
              .fillColor("#0f172a");
          }

          doc
            .font("Helvetica-Bold")
            .text(this.formatCurrency(net), colX.net, startY, {
              width: colW.net,
              align: "right",
            })
            .font("Helvetica");

          startY +=
            Math.max(
              doc.heightOfString(item.item_name, { width: colW.desc }),
              15,
            ) + 10;

          if (index < bill.items.length - 1) {
            doc
              .moveTo(50, startY - 5)
              .lineTo(545, startY - 5)
              .lineWidth(0.5)
              .strokeColor("#f1f5f9")
              .stroke();
          }
        });

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

        doc.font("Helvetica-Bold").fontSize(9).fillColor("#475569");
        doc.text("Subtotal (Net of VAT):", labelX, startY, {
          width: labelW,
          align: "right",
        });
        doc
          .fillColor("#0f172a")
          .text(this.formatCurrency(bill.subtotal), valueX, startY, {
            width: valueW,
            align: "right",
          });
        startY += 18;

        // FRS COMPLIANCE: Display explicit Tax Percentage if VAT Registered
        doc
          .fillColor("#475569")
          .text(
            `Input VAT ${bill.is_vat_registered ? `(${parseFloat(settings?.vat_percentage || 12)}%)` : "(Exempt)"}:`,
            labelX,
            startY,
            { width: labelW, align: "right" },
          );
        doc
          .fillColor("#0f172a")
          .text(this.formatCurrency(bill.vat_amount), valueX, startY, {
            width: valueW,
            align: "right",
          });
        startY += 20;

        // Grand Total Box
        doc.roundedRect(labelX, startY, 225, 24, 4).fill("#f1f5f9");
        doc.fillColor("#0f172a").fontSize(10).font("Helvetica-Bold");
        doc.text("GRAND TOTAL:", labelX + 10, startY + 6, {
          width: labelW - 10,
          align: "left",
        });
        doc.text(this.formatCurrency(bill.grand_total), valueX, startY + 6, {
          width: valueW - 10,
          align: "right",
        });
        startY += 30;

        // Ledger / Payments Deduction
        const amountPaid = parseFloat(bill.amount_paid || 0);
        if (amountPaid > 0) {
          doc.font("Helvetica").fontSize(9).fillColor("#10b981");
          doc.text("Less: Payments Applied:", labelX, startY, {
            width: labelW,
            align: "right",
          });
          doc.text(`(${this.formatCurrency(amountPaid)})`, valueX, startY, {
            width: valueW,
            align: "right",
          });
          startY += 20;
        }

        // Balance Due Highlighted Box
        const balanceDue = parseFloat(bill.grand_total) - amountPaid;
        doc.roundedRect(labelX, startY, 225, 30, 4).fill("#fffbeb");
        doc
          .fillColor(balanceDue > 0 ? "#b91c1c" : "#10b981")
          .fontSize(11)
          .font("Helvetica-Bold");
        doc.text("BALANCE DUE:", labelX + 10, startY + 9, {
          width: labelW - 10,
          align: "left",
        });
        doc.text(this.formatCurrency(balanceDue), valueX, startY + 9, {
          width: valueW - 10,
          align: "right",
        });

        startY += 50;

        // --- 5. FOOTER & APPROVAL SIGNATURES ---
        if (startY > 650) {
          doc.addPage();
          startY = 50;
        }

        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .fillColor("#0f172a")
          .text("Accounts Payable Notes:", 50, startY);
        doc
          .fontSize(9)
          .font("Helvetica-Oblique")
          .fillColor("#64748b")
          .text(bill.notes || "Standard AP processing.", 50, startY + 15, {
            width: 495,
            lineGap: 2,
          });

        startY = doc.y + 50;
        if (startY > 740) {
          doc.addPage();
          startY = 50;
        }

        doc.fontSize(9).font("Helvetica-Bold").fillColor("#0f172a");

        // Staff Signatory
        const reqName = bill.created_by_name
          ? `${bill.created_by_name} ${bill.created_by_last_name || ""}`.trim()
          : "System";
        doc.text(
          `Received & Checked By: ${reqName} (${bill.created_by_role || "Staff"})`,
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
          .text("Branch Receiving Officer Signature", 50, startY + 45);

        // Managerial Signatory
        doc.font("Helvetica-Bold").fillColor("#0f172a");
        doc.text("Approved for Payment:", 345, startY);
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

module.exports = BillPdfService;
