
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { PaymentFormFields } from "./PaymentFormFields";
import { usePaymentValidation } from "./usePaymentValidation";

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
  const { validationErrors, clearFieldError, handleValidation } = usePaymentValidation(balanceAmount);

  const handleFormSubmit = (data: PaymentFormData) => {
    if (handleValidation(data)) {
      // Trim all string fields before submission
      const trimmedData = {
        ...data,
        receipt_number: data.receipt_number.trim(),
        payment_receiver: data.payment_receiver.trim(),
        notes: data.notes.trim()
      };
      onSubmit(trimmedData);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <PaymentFormFields 
          form={form}
          balanceAmount={balanceAmount}
          validationErrors={validationErrors}
          onFieldChange={clearFieldError}
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
