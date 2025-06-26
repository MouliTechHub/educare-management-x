
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, User, Calendar, Users, DollarSign, History, ExternalLink } from "lucide-react";
import { Student } from "@/types/database";
import { StudentPaymentHistory } from "./StudentPaymentHistory";

interface StudentTableProps {
  students: Student[];
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onViewParent?: (parentId: string) => void;
}

export function StudentTable({ students, onEditStudent, onDeleteStudent, onViewParent }: StudentTableProps) {
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
            <TableHead>Total Paid</TableHead>
            <TableHead>Pending</TableHead>
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
                {student.parents && student.parents.length > 0 ? (
                  <div className="space-y-1">
                    {student.parents.map((parent, index) => (
                      <div key={parent.id} className="flex items-center space-x-1 text-sm">
                        <Users className="w-3 h-3 text-green-600" />
                        <button
                          onClick={() => handleParentClick(parent.id, `${parent.first_name} ${parent.last_name}`)}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1"
                        >
                          <span>{parent.first_name} {parent.last_name}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                        <span className="text-gray-500">({parent.relation})</span>
                        {index < student.parents!.length - 1 && <span className="text-gray-300">|</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400 flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>No parents linked</span>
                  </span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{new Date(student.date_of_birth).toLocaleDateString()}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1 text-green-600">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-medium">₹{(student.total_paid || 0).toLocaleString()}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-4 h-4 text-orange-500" />
                  <span className={`font-medium ${(student.total_pending || 0) > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                    ₹{(student.total_pending || 0).toLocaleString()}
                  </span>
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
                    onClick={() => openPaymentHistory(student)}
                    title="View Payment History"
                  >
                    <History className="w-4 h-4" />
                  </Button>
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

      {selectedStudent && (
        <StudentPaymentHistory
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          studentName={`${selectedStudent.first_name} ${selectedStudent.last_name}`}
          fees={selectedStudent.fees || []}
        />
      )}
    </>
  );
}
