
import { useState } from "react";
import { validateAmount, validateReceiptNumber } from "../student-management/utils/formValidation";

interface PaymentFormData {
  payment_date: string;
  receipt_number: string;
  amount_paid: number;
  payment_receiver: string;
  payment_method: string;
  notes: string;
}

export function usePaymentValidation(balanceAmount: number) {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const clearFieldError = (field: string) => {
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validatePaymentData = (data: PaymentFormData): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    // Validate amount
    const amountValidation = validateAmount(data.amount_paid);
    if (!amountValidation.isValid) {
      errors.amount_paid = amountValidation.error || 'Invalid amount';
    } else if (data.amount_paid > balanceAmount) {
      errors.amount_paid = 'Amount cannot exceed balance amount';
    }
    
    // Validate receipt number (trim before validation)
    const receiptValidation = validateReceiptNumber(data.receipt_number);
    if (!receiptValidation.isValid) {
      errors.receipt_number = receiptValidation.error || 'Invalid receipt number';
    }
    
    // Validate required fields (trim before validation)
    if (!data.payment_receiver.trim()) {
      errors.payment_receiver = 'Payment receiver is required';
    }
    
    return errors;
  };

  const handleValidation = (data: PaymentFormData) => {
    const errors = validatePaymentData(data);
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  return {
    validationErrors,
    clearFieldError,
    handleValidation
  };
}
