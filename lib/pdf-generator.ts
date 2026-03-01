import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Bill } from "@/types";

export function generateInvoicePDF(bill: Bill) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(22);
  doc.text("INVOICE", 105, 20, { align: "center" });

  doc.setFontSize(12);
  doc.text("LedgerOne", 14, 30);
  doc.setFontSize(10);
  doc.text("Packaging Solutions", 14, 35);
  doc.text("123 Business Rd, State, Country", 14, 40);

  // Bill Details
  doc.text(`Bill No: ${bill.billNo}`, 140, 30);
  doc.text(`Date: ${new Date(bill.createdAt).toLocaleDateString()}`, 140, 35);
  doc.text(`Status: ${bill.status}`, 140, 40);

  // Customer Details
  doc.text(`Bill To:`, 14, 55);
  doc.setFontSize(12);
  doc.text(bill.customerName, 14, 60);

  // Table
  const tableColumn = ["Item", "Qty", "Rate", "Tax", "Total"];
  const tableRows: (string | number)[][] = [];

  bill.billItems.forEach((item) => {
    const itemData = [
      item.productName,
      item.quantity,
      item.rate.toFixed(2),
      (item.cgst + item.sgst).toFixed(2), // Tax amount per unit (simplified) or total tax? 
      // Actually tax is usually rate * qty * percentage or similar. 
      // The 'lineTotal' includes tax.
      item.lineTotal.toFixed(2),
    ];
    tableRows.push(itemData);
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 70,
  });

  // Totals
  // @ts-expect-error jsPDF autoTable typing mismatch
  const finalY = doc.lastAutoTable.finalY + 10;
  
  doc.text(`Subtotal: ${bill.subTotal.toFixed(2)}`, 140, finalY);
  doc.text(`Tax: ${(bill.totalCgst + bill.totalSgst).toFixed(2)}`, 140, finalY + 5);
  doc.text(`Discount: ${bill.discount.toFixed(2)}`, 140, finalY + 10);
  doc.setFontSize(14);
  doc.text(`Total: ${bill.total.toFixed(2)}`, 140, finalY + 20);

  // Footer
  doc.setFontSize(10);
  doc.text("Thank you for your business!", 105, 280, { align: "center" });

  doc.save(`invoice_${bill.billNo}.pdf`);
}
