
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const PAYMENT_METHODS = [
  'PhonePe', 'GPay', 'Card', 'Online', 'Cash', 'Cheque', 'Bank Transfer'
];

interface PaymentInformationCardProps {
  formData: {
    amount_paid: string;
    payment_date: string;
    payment_method: string;
    late_fee: string;
    reference_number: string;
    payment_received_by: string;
    notes: string;
  };
  feeDetails: {
    balanceAmount: number;
  } | null;
  onInputChange: (field: string, value: string) => void;
}

export function PaymentInformationCard({
  formData,
  feeDetails,
  onInputChange
}: PaymentInformationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Information</CardTitle>
        <CardDescription>Enter payment details</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount_paid">Amount Paid (₹) *</Label>
          <Input
            id="amount_paid"
            type="number"
            step="0.01"
            min="0"
            max={feeDetails?.balanceAmount || undefined}
            value={formData.amount_paid}
            onChange={(e) => onInputChange('amount_paid', e.target.value)}
            placeholder="Enter amount paid"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment_date">Payment Date *</Label>
          <Input
            id="payment_date"
            type="date"
            value={formData.payment_date}
            onChange={(e) => onInputChange('payment_date', e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment_method">Payment Method *</Label>
          <Select
            value={formData.payment_method}
            onValueChange={(value) => onInputChange('payment_method', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((method) => (
                <SelectItem key={method} value={method}>
                  {method}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="late_fee">Late Fee (₹)</Label>
          <Input
            id="late_fee"
            type="number"
            step="0.01"
            min="0"
            value={formData.late_fee}
            onChange={(e) => onInputChange('late_fee', e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reference_number">Reference Number</Label>
          <Input
            id="reference_number"
            value={formData.reference_number}
            onChange={(e) => onInputChange('reference_number', e.target.value)}
            placeholder="Receipt/Transaction number"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment_received_by">Payment Received By *</Label>
          <Input
            id="payment_received_by"
            value={formData.payment_received_by}
            onChange={(e) => onInputChange('payment_received_by', e.target.value)}
            placeholder="Name of person receiving payment"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => onInputChange('notes', e.target.value)}
            placeholder="Optional notes about this payment"
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
