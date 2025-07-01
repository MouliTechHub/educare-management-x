
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ReportsManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports Management</h1>
        <p className="text-gray-600 mt-2">Generate and view various reports</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Reports Management</CardTitle>
          <CardDescription>Generate academic, financial, and administrative reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-gray-500">Reports management features coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
