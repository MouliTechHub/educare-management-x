
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";

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
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  required 
                />
              </FormControl>
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
                <Input {...field} placeholder="Enter receipt number" required />
              </FormControl>
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
                <Input {...field} placeholder="Enter receiver name" required />
              </FormControl>
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
