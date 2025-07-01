
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Table } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StudentFeeRecord } from "@/types/enhanced-fee-types";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feeRecords: StudentFeeRecord[];
  academicYear?: { id: string; year_name: string; };
  filters: any;
}

export function ExportDialog({ 
  open, 
  onOpenChange, 
  feeRecords, 
  academicYear,
  filters 
}: ExportDialogProps) {
  const { toast } = useToast();
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>('excel');
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      if (exportFormat === 'excel') {
        await exportToExcel();
      } else {
        await exportToPDF();
      }
      
      toast({
        title: "Export Successful",
        description: `Fee records exported as ${exportFormat.toUpperCase()} file.`
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export fee records. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    // Create CSV data
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
      'Created Date'
    ];

    const csvData = feeRecords.map(record => [
      record.student ? `${record.student.first_name} ${record.student.last_name}` : 'Unknown',
      record.student?.admission_number || 'N/A',
      record.student?.class_name ? 
        `${record.student.class_name}${record.student.section ? ` - ${record.student.section}` : ''}` : 
        'Unknown',
      record.fee_type,
      record.actual_fee,
      record.discount_amount,
      record.final_fee,
      record.paid_amount,
      record.balance_fee,
      record.due_date ? new Date(record.due_date).toLocaleDateString() : 'N/A',
      record.status,
      new Date(record.created_at).toLocaleDateString()
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `fee-records-${academicYear?.year_name || 'all'}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = async () => {
    // For now, we'll create a simple HTML report and use the browser's print functionality
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fee Records Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .summary { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .status-paid { color: green; font-weight: bold; }
          .status-pending { color: orange; font-weight: bold; }
          .status-overdue { color: red; font-weight: bold; }
          .status-partial { color: blue; font-weight: bold; }
          .currency { text-align: right; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Fee Records Report</h1>
          <p>Academic Year: ${academicYear?.year_name || 'All Years'}</p>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          <p>Total Records: ${feeRecords.length}</p>
        </div>
        
        <div class="summary">
          <h3>Summary</h3>
          <p>Total Actual Fees: ₹${feeRecords.reduce((sum, r) => sum + r.actual_fee, 0).toLocaleString()}</p>
          <p>Total Discounts: ₹${feeRecords.reduce((sum, r) => sum + r.discount_amount, 0).toLocaleString()}</p>
          <p>Total Paid: ₹${feeRecords.reduce((sum, r) => sum + r.paid_amount, 0).toLocaleString()}</p>
          <p>Total Balance: ₹${feeRecords.reduce((sum, r) => sum + r.balance_fee, 0).toLocaleString()}</p>
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
              <th>Due Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${feeRecords.map(record => `
              <tr>
                <td>${record.student ? `${record.student.first_name} ${record.student.last_name}` : 'Unknown'}</td>
                <td>${record.student?.class_name || 'Unknown'}${record.student?.section ? ` - ${record.student.section}` : ''}</td>
                <td>${record.fee_type}</td>
                <td class="currency">₹${record.actual_fee.toLocaleString()}</td>
                <td class="currency">₹${record.discount_amount.toLocaleString()}</td>
                <td class="currency">₹${record.final_fee.toLocaleString()}</td>
                <td class="currency">₹${record.paid_amount.toLocaleString()}</td>
                <td class="currency">₹${record.balance_fee.toLocaleString()}</td>
                <td>${record.due_date ? new Date(record.due_date).toLocaleDateString() : 'N/A'}</td>
                <td class="status-${record.status.toLowerCase()}">${record.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 1000);
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.class_id !== 'all') count++;
    if (filters.section !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.fee_type !== 'all') count++;
    if (filters.due_date_from) count++;
    if (filters.due_date_to) count++;
    return count;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Export Fee Records</span>
          </DialogTitle>
          <DialogDescription>
            Export the filtered fee records to Excel or PDF format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Export Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-blue-900">Export Summary</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>Records to Export: <strong>{feeRecords.length}</strong></p>
              <p>Academic Year: <strong>{academicYear?.year_name || 'All Years'}</strong></p>
              {getActiveFiltersCount() > 0 && (
                <p>Active Filters: <Badge variant="secondary">{getActiveFiltersCount()}</Badge></p>
              )}
              <p>Total Value: <strong>₹{feeRecords.reduce((sum, r) => sum + r.actual_fee, 0).toLocaleString()}</strong></p>
            </div>
          </div>

          {/* Export Format Selection */}
          <div>
            <Label className="text-base font-medium">Export Format</Label>
            <RadioGroup 
              value={exportFormat} 
              onValueChange={(value: 'excel' | 'pdf') => setExportFormat(value)}
              className="mt-2"
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel" className="flex items-center space-x-2 cursor-pointer flex-1">
                  <Table className="w-4 h-4 text-green-600" />
                  <div>
                    <div className="font-medium">Excel/CSV</div>
                    <div className="text-xs text-gray-500">
                      Spreadsheet format for data analysis
                    </div>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center space-x-2 cursor-pointer flex-1">
                  <FileText className="w-4 h-4 text-red-600" />
                  <div>
                    <div className="font-medium">PDF Report</div>
                    <div className="text-xs text-gray-500">
                      Formatted report for printing
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={loading || feeRecords.length === 0}
            >
              {loading ? (
                "Exporting..."
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export {exportFormat.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
