
import React from "react";
import { Label } from "@/components/ui/label";

interface DiscountSummaryProps {
  selectedFee: any;
}

export function DiscountSummary({ selectedFee }: DiscountSummaryProps) {
  // Safely get the actual fee amount
  const actualAmount = selectedFee?.actual_fee || selectedFee?.actual_amount || selectedFee?.amount || 0;
  const currentDiscount = selectedFee?.discount_amount || 0;

  return (
    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
      <div>
        <Label className="text-sm font-medium text-gray-700">Actual Amount</Label>
        <div className="text-xl font-bold">₹{actualAmount.toLocaleString()}</div>
      </div>
      <div>
        <Label className="text-sm font-medium text-gray-700">Current Discount</Label>
        <div className="text-xl font-bold text-green-600">₹{currentDiscount.toLocaleString()}</div>
      </div>
    </div>
  );
}
