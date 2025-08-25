
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Archive, User, Calendar, Users, DollarSign, History, ExternalLink } from "lucide-react";
import { Student } from "@/types/database";
import { StudentPaymentHistory } from "./StudentPaymentHistory";

interface StudentTableProps {
  students: Student[];
  onEditStudent: (student: Student) => void;
  onArchiveStudent: (id: string) => void;
  onViewParent?: (parentId: string) => void;
}

export function StudentTable({ students, onEditStudent, onArchiveStudent, onViewParent }: StudentTableProps) {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const openPaymentHistory = (student: Student) => {
    setSelectedStudent(student);
    setHistoryOpen(true);
  };

  const handleParentClick = (parentId: string, parentName: string) => {
    if (onViewParent) {
      console.log(`Navigating to parent: ${parentName} (${parentId})`);
      onViewParent(parentId);
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Admission No.</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Parents</TableHead>
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
                  <span className="text-gray-400">No class assigned</span>
                )}
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {student.parents && student.parents.length > 0 ? (
                    student.parents.slice(0, 2).map((parent) => (
                      <div key={parent.id} className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {parent.relation}
                        </Badge>
                        <button
                          onClick={() => handleParentClick(parent.id, `${parent.first_name} ${parent.last_name}`)}
                          className="text-blue-600 hover:underline cursor-pointer flex items-center space-x-1"
                        >
                          <span className="text-xs">{parent.first_name} {parent.last_name}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm">No parents linked</span>
                  )}
                  {student.parents && student.parents.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{student.parents.length - 2} more
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">
                    {new Date(student.date_of_birth).toLocaleDateString()}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={student.status === 'Active' ? 'default' : 'secondary'}
                  className={student.status === 'Active' ? 'bg-green-100 text-green-800' : ''}
                >
                  {student.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
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
                    onClick={() => onArchiveStudent(student.id)}
                    title="Archive Student"
                  >
                    <Archive className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedStudent && (
        <StudentPaymentHistory
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          studentName={`${selectedStudent.first_name} ${selectedStudent.last_name}`}
          fees={[]} // Will be populated when fee history is available
          academicYears={[]}
          selectedAcademicYear=""
        />
      )}
    </>
  );
}
