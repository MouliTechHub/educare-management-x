
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ClassManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Class & Subject Management</h1>
        <p className="text-gray-600 mt-2">Manage classes, sections, and subjects</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Class Records</CardTitle>
          <CardDescription>
            Coming soon - Full class and subject management functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Class and subject management features will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
