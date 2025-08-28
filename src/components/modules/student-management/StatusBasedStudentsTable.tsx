import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, RefreshCw, User, Calendar, FileText } from "lucide-react";
import { StudentWithStatus } from "./utils/statusBasedStudentFetcher";
import { format } from "date-fns";

interface StatusBasedStudentsTableProps {
  students: StudentWithStatus[];
  onReactivateStudent?: (id: string) => void;
  onViewStudent?: (student: StudentWithStatus) => void;
  showReactivateButton?: boolean;
}

export function StatusBasedStudentsTable({ 
  students, 
  onReactivateStudent, 
  onViewStudent,
  showReactivateButton = true 
}: StatusBasedStudentsTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'Alumni':
        return 'bg-blue-100 text-blue-800';
      case 'Transferred':
        return 'bg-purple-100 text-purple-800';
      case 'Withdrawn':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (students.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No students found with this status.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student Details</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Exit Details</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id}>
              <TableCell>
                <div>
                  <div className="font-medium">
                    {student.first_name} {student.last_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {student.admission_number}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {student.gender}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{student.class_name}</div>
                  {student.section && (
                    <div className="text-sm text-muted-foreground">
                      Section: {student.section}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(student.status)}>
                  {student.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {student.exit_reason && (
                    <div className="flex items-center gap-1 text-sm">
                      <FileText className="h-3 w-3" />
                      {student.exit_reason}
                    </div>
                  )}
                  {student.exit_date && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(student.exit_date), 'MMM dd, yyyy')}
                    </div>
                  )}
                  {student.feedback_notes && (
                    <div className="text-sm text-muted-foreground truncate max-w-32">
                      {student.feedback_notes}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewStudent?.(student)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {showReactivateButton && student.status !== 'Active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onReactivateStudent?.(student.id)}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Reactivate
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}