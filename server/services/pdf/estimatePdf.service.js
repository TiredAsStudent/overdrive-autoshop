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
        const doc = new PDFDocument({
          margin: 50,
          size: "A4",
          bufferPages: true,
        });
        const buffers = [];

        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => resolve(Buffer.concat(buffers)));

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
              console.warn(
                "PDF Engine: Logo exists but is corrupted. Skipping logo.",
              );
            }
          }
        }

        // RIGHT SIDE: Document Title & Meta
        doc
          .fontSize(16)
          .font("Helvetica-Bold")
          .fillColor("#f59e0b")
          .text("OFFICIAL ESTIMATE", 300, rightY, {
            align: "right",
            width: 245,
          });
        rightY += 18;

        let statusColor = "#64748b";
        if (estimate.status === "APPROVED" || estimate.status === "CONVERTED")
          statusColor = "#10b981";
        if (estimate.status === "PENDING_APPROVAL") statusColor = "#f59e0b";
        if (estimate.status === "REJECTED" || estimate.status === "EXPIRED")
          statusColor = "#ef4444";

        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .fillColor(statusColor)
          .text(estimate.status.replace(/_/g, " "), 300, rightY, {
            align: "right",
            width: 245,
          });
        rightY += 14;

        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .fillColor("#0f172a")
          .text(estimate.estimate_number, 300, rightY, {
            align: "right",
            width: 245,
          });
        rightY += 14;

        doc
          .font("Helvetica")
          .fillColor("#64748b")
          .fontSize(9)
          .text(
            `Date: ${new Date(estimate.created_at).toLocaleDateString()}`,
            300,
            rightY,
            { align: "right", width: 245 },
          );
        rightY += 12;

        doc
          .fillColor("#ef4444")
          .text(
            `Valid Until: ${new Date(estimate.valid_until).toLocaleDateString()}`,
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
          .text(estimate.branch_name, 50, addressY + 12);

        if (estimate.branch_address) {
          doc
            .fontSize(9)
            .font("Helvetica")
            .fillColor("#475569")
            .text(estimate.branch_address, 50, addressY + 26, {
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
          .text("PREPARED FOR", 300, addressY);
        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .fillColor("#0f172a")
          .text(estimate.customer_name, 300, addressY + 12);

        let custY = addressY + 26;
        if (estimate.contact_number) {
          doc
            .fontSize(9)
            .font("Helvetica")
            .fillColor("#475569")
            .text(estimate.contact_number, 300, custY);
          custY += 14;
        }

        if (estimate.customer_address) {
          doc.font("Helvetica").text(estimate.customer_address, 300, custY, {
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

        // --- 3. ITEMS TABLE ---
        const colX = {
          type: 50,
          desc: 100,
          qty: 290,
          price: 330,
          disc: 405,
          net: 465,
        };
        const colW = {
          type: 40,
          desc: 180,
          qty: 30,
          price: 65,
          disc: 50,
          net: 80,
        };

        // Table Header Background (Modern Rounded Rectangle)
        doc.roundedRect(50, startY, 495, 22, 4).fill("#f1f5f9");

        // Table Header Text
        doc.fillColor("#475569").font("Helvetica-Bold").fontSize(8);
        const headerY = startY + 6;
        doc.text("TYPE", colX.type, headerY, {
          width: colW.type,
          align: "left",
        });
        doc.text("DESCRIPTION", colX.desc, headerY, {
          width: colW.desc,
          align: "left",
        });
        doc.text("QTY", colX.qty, headerY, {
          width: colW.qty,
          align: "center",
        });
        doc.text("PRICE", colX.price, headerY, {
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

        // Table Rows
        doc.font("Helvetica").fontSize(9).fillColor("#0f172a");

        estimate.items.forEach((item, index) => {
          const isService = item.line_type === "SERVICE";
          const desc = isService ? item.service_name : item.item_name;
          const price = parseFloat(item.recorded_selling_price);
          const qty = parseInt(item.quantity, 10);
          const disc = parseFloat(item.discount_amount);
          const net = price * qty - disc;

          // Prevent row from breaking awkwardly
          if (startY > 720) {
            doc.addPage();
            startY = 50;
          }

          doc.text(item.line_type, colX.type, startY, {
            width: colW.type,
            align: "left",
          });
          doc.text(desc, colX.desc, startY, {
            width: colW.desc,
            align: "left",
          });
          doc.text(qty.toString(), colX.qty, startY, {
            width: colW.qty,
            align: "center",
          });
          doc.text(this.formatCurrency(price), colX.price, startY, {
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

          // Add a subtle line between rows
          startY +=
            Math.max(doc.heightOfString(desc, { width: colW.desc }), 15) + 10;

          if (index < estimate.items.length - 1) {
            doc
              .moveTo(50, startY - 5)
              .lineTo(545, startY - 5)
              .lineWidth(0.5)
              .strokeColor("#f1f5f9")
              .stroke();
          }
        });

        // Bottom border of the table
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
          .text(this.formatCurrency(estimate.subtotal), valueX, startY, {
            width: valueW,
            align: "right",
          });
        startY += 18;

        if (parseFloat(estimate.total_discount) > 0) {
          doc.fillColor("#ef4444");
          doc.text("Total Discounts:", labelX, startY, {
            width: labelW,
            align: "right",
          });
          doc.text(
            `(${this.formatCurrency(estimate.total_discount)})`,
            valueX,
            startY,
            { width: valueW, align: "right" },
          );
          startY += 18;
        }

        doc.fillColor("#475569");
        doc.text(
          `VAT (${parseFloat(settings?.vat_percentage || 12)}%):`,
          labelX,
          startY,
          { width: labelW, align: "right" },
        );
        doc
          .fillColor("#0f172a")
          .text(this.formatCurrency(estimate.vat_amount), valueX, startY, {
            width: valueW,
            align: "right",
          });
        startY += 20;

        // Modern Highlighted Grand Total Box
        doc.roundedRect(labelX, startY, 225, 30, 4).fill("#fffbeb");
        doc.fillColor("#d97706").fontSize(11).font("Helvetica-Bold");
        doc.text("GRAND TOTAL:", labelX + 10, startY + 9, {
          width: labelW - 10,
          align: "left",
        });
        doc.text(
          this.formatCurrency(estimate.grand_total),
          valueX,
          startY + 9,
          {
            width: valueW - 10,
            align: "right",
          },
        );

        startY += 50;

        // --- 5. FOOTER & TERMS ---
        // Ensure enough space for terms and signatures, otherwise create a new page
        if (startY > 680) {
          doc.addPage();
          startY = 50;
        }

        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .fillColor("#0f172a")
          .text("Terms & Conditions:", 50, startY);
        doc
          .fontSize(9)
          .font("Helvetica-Oblique")
          .fillColor("#64748b")
          .text(
            estimate.terms_conditions || "Standard shop terms apply.",
            50,
            startY + 15,
            {
              width: 495,
              lineGap: 2,
            },
          );

        // Use the active Y position after the multi-line text to position signatures
        startY = doc.y + 40;
        if (startY > 740) {
          doc.addPage();
          startY = 50;
        }

        // Signatures
        doc.fontSize(9).font("Helvetica-Bold").fillColor("#0f172a");

        // Left Signature (Prepared By)
        doc.text(
          `Prepared By: ${estimate.created_by_name} (${estimate.created_by_role})`,
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

        // Right Signature (Client)
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

module.exports = EstimatePdfService;
