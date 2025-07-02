
import { History, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function PaymentHistoryEmptyState() {
  return (
    <div className="space-y-4">
      <div className="text-center py-8 text-gray-500">
        <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <h3 className="font-medium text-gray-900 mb-2">No Payment History Found</h3>
        <p className="text-sm">No payment records were found for the selected academic year and search criteria.</p>
      </div>
      
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Possible reasons:</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• No payments have been recorded for this student yet</li>
            <li>• The selected academic year has no payment records</li>
            <li>• Search filters are too restrictive</li>
            <li>• Payment records may be in a different academic year</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
