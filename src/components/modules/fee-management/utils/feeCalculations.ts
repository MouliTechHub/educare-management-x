// Utility functions for fee calculations to ensure consistency across the app

export interface FeeCalculation {
  actualAmount: number;
  discountAmount: number;
  finalAmount: number;
  totalPaid: number;
  balanceAmount: number;
  status: 'Paid' | 'Partial' | 'Pending' | 'Overdue';
}

export function calculateFeeAmounts(fee: {
  actual_amount: number;
  discount_amount: number;
  total_paid: number;
  due_date?: string;
}): FeeCalculation {
  const actualAmount = fee.actual_amount || 0;
  const discountAmount = fee.discount_amount || 0;
  const totalPaid = fee.total_paid || 0;
  
  // Calculate final amount after discount
  const finalAmount = actualAmount - discountAmount;
  
  // Calculate balance (what's still owed)
  const balanceAmount = Math.max(0, finalAmount - totalPaid);
  
  // Determine status
  let status: 'Paid' | 'Partial' | 'Pending' | 'Overdue' = 'Pending';
  
  if (balanceAmount <= 0) {
    status = 'Paid';
  } else if (totalPaid > 0) {
    status = 'Partial';
  } else if (fee.due_date && new Date(fee.due_date) < new Date()) {
    status = 'Overdue';
  } else {
    status = 'Pending';
  }
  
  return {
    actualAmount,
    discountAmount,
    finalAmount,
    totalPaid,
    balanceAmount,
    status
  };
}

export function validatePaymentAmount(paymentAmount: number, balanceAmount: number): {
  isValid: boolean;
  error?: string;
} {
  if (paymentAmount <= 0) {
    return {
      isValid: false,
      error: 'Payment amount must be greater than 0'
    };
  }
  
  if (paymentAmount > balanceAmount) {
    return {
      isValid: false,
      error: `Payment amount (₹${paymentAmount.toLocaleString()}) cannot exceed balance amount (₹${balanceAmount.toLocaleString()})`
    };
  }
  
  return { isValid: true };
}

export function validateDiscountAmount(discountAmount: number, actualAmount: number, currentDiscount: number = 0): {
  isValid: boolean;
  error?: string;
} {
  if (discountAmount <= 0) {
    return {
      isValid: false,
      error: 'Discount amount must be greater than 0'
    };
  }
  
  const totalDiscount = currentDiscount + discountAmount;
  
  if (totalDiscount > actualAmount) {
    return {
      isValid: false,
      error: `Total discount (₹${totalDiscount.toFixed(2)}) cannot exceed actual fee amount (₹${actualAmount.toFixed(2)})`
    };
  }
  
  return { isValid: true };
}