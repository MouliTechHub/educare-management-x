
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ExamGrading() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Exams & Grading</h1>
        <p className="text-gray-600 mt-2">Manage exams and student grades</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Exam Management</CardTitle>
          <CardDescription>
            Coming soon - Full exam and grading functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Exam and grading features will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
