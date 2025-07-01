
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ExamManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Exam Management</h1>
        <p className="text-gray-600 mt-2">Manage exams and grading</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Exam Management</CardTitle>
          <CardDescription>Create and manage exams for different classes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-gray-500">Exam management features coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
