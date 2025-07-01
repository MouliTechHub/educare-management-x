
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileText, Table } from "lucide-react";
import { StudentFeeRecord } from "@/types/enhanced-fee-types";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feeRecords: StudentFeeRecord[];
  academicYear: any;
  filters: any;
}

export function ExportDialog({ 
  open, 
  onOpenChange, 
  feeRecords, 
  academicYear, 
  filters 
}: ExportDialogProps) {
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>('excel');
  const [includeColumns, setIncludeColumns] = useState({
    student: true,
    class: true,
    feeType: true,
    actualFee: true,
    discount: true,
    finalFee: true,
    paidAmount: true,
    balanceFee: true,
    dueDate: true,
    status: true
  });

  const handleExport = () => {
    console.log('Exporting data:', {
      format: exportFormat,
      columns: includeColumns,
      recordCount: feeRecords.length,
      academicYear: academicYear?.year_name
    });
    
    // Here you would implement the actual export logic
    // For now, just log the export request
    onOpenChange(false);
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
            Export {feeRecords.length} fee records for {academicYear?.year_name || 'selected period'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label>Export Format</Label>
            <Select value={exportFormat} onValueChange={(value: 'excel' | 'pdf') => setExportFormat(value)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">
                  <div className="flex items-center space-x-2">
                    <Table className="w-4 h-4" />
                    <span>Excel (.xlsx)</span>
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>PDF (.pdf)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-base font-medium">Include Columns</Label>
            <div className="mt-3 space-y-3">
              {Object.entries(includeColumns).map(([key, checked]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={checked}
                    onCheckedChange={(checked) => 
                      setIncludeColumns(prev => ({ ...prev, [key]: !!checked }))
                    }
                  />
                  <Label htmlFor={key} className="text-sm font-normal">
                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export {exportFormat.toUpperCase()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
