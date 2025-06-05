
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ParentManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Parent Management</h1>
        <p className="text-gray-600 mt-2">Manage parent information and contacts</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Parent Records</CardTitle>
          <CardDescription>
            Coming soon - Full parent management functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Parent management features will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
