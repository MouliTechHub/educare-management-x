
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Users, BookOpen } from "lucide-react";
import { Class } from "@/types/database";

interface ClassWithDetails extends Class {
  teacher?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  student_count?: number;
}

interface ClassTableProps {
  classes: ClassWithDetails[];
  onEdit: (classItem: Class) => void;
  onDelete: (id: string) => void;
}

export function ClassTable({ classes, onEdit, onDelete }: ClassTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Class</TableHead>
          <TableHead>Section</TableHead>
          <TableHead>Homeroom Teacher</TableHead>
          <TableHead>Students</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {classes.map((classItem) => (
          <TableRow key={classItem.id}>
            <TableCell>
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span className="font-medium">{classItem.name}</span>
              </div>
            </TableCell>
            <TableCell>
              {classItem.section ? (
                <Badge variant="outline">{classItem.section}</Badge>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </TableCell>
            <TableCell>
              {classItem.teacher ? (
                `${classItem.teacher.first_name} ${classItem.teacher.last_name}`
              ) : (
                <span className="text-gray-400">Not assigned</span>
              )}
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4 text-gray-400" />
                <span>{classItem.student_count || 0}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(classItem)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(classItem.id)}
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
