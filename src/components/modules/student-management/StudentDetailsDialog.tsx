import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, FileText, User, MapPin, Phone, Mail } from "lucide-react";
import { StudentWithStatus } from "./utils/statusBasedStudentFetcher";
import { format } from "date-fns";

interface StudentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentWithStatus | null;
}

export function StudentDetailsDialog({ open, onOpenChange, student }: StudentDetailsDialogProps) {
  if (!student) return null;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {student.first_name} {student.last_name}
          </DialogTitle>
          <DialogDescription>
            Student Details and Information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Admission Number</label>
                <p className="font-medium">{student.admission_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Gender</label>
                <p className="font-medium">{student.gender}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                <p className="font-medium">
                  {format(new Date(student.date_of_birth), 'MMM dd, yyyy')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Class</label>
                <p className="font-medium">
                  {student.class_name}
                  {student.section && ` - Section ${student.section}`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Current Status
                <Badge className={getStatusColor(student.status)}>
                  {student.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="font-medium">
                    {format(new Date(student.updated_at), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exit Details - Only show if student is not active */}
          {student.status !== 'Active' && (student.exit_reason || student.exit_date || student.feedback_notes) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Exit Details
                </CardTitle>
                <CardDescription>
                  Information about the student's departure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {student.exit_reason && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Exit Reason</label>
                    <p className="font-medium">{student.exit_reason}</p>
                  </div>
                )}
                {student.exit_date && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Exit Date</label>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(student.exit_date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                )}
                {student.feedback_notes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Notes</label>
                    <p className="text-sm bg-muted p-3 rounded-md">
                      {student.feedback_notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}