import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { validateAmount, validateReceiptNumber } from "../student-management/utils/formValidation";
import { useState, useEffect } from "react";

interface PaymentFormData {
  payment_date: string;
  receipt_number: string;
  amount_paid: number;
  payment_receiver: string;
  payment_method: string;
  notes: string;
}

interface PaymentFormProps {
  form: UseFormReturn<PaymentFormData>;
  balanceAmount: number;
  onSubmit: (data: PaymentFormData) => void;
  onCancel: () => void;
}

export function PaymentForm({ form, balanceAmount, onSubmit, onCancel }: PaymentFormProps) {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleFormSubmit = (data: PaymentFormData) => {
    const errors: Record<string, string> = {};
    
    // Validate amount
    const amountValidation = validateAmount(data.amount_paid);
    if (!amountValidation.isValid) {
      errors.amount_paid = amountValidation.error || 'Invalid amount';
    } else if (data.amount_paid > balanceAmount) {
      errors.amount_paid = 'Amount cannot exceed balance amount';
    }
    
    // Validate receipt number
    const receiptValidation = validateReceiptNumber(data.receipt_number);
    if (!receiptValidation.isValid) {
      errors.receipt_number = receiptValidation.error || 'Invalid receipt number';
    }
    
    // Validate required fields
    if (!data.payment_receiver.trim()) {
      errors.payment_receiver = 'Payment receiver is required';
    }
    
    setValidationErrors(errors);
    
    if (Object.keys(errors).length === 0) {
      onSubmit(data);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="amount_paid"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount Being Paid</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="number" 
                  min="1"
                  max={balanceAmount}
                  step="0.01"
                  onChange={(e) => {
                    field.onChange(Number(e.target.value));
                    // Clear validation error when user starts typing
                    if (validationErrors.amount_paid) {
                      setValidationErrors(prev => ({ ...prev, amount_paid: '' }));
                    }
                  }}
                  required 
                />
              </FormControl>
              {validationErrors.amount_paid && (
                <p className="text-sm font-medium text-destructive">{validationErrors.amount_paid}</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="payment_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Date</FormLabel>
              <FormControl>
                <Input {...field} type="date" required />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="receipt_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Receipt Number</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder="Enter receipt number (3-20 alphanumeric characters)" 
                  maxLength={20}
                  onChange={(e) => {
                    // Only allow alphanumeric characters
                    const value = e.target.value.replace(/[^A-Za-z0-9]/g, '');
                    field.onChange(value);
                    // Clear validation error when user starts typing
                    if (validationErrors.receipt_number) {
                      setValidationErrors(prev => ({ ...prev, receipt_number: '' }));
                    }
                  }}
                  required 
                />
              </FormControl>
              {validationErrors.receipt_number && (
                <p className="text-sm font-medium text-destructive">{validationErrors.receipt_number}</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="payment_receiver"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Received By</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder="Enter receiver name" 
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    // Clear validation error when user starts typing
                    if (validationErrors.payment_receiver) {
                      setValidationErrors(prev => ({ ...prev, payment_receiver: '' }));
                    }
                  }}
                  required 
                />
              </FormControl>
              {validationErrors.payment_receiver && (
                <p className="text-sm font-medium text-destructive">{validationErrors.payment_receiver}</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="payment_method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Method</FormLabel>
              <FormControl>
                <select {...field} className="w-full p-2 border rounded-md" required>
                  <option value="Cash">Cash</option>
                  <option value="Online">Online Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Card">Card</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Additional notes" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Continue</Button>
        </div>
      </form>
    </Form>
  );
}
