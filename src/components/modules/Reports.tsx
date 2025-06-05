
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ReportsProps {
  userRole: "Admin" | "Teacher" | "Parent" | "Accountant";
}

export function Reports({ userRole }: ReportsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-2">Generate comprehensive school reports</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Report Generation</CardTitle>
          <CardDescription>
            Coming soon - Full reporting functionality for {userRole}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Reporting features will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
