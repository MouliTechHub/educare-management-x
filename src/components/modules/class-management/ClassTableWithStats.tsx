
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Users, UserCheck, UserX, User } from "lucide-react";
import { ClassWithStats } from "@/types/database";

interface ClassTableWithStatsProps {
  classes: ClassWithStats[];
  onEdit: (cls: ClassWithStats) => void;
  onDelete: (id: string) => void;
}

export function ClassTableWithStats({ classes, onEdit, onDelete }: ClassTableWithStatsProps) {
  if (classes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No classes found. Create one to get started.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Class</TableHead>
            <TableHead>Section</TableHead>
            <TableHead className="text-center">Total Students</TableHead>
            <TableHead className="text-center">Male</TableHead>
            <TableHead className="text-center">Female</TableHead>
            <TableHead className="text-center">Other</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.map((cls) => (
            <TableRow key={cls.id}>
              <TableCell className="font-medium">{cls.name}</TableCell>
              <TableCell>
                {cls.section ? (
                  <Badge variant="outline">{cls.section}</Badge>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">{cls.total_students}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-600">{cls.male_count}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <UserX className="w-4 h-4 text-pink-600" />
                  <span className="font-medium text-pink-600">{cls.female_count}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-gray-600">{cls.other_count}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(cls)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(cls.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
