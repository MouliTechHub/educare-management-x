import React, { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { 
  CreditCard, 
  Percent, 
  History, 
  Send, 
  Edit, 
  Save, 
  X,
  MessageCircle 
} from "lucide-react";
import { Fee } from "./types/feeTypes";

interface EnhancedFeeTableRowProps {
  fee: Fee;
  isSelected: boolean;
  onSelectionChange: (checked: boolean) => void;
  onPaymentClick: (fee: Fee) => void;
  onDiscountClick: (fee: Fee) => void;
  onHistoryClick: (student: Fee['student']) => void;
  onNotesEdit: (feeId: string, notes: string) => void;
  onReminderClick: (fee: Fee) => void;
}

export function EnhancedFeeTableRow({
  fee,
  isSelected,
  onSelectionChange,
  onPaymentClick,
  onDiscountClick,
  onHistoryClick,
  onNotesEdit,
  onReminderClick
}: EnhancedFeeTableRowProps) {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(fee.notes || '');

  const finalFee = fee.actual_amount - fee.discount_amount;
  const balanceAmount = finalFee - fee.total_paid;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
      case 'Partial': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSaveNotes = () => {
    onNotesEdit(fee.id, notesValue);
    setIsEditingNotes(false);
  };

  const handleCancelNotes = () => {
    setNotesValue(fee.notes || '');
    setIsEditingNotes(false);
  };

  const isOverdue = new Date(fee.due_date) < new Date() && balanceAmount > 0;

  return (
    <TableRow className={isSelected ? 'bg-blue-50' : ''}>
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelectionChange}
        />
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">
            {fee.student?.first_name} {fee.student?.last_name}
          </div>
          <div className="text-sm text-gray-500">
            {fee.student?.admission_number}
          </div>
        </div>
      </TableCell>
      <TableCell>
        {fee.student?.class_name}
        {fee.student?.section && ` - ${fee.student.section}`}
      </TableCell>
      <TableCell>{fee.fee_type}</TableCell>
      <TableCell>₹{fee.actual_amount.toLocaleString()}</TableCell>
      <TableCell>
        {fee.discount_amount > 0 ? (
          <span className="text-green-600">₹{fee.discount_amount.toLocaleString()}</span>
        ) : (
          <span className="text-gray-400">₹0</span>
        )}
      </TableCell>
      <TableCell className="font-medium">₹{finalFee.toLocaleString()}</TableCell>
      <TableCell className="text-blue-600">₹{fee.total_paid.toLocaleString()}</TableCell>
      <TableCell className={balanceAmount > 0 ? 'text-red-600' : 'text-green-600'}>
        ₹{balanceAmount.toLocaleString()}
      </TableCell>
      <TableCell>
        <div className={isOverdue ? 'text-red-600 font-medium' : ''}>
          {fee.due_date ? new Date(fee.due_date).toLocaleDateString() : 'N/A'}
        </div>
      </TableCell>
      <TableCell>
        <Badge className={getStatusColor(fee.status)}>
          {fee.status}
        </Badge>
      </TableCell>
      <TableCell>
        {isEditingNotes ? (
          <div className="flex items-center gap-1">
            <Input
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              placeholder="Add notes..."
              className="w-24 h-8"
            />
            <Button size="sm" variant="ghost" onClick={handleSaveNotes}>
              <Save className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancelNotes}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-600 max-w-20 truncate">
              {fee.notes || 'Add notes...'}
            </span>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setIsEditingNotes(true)}
              title="Edit notes"
            >
              <Edit className="w-3 h-3" />
            </Button>
          </div>
        )}
      </TableCell>
      <TableCell>
        <div className="flex space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDiscountClick(fee)}
            title="Apply discount"
          >
            <Percent className="w-3 h-3" />
          </Button>
          {balanceAmount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPaymentClick(fee)}
              title="Record payment"
            >
              <CreditCard className="w-3 h-3" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onHistoryClick(fee.student)}
            title="View payment history"
          >
            <History className="w-3 h-3" />
          </Button>
          {isOverdue && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReminderClick(fee)}
              title="Send reminder"
              className="text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              <Send className="w-3 h-3" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}