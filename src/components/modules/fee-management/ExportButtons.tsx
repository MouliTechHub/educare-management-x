
import React from "react";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { Fee } from "./types/feeTypes";
import { useToast } from "@/hooks/use-toast";

interface ExportButtonsProps {
  fees: Fee[];
  filters?: any;
  className?: string;
}

export function ExportButtons({ fees, filters, className }: ExportButtonsProps) {
  const { toast } = useToast();

  const exportToCSV = () => {
    try {
      const headers = [
        'Student Name',
        'Admission Number',
        'Class',
        'Section',
        'Fee Type',
        'Actual Fee',
        'Discount Amount',
        'Final Fee',
        'Paid Amount',
        'Balance Amount',
        'Due Date',
        'Status',
        'Notes',
        'Created Date'
      ];

      const rows = fees.map(fee => {
        const finalFee = fee.actual_fee - fee.discount_amount;
        const balanceAmount = finalFee - fee.paid_amount;
        
        return [
          `${fee.student?.first_name || ''} ${fee.student?.last_name || ''}`.trim(),
          fee.student?.admission_number || '',
          fee.student?.class_name || '',
          fee.student?.section || '',
          fee.fee_type,
          fee.actual_fee,
          fee.discount_amount,
          finalFee,
          fee.paid_amount,
          balanceAmount,
          fee.due_date,
          fee.status,
          fee.discount_notes || '',
          new Date(fee.created_at).toLocaleDateString()
        ];
      });

      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `fee-records-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `Exported ${fees.length} fee records to CSV`
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting the data",
        variant: "destructive"
      });
    }
  };

  const exportToPDF = () => {
    try {
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Fee Records Report</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f4f4f4; font-weight: bold; }
            .header { text-align: center; margin-bottom: 20px; }
            .summary { margin: 20px 0; padding: 10px; background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Fee Records Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="summary">
            <h3>Summary</h3>
            <p>Total Records: ${fees.length}</p>
            <p>Total Amount: ₹${fees.reduce((sum, fee) => sum + (fee.actual_fee - fee.discount_amount), 0).toLocaleString()}</p>
            <p>Total Collected: ₹${fees.reduce((sum, fee) => sum + fee.paid_amount, 0).toLocaleString()}</p>
            <p>Total Discount: ₹${fees.reduce((sum, fee) => sum + fee.discount_amount, 0).toLocaleString()}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Class</th>
                <th>Fee Type</th>
                <th>Actual Fee</th>
                <th>Discount</th>
                <th>Final Fee</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${fees.map(fee => {
                const finalFee = fee.actual_fee - fee.discount_amount;
                const balanceAmount = finalFee - fee.paid_amount;
                return `
                  <tr>
                    <td>${fee.student?.first_name || ''} ${fee.student?.last_name || ''}</td>
                    <td>${fee.student?.class_name || ''} ${fee.student?.section || ''}</td>
                    <td>${fee.fee_type}</td>
                    <td>₹${fee.actual_fee.toLocaleString()}</td>
                    <td>₹${fee.discount_amount.toLocaleString()}</td>
                    <td>₹${finalFee.toLocaleString()}</td>
                    <td>₹${fee.paid_amount.toLocaleString()}</td>
                    <td>₹${balanceAmount.toLocaleString()}</td>
                    <td>${fee.status}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fee-records-${new Date().toISOString().split('T')[0]}.html`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Exported ${fees.length} fee records to HTML (can be printed as PDF)`
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting the data",
        variant: "destructive"
      });
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={exportToCSV}
        disabled={fees.length === 0}
      >
        <FileText className="w-4 h-4 mr-2" />
        Export Excel
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={exportToPDF}
        disabled={fees.length === 0}
      >
        <Download className="w-4 h-4 mr-2" />
        Export PDF
      </Button>
    </div>
  );
}
