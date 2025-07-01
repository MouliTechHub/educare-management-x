
interface FeeDetailsDisplayProps {
  feeDetails: {
    actualAmount: number;
    discountAmount: number;
    finalAmount: number;
    paidAmount: number;
    balanceAmount: number;
  };
}

export function FeeDetailsDisplay({ feeDetails }: FeeDetailsDisplayProps) {
  return (
    <div className="md:col-span-2 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
      <h4 className="font-semibold text-blue-900 mb-3">📊 Fee Details from Management System</h4>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
        <div>
          <span className="font-medium text-gray-600">Actual Fee:</span>
          <div className="text-lg font-semibold">₹{feeDetails.actualAmount.toLocaleString()}</div>
        </div>
        {feeDetails.discountAmount > 0 && (
          <div>
            <span className="font-medium text-green-600">Discount:</span>
            <div className="text-lg font-semibold text-green-600">-₹{feeDetails.discountAmount.toLocaleString()}</div>
          </div>
        )}
        <div>
          <span className="font-medium text-blue-600">Final Fee:</span>
          <div className="text-lg font-semibold text-blue-600">₹{feeDetails.finalAmount.toLocaleString()}</div>
        </div>
        <div>
          <span className="font-medium text-gray-600">Paid:</span>
          <div className="text-lg font-semibold">₹{feeDetails.paidAmount.toLocaleString()}</div>
        </div>
        <div>
          <span className="font-medium text-red-600">Balance:</span>
          <div className="text-lg font-bold text-red-600">₹{feeDetails.balanceAmount.toLocaleString()}</div>
        </div>
      </div>
      {feeDetails.discountAmount > 0 && (
        <div className="mt-2 text-xs text-green-700 bg-green-100 p-2 rounded">
          ✓ Discount applied from Fee Management System
        </div>
      )}
    </div>
  );
}
