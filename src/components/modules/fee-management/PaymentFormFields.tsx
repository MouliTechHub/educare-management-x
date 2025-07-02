
import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";

interface PaymentFormData {
  payment_date: string;
  receipt_number: string;
  amount_paid: number;
  payment_receiver: string;
  payment_method: string;
  notes: string;
}

interface PaymentFormFieldsProps {
  form: UseFormReturn<PaymentFormData>;
  balanceAmount: number;
  validationErrors: Record<string, string>;
  onFieldChange: (field: string) => void;
}

export function PaymentFormFields({ form, balanceAmount, validationErrors, onFieldChange }: PaymentFormFieldsProps) {
  return (
    <>
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
                  onFieldChange('amount_paid');
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
                  const value = e.target.value.replace(/[^A-Za-z0-9]/g, '');
                  field.onChange(value);
                  onFieldChange('receipt_number');
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
                  onFieldChange('payment_receiver');
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
                <option value="PhonePe">PhonePe</option>
                <option value="GPay">GPay</option>
                <option value="Online">Online Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
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
    </>
  );
}
