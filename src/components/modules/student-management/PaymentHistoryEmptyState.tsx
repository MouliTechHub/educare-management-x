
import { History } from "lucide-react";

export function PaymentHistoryEmptyState() {
  return (
    <div className="text-center py-8 text-gray-500">
      <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p>No records found for the selected academic year and search criteria.</p>
    </div>
  );
}
