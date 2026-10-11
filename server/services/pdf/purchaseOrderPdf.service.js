const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

class PurchaseOrderPdfService {
  static formatCurrency(amount) {
    return (
      "PHP " +
      parseFloat(amount).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }

  static async generate(po, settings) {
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
        // Prevent unauthorized procurement by watermarking non-actionable POs
        if (po.status !== "APPROVED" && po.status !== "CLOSED") {
          let watermarkText = "UNAPPROVED";
          let watermarkColor = "#f59e0b"; // Amber

          if (po.status === "REJECTED" || po.status === "CANCELLED") {
            watermarkText = po.status;
            watermarkColor = "#ef4444"; // Red
          }

          doc
            .save()
            .translate(200, 350)
            .rotate(-45, { origin: [0, 0] })
            .fontSize(65)
            .fillColor(watermarkColor)
            .opacity(0.1)
            .text(watermarkText, 0, 0, { align: "center", width: 400 })
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
        let titleColor = "#f59e0b";
        if (po.status === "APPROVED" || po.status === "CLOSED")
          titleColor = "#10b981";
        if (po.status === "REJECTED" || po.status === "CANCELLED")
          titleColor = "#ef4444";

        doc
          .fontSize(16)
          .font("Helvetica-Bold")
          .fillColor(titleColor)
          .text("PURCHASE ORDER", 300, rightY, { align: "right", width: 245 });
        rightY += 18;

        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .fillColor(titleColor)
          .text(po.status.replace(/_/g, " "), 300, rightY, {
            align: "right",
            width: 245,
          });
        rightY += 14;

        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .fillColor("#0f172a")
          .text(po.purchase_order_number, 300, rightY, {
            align: "right",
            width: 245,
          });
        rightY += 14;

        doc
          .font("Helvetica")
          .fillColor("#64748b")
          .fontSize(9)
          .text(
            `Order Date: ${new Date(po.created_at).toLocaleDateString()}`,
            300,
            rightY,
            { align: "right", width: 245 },
          );
        rightY += 12;

        doc
          .fillColor("#ef4444")
          .text(
            `Expected Delivery: ${new Date(po.expected_delivery_date).toLocaleDateString()}`,
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

        // Delivery Destination (Left)
        doc
          .fontSize(8)
          .font("Helvetica-Bold")
          .fillColor("#94a3b8")
          .text("DELIVER TO (BRANCH)", 50, addressY);
        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .fillColor("#0f172a")
          .text(po.branch_name, 50, addressY + 12);

        if (po.branch_address) {
          doc
            .fontSize(9)
            .font("Helvetica")
            .fillColor("#475569")
            .text(po.branch_address, 50, addressY + 26, {
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

        // Target Vendor (Right)
        doc
          .fontSize(8)
          .font("Helvetica-Bold")
          .fillColor("#94a3b8")
          .text("VENDOR / SUPPLIER", 300, addressY);
        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .fillColor("#0f172a")
          .text(po.vendor_name, 300, addressY + 12);

        let custY = addressY + 26;
        if (po.vendor_contact) {
          doc
            .fontSize(9)
            .font("Helvetica")
            .fillColor("#475569")
            .text(`Phone: ${po.vendor_contact}`, 300, custY);
          custY += 14;
        }

        if (po.vendor_address) {
          doc
            .font("Helvetica")
            .text(po.vendor_address, 300, custY, { width: 245, lineGap: 2 });
          custY += Math.max(
            14,
            doc.heightOfString(po.vendor_address, { width: 245 }),
          );
        }

        if (po.vendor_tin) {
          doc
            .font("Helvetica")
            .fillColor("#64748b")
            .text(
              `TIN: ${po.vendor_tin} ${po.is_vat_registered ? "(VAT Registered)" : "(Non-VAT)"}`,
              300,
              custY,
            );
        }

        startY = addressY + 90;

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

        po.items.forEach((item, index) => {
          const cost = parseFloat(item.recorded_unit_cost);
          const qty = parseInt(item.quantity, 10);
          const disc = parseFloat(item.discount_amount);
          const net = cost * qty - disc;

          if (startY > 720) {
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

          if (index < po.items.length - 1) {
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
        doc.text("Subtotal (Gross):", labelX, startY, {
          width: labelW,
          align: "right",
        });
        doc
          .fillColor("#0f172a")
          .text(this.formatCurrency(po.subtotal), valueX, startY, {
            width: valueW,
            align: "right",
          });
        startY += 18;

        doc
          .fillColor("#475569")
          .text(
            `VAT Allocation ${po.is_vat_registered ? `(${parseFloat(settings?.vat_percentage || 12)}%)` : "(Exempt)"}:`,
            labelX,
            startY,
            { width: labelW, align: "right" },
          );
        doc
          .fillColor("#0f172a")
          .text(this.formatCurrency(po.vat_amount), valueX, startY, {
            width: valueW,
            align: "right",
          });
        startY += 20;

        doc.roundedRect(labelX, startY, 225, 24, 4).fill("#fffbeb");
        doc.fillColor("#d97706").fontSize(10).font("Helvetica-Bold");
        doc.text("GRAND TOTAL:", labelX + 10, startY + 6, {
          width: labelW - 10,
          align: "left",
        });
        doc.text(this.formatCurrency(po.grand_total), valueX, startY + 6, {
          width: valueW - 10,
          align: "right",
        });

        // If Cancelled/Rejected, strike through the amount
        if (po.status === "REJECTED" || po.status === "CANCELLED") {
          doc
            .moveTo(valueX + 10, startY + 12)
            .lineTo(valueX + valueW, startY + 12)
            .lineWidth(1.5)
            .strokeColor("#ef4444")
            .stroke();
        }

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
          .text("Procurement Notes / Instructions:", 50, startY);
        doc
          .fontSize(9)
          .font("Helvetica-Oblique")
          .fillColor("#64748b")
          .text(po.notes || "Standard vendor terms apply.", 50, startY + 15, {
            width: 495,
            lineGap: 2,
          });

        if (
          (po.status === "REJECTED" || po.status === "APPROVED") &&
          po.approval_remarks
        ) {
          startY +=
            Math.max(doc.heightOfString(po.notes || " ", { width: 495 }), 15) +
            25;
          doc
            .fontSize(10)
            .font("Helvetica-Bold")
            .fillColor(po.status === "REJECTED" ? "#ef4444" : "#10b981")
            .text("Managerial Feedback:", 50, startY);
          doc
            .fontSize(9)
            .font("Helvetica-Oblique")
            .fillColor(po.status === "REJECTED" ? "#ef4444" : "#10b981")
            .text(po.approval_remarks, 50, startY + 15, {
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

        // Prepared By (Left)
        doc.text(
          `Requisitioned By: ${po.created_by_name} ${po.created_by_last_name || ""} (${po.created_by_role || "Staff"})`,
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
          .text("Branch Officer Signature", 50, startY + 45);

        // Authorized By (Right)
        doc.font("Helvetica-Bold").fillColor("#0f172a");
        if (po.resolved_by_name) {
          let managerActionText = "Reviewed By:";
          if (po.status === "APPROVED" || po.status === "CLOSED")
            managerActionText = "Approved By:";
          if (po.status === "REJECTED") managerActionText = "Rejected By:";

          doc.text(
            `${managerActionText} ${po.resolved_by_name} ${po.resolved_by_last_name || ""} (${po.resolved_by_role || "Manager"})`,
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

module.exports = PurchaseOrderPdfService;
