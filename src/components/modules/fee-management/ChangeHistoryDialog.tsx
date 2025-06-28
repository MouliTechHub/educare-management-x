
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, DollarSign, Percent } from "lucide-react";

interface ChangeHistoryEntry {
  id: string;
  change_type: 'payment' | 'discount';
  amount: number;
  previous_value: number;
  new_value: number;
  changed_by: string;
  change_date: string;
  notes?: string;
  receipt_number?: string;
}

interface ChangeHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  feeType: string;
  history: ChangeHistoryEntry[];
}

export function ChangeHistoryDialog({ 
  open, 
  onOpenChange, 
  studentName, 
  feeType, 
  history 
}: ChangeHistoryDialogProps) {
  const getChangeIcon = (type: string) => {
    switch (type) {
      case "payment":
        return <DollarSign className="w-4 h-4 text-green-600" />;
      case "discount":
        return <Percent className="w-4 h-4 text-blue-600" />;
      default:
        return <Calendar className="w-4 h-4 text-gray-600" />;
    }
  };

  const getChangeTypeLabel = (type: string) => {
    switch (type) {
      case "payment":
        return "Payment";
      case "discount":
        return "Discount Applied";
      default:
        return "Change";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Change History - {studentName} ({feeType})</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No change history available for this fee record</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Previous Value</TableHead>
                  <TableHead>New Value</TableHead>
                  <TableHead>Changed By</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{new Date(entry.change_date).toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center space-x-1 w-fit">
                        {getChangeIcon(entry.change_type)}
                        <span>{getChangeTypeLabel(entry.change_type)}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      ₹{entry.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>₹{entry.previous_value.toLocaleString()}</TableCell>
                    <TableCell className="font-medium text-green-600">
                      ₹{entry.new_value.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{entry.changed_by}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={entry.notes}>
                        {entry.notes || '-'}
                        {entry.receipt_number && (
                          <div className="text-sm text-gray-500">
                            Receipt: {entry.receipt_number}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
