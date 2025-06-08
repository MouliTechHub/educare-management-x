
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, User, Calendar } from "lucide-react";
import { Student } from "@/types/database";

interface StudentTableProps {
  students: Student[];
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
}

export function StudentTable({ students, onEditStudent, onDeleteStudent }: StudentTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student</TableHead>
          <TableHead>Admission No.</TableHead>
          <TableHead>Class</TableHead>
          <TableHead>Date of Birth</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => (
          <TableRow key={student.id}>
            <TableCell>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="font-medium">{student.first_name} {student.last_name}</div>
                  <div className="text-sm text-gray-500">{student.gender}</div>
                </div>
              </div>
            </TableCell>
            <TableCell>{student.admission_number}</TableCell>
            <TableCell>
              {student.classes ? (
                <span>{student.classes.name} {student.classes.section && `- ${student.classes.section}`}</span>
              ) : (
                <span className="text-gray-400">Not assigned</span>
              )}
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{new Date(student.date_of_birth).toLocaleDateString()}</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={student.status === "Active" ? "default" : "secondary"}>
                {student.status}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditStudent(student)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteStudent(student.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
