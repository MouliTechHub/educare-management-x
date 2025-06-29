
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Edit, Trash2 } from "lucide-react";
import { Teacher } from "@/types/database";

interface TeacherTableProps {
  teachers: Teacher[];
  onEditTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (id: string) => void;
}

export function TeacherTable({ teachers, onEditTeacher, onDeleteTeacher }: TeacherTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Employee ID</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Designation</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {teachers.map((teacher) => (
          <TableRow key={teacher.id}>
            <TableCell>
              <div className="flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-green-600" />
                <span className="font-medium">{teacher.first_name} {teacher.last_name}</span>
              </div>
            </TableCell>
            <TableCell>{teacher.employee_id || "N/A"}</TableCell>
            <TableCell>{teacher.email}</TableCell>
            <TableCell>{teacher.phone_number}</TableCell>
            <TableCell>{teacher.department || "N/A"}</TableCell>
            <TableCell>{teacher.designation || "N/A"}</TableCell>
            <TableCell>
              <Badge variant={teacher.status === "Active" ? "default" : "secondary"}>
                {teacher.status}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditTeacher(teacher)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteTeacher(teacher.id)}
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
