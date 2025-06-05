
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AttendanceTracking() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Attendance Tracking</h1>
        <p className="text-gray-600 mt-2">Mark and track student attendance</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Attendance Management</CardTitle>
          <CardDescription>
            Coming soon - Full attendance tracking functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Attendance tracking features will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
