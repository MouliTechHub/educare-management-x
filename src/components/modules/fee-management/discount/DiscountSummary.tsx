
import React from "react";

interface DiscountSummaryProps {
  selectedFee: any;
}

export function DiscountSummary({ selectedFee }: DiscountSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-sm font-medium text-gray-700">Actual Amount</p>
        <div className="text-xl font-bold">₹{selectedFee?.actual_amount?.toLocaleString()}</div>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700">Current Discount</p>
        <div className="text-xl font-bold text-green-600">₹{selectedFee?.discount_amount?.toLocaleString()}</div>
      </div>
    </div>
  );
}
