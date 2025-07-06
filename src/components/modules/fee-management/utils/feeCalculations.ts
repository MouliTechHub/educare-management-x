
import { Fee } from '../types/feeTypes';

export interface FeeCalculation {
  actualAmount: number;
  discountAmount: number;
  finalAmount: number;
  balanceAmount: number;
  status: 'Pending' | 'Paid' | 'Overdue' | 'Partial';
}

export const calculateFeeAmounts = (fee: Fee): FeeCalculation => {
  const actualAmount = fee.actual_fee;
  const discountAmount = fee.discount_amount;
  const paidAmount = fee.paid_amount;
  const finalAmount = actualAmount - discountAmount;
  const balanceAmount = Math.max(0, finalAmount - paidAmount);

  // Determine status based on amounts and due date
  let status: 'Pending' | 'Paid' | 'Overdue' | 'Partial' = 'Pending';
  
  if (balanceAmount === 0) {
    status = 'Paid';
  } else if (paidAmount > 0) {
    status = 'Partial';
  } else if (new Date(fee.due_date) < new Date()) {
    status = 'Overdue';
  }

  return {
    actualAmount,
    discountAmount,
    finalAmount,
    balanceAmount,
    status
  };
};
