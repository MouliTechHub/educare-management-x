
import { useToast } from "@/hooks/use-toast";

interface Fee {
  id: string;
  student_id: string;
  amount: number;
  actual_amount: number;
  discount_amount: number;
  total_paid: number;
  fee_type: string;
  due_date: string;
  payment_date: string | null;
  status: 'Pending' | 'Paid' | 'Overdue';
  receipt_number: string | null;
  created_at: string;
  updated_at: string;
  discount_notes: string | null;
  discount_updated_by: string | null;
  discount_updated_at: string | null;
  academic_year_id: string;
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    admission_number: string;
    class_name?: string;
    section?: string;
    parent_phone?: string;
    parent_email?: string;
    class_id?: string;
  };
}

export function useExportData() {
  const { toast } = useToast();

  const exportToExcel = (fees: Fee[], academicYear: string) => {
    try {
      // Prepare CSV data
      const headers = [
        'Student Name',
        'Admission Number',
        'Class',
        'Fee Type',
        'Actual Fee',
        'Discount',
        'Final Fee',
        'Paid Amount',
        'Balance Fee',
        'Due Date',
        'Status',
        'Receipt Number',
        'Parent Phone',
        'Parent Email'
      ];

      const csvData = fees.map(fee => {
        const finalFee = fee.actual_amount - fee.discount_amount;
        const balanceFee = finalFee - fee.total_paid;
        
        return [
          fee.student ? `${fee.student.first_name} ${fee.student.last_name}` : 'Unknown',
          fee.student?.admission_number || '',
          fee.student?.class_name ? `${fee.student.class_name}${fee.student.section ? ` - ${fee.student.section}` : ''}` : '',
          fee.fee_type,
          fee.actual_amount,
          fee.discount_amount,
          finalFee,
          fee.total_paid,
          balanceFee,
          new Date(fee.due_date).toLocaleDateString(),
          fee.status,
          fee.receipt_number || '',
          fee.student?.parent_phone || '',
          fee.student?.parent_email || ''
        ];
      });

      // Create CSV content
      const csvContent = [headers, ...csvData]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      // Download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `fee_records_${academicYear}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Excel Export Complete",
        description: `Downloaded fee records for ${academicYear}`,
      });
    } catch (error) {
      console.error('Excel export error:', error);
      toast({
        title: "Export Failed",
        description: "Unable to export to Excel. Please try again.",
        variant: "destructive",
      });
    }
  };

  const exportToPDF = (fees: Fee[], academicYear: string) => {
    try {
      // Create a simple HTML table for PDF conversion
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Fee Records - ${academicYear}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .amount { text-align: right; }
            .status-paid { color: green; font-weight: bold; }
            .status-pending { color: orange; font-weight: bold; }
            .status-overdue { color: red; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Fee Records - Academic Year ${academicYear}</h1>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
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
                const finalFee = fee.actual_amount - fee.discount_amount;
                const balanceFee = finalFee - fee.total_paid;
                
                return `
                  <tr>
                    <td>${fee.student ? `${fee.student.first_name} ${fee.student.last_name}` : 'Unknown'}</td>
                    <td>${fee.student?.class_name || ''}</td>
                    <td>${fee.fee_type}</td>
                    <td class="amount">₹${fee.actual_amount.toLocaleString()}</td>
                    <td class="amount">₹${fee.discount_amount.toLocaleString()}</td>
                    <td class="amount">₹${finalFee.toLocaleString()}</td>
                    <td class="amount">₹${fee.total_paid.toLocaleString()}</td>
                    <td class="amount">₹${balanceFee.toLocaleString()}</td>
                    <td class="status-${fee.status.toLowerCase()}">${fee.status}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      // Create a new window with the HTML content
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Trigger print dialog
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);

        toast({
          title: "PDF Export Ready",
          description: "Print dialog opened for PDF generation",
        });
      } else {
        throw new Error('Unable to open print window');
      }
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Export Failed",
        description: "Unable to export to PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    exportToExcel,
    exportToPDF
  };
}
