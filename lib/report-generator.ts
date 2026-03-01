import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { DashboardStats } from "@/app/actions/reports"
import { format } from "date-fns"

export function generateFinancialReportPDF(stats: DashboardStats, period: string, type: 'Monthly' | 'Yearly') {
  const doc = new jsPDF();
  
  // -- Company Header --
  doc.setFontSize(22);
  doc.text("LedgerOne", 14, 20);
  
  doc.setFontSize(10);
  doc.text("Financial Statement", 14, 26);
  doc.text(`Period: ${period}`, 14, 31);
  doc.text(`Generated: ${format(new Date(), 'PPP')}`, 14, 36);

  // -- Summary Section --
  doc.setDrawColor(200);
  doc.line(14, 40, 196, 40);

  doc.setFontSize(14);
  doc.text("Executive Summary", 14, 48);

  const summaryData = [
    ["Total Revenue", `$${stats.revenue.toFixed(2)}`],
    ["Total Collections", `$${stats.collections.toFixed(2)}`],
    ["Total Bills Created", `${stats.billCount}`],
    ["Pending Dues (from this period)", `$${stats.pendingDues.toFixed(2)}`],
  ];

  autoTable(doc, {
    startY: 52,
    head: [],
    body: summaryData,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 } }
  });

  // -- Collection Breakdown --
  // @ts-expect-error jsPDF autoTable typing mismatch
  let finalY = doc.lastAutoTable.finalY + 10;
  
  doc.text("Collection Breakdown", 14, finalY);
  const breakdownData = [
    ["Cash", `$${stats.breakdown.cash.toFixed(2)}`],
    ["UPI", `$${stats.breakdown.upi.toFixed(2)}`],
    ["Bank", `$${stats.breakdown.bank.toFixed(2)}`],
  ];

  autoTable(doc, {
    startY: finalY + 4,
    head: [],
    body: breakdownData,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 } }
  });

  // -- Detailed Breakdown Table --
  // @ts-expect-error jsPDF autoTable typing mismatch
  finalY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.text(`${type} Breakdown`, 14, finalY);

  let tableHead = [];
  let tableBody = [];

  if (type === 'Monthly') {
      // Daily Breakdown
      tableHead = [["Date", "Revenue", "Collections"]];
      tableBody = stats.dailyData.map(d => [
          d.date,
          `$${d.revenue.toFixed(2)}`,
          `$${d.collections.toFixed(2)}`
      ]);
  } else {
      // Yearly Breakdown (Monthly)
      tableHead = [["Month", "Revenue"]];
      tableBody = stats.monthlyData.map(m => [
          m.name,
          `$${m.total.toFixed(2)}`
      ]);
  }

  autoTable(doc, {
      startY: finalY + 5,
      head: tableHead,
      body: tableBody,
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} of ${pageCount}`, 196, 285, { align: 'right' });
  }

  doc.save(`Financial_Report_${period.replace(/ /g, '_')}.pdf`);
}

import { CustomerLedger } from "@/app/actions/ledger"

export function generateLedgerPDF(ledger: CustomerLedger) {
    const doc = new jsPDF();
    
    // -- Header --
    doc.setFontSize(22);
    doc.text("LedgerOne", 14, 20);
    doc.setFontSize(10);
    doc.text("Statement of Account", 14, 26);
    doc.text(`Generated: ${format(new Date(), 'PPP')}`, 14, 31);

    // -- Customer Details --
    doc.setFontSize(12);
    doc.text(`Customer: ${ledger.customer.name}`, 14, 42);
    doc.setFontSize(10);
    doc.text(`Phone: ${ledger.customer.phone}`, 14, 47);
    if(ledger.customer.email) doc.text(`Email: ${ledger.customer.email}`, 14, 52);

    // -- Summary Box --
    doc.setDrawColor(200);
    doc.rect(130, 35, 66, 25);
    doc.text("Closing Balance", 135, 42);
    doc.setFontSize(14);
    const balanceText = `$${ledger.closingBalance.toFixed(2)}`;
    doc.text(balanceText, 135, 52);
    doc.setFontSize(10);
    doc.text(ledger.closingBalance > 0 ? "Amount Due" : "Advance", 135, 57);

    // -- Transaction Table --
    doc.setFontSize(14);
    doc.text("Transaction History", 14, 70);

    const tableBody = ledger.transactions.map(t => [
        format(new Date(t.date), 'dd MMM yyyy'),
        t.type,
        t.reference,
        t.debit > 0 ? `$${t.debit.toFixed(2)}` : '-',
        t.credit > 0 ? `$${t.credit.toFixed(2)}` : '-',
        `$${t.balance.toFixed(2)}`
    ]);

    autoTable(doc, {
        startY: 75,
        head: [["Date", "Type", "Reference", "Debit", "Credit", "Balance"]],
        body: tableBody,
        headStyles: { fillColor: [66, 66, 66] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right', fontStyle: 'bold' }
        }
    });

    doc.save(`Statement_${ledger.customer.name.replace(/ /g, '_')}.pdf`);
}
