import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Class, Student } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { CalendarDays } from "lucide-react";

interface StudentSelectionCardNewProps {
  classId: string;
  studentId: string;
  academicYearId: string;
  classes: Class[];
  students: Student[];
  onInputChange: (field: string, value: string) => void;
}

export function StudentSelectionCardNew({
  classId,
  studentId,
  academicYearId,
  classes,
  students,
  onInputChange
}: StudentSelectionCardNewProps) {
  const [currentAcademicYear, setCurrentAcademicYear] = useState<any>(null);

  const filteredStudents = classId 
    ? students.filter(s => s.class_id === classId)
    : [];

  // Get current academic year on mount
  useEffect(() => {
    const getCurrentAcademicYear = async () => {
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .eq("is_current", true)
        .single();
      
      if (data && !error) {
        setCurrentAcademicYear(data);
        // Auto-select current academic year
        onInputChange('academic_year_id', data.id);
      }
    };
    getCurrentAcademicYear();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Selection</CardTitle>
        <CardDescription>Select the class and student for payment</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="class_id">Class *</Label>
          <Select
            value={classId}
            onValueChange={(value) => onInputChange('class_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name} {cls.section && `- Section ${cls.section}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="student_id">Student *</Label>
          <Select
            value={studentId}
            onValueChange={(value) => onInputChange('student_id', value)}
            disabled={!classId}
          >
            <SelectTrigger>
              <SelectValue placeholder={!classId ? "Select class first" : "Select student"} />
            </SelectTrigger>
            <SelectContent>
              {filteredStudents.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.first_name} {student.last_name} ({student.admission_number})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="academic_year_id">Academic Year *</Label>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            {currentAcademicYear ? (
              <Badge variant="default" className="bg-primary">
                {currentAcademicYear.year_name} (Current)
              </Badge>
            ) : (
              <span className="text-sm text-muted-foreground">Loading current academic year...</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Payments will be allocated automatically to outstanding fees for this academic year
          </p>
        </div>
      </CardContent>
    </Card>
  );
}