
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Class, Student, FeeStructure } from "@/types/database";

interface StudentSelectionCardProps {
  classId: string;
  studentId: string;
  feeStructureId: string;
  classes: Class[];
  students: Student[];
  feeStructures: FeeStructure[];
  onInputChange: (field: string, value: string) => void;
}

export function StudentSelectionCard({
  classId,
  studentId,
  feeStructureId,
  classes,
  students,
  feeStructures,
  onInputChange
}: StudentSelectionCardProps) {
  const filteredStudents = classId 
    ? students.filter(s => s.class_id === classId)
    : [];
  
  const filteredFeeStructures = classId 
    ? feeStructures.filter(fs => fs.class_id === classId)
    : [];

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
          <Label htmlFor="fee_structure_id">Fee Structure *</Label>
          <Select
            value={feeStructureId}
            onValueChange={(value) => onInputChange('fee_structure_id', value)}
            disabled={!classId}
          >
            <SelectTrigger>
              <SelectValue placeholder={!classId ? "Select class first" : "Select fee structure"} />
            </SelectTrigger>
            <SelectContent>
              {filteredFeeStructures.map((structure) => (
                <SelectItem key={structure.id} value={structure.id}>
                  {structure.fee_type} - ₹{structure.amount.toLocaleString()} ({structure.frequency})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
