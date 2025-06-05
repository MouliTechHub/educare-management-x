
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Configure school and system settings</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>
            Coming soon - Full settings functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Settings features will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
