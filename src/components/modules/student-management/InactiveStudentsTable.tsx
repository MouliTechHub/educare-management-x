import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { RotateCcw, CreditCard, Receipt, History } from "lucide-react";
import { InactiveStudent } from "./utils/inactiveStudentFetcher";

interface InactiveStudentsTableProps {
  students: InactiveStudent[];
  onReactivateStudent: (id: string) => void;
  onViewFeeHistory: (studentId: string) => void;
  onViewPaymentHistory: (studentId: string) => void;
}

export function InactiveStudentsTable({ 
  students, 
  onReactivateStudent, 
  onViewFeeHistory, 
  onViewPaymentHistory 
}: InactiveStudentsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRowExpansion = (studentId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId);
    } else {
      newExpanded.add(studentId);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Inactive': return 'bg-muted text-muted-foreground';
      case 'Alumni': return 'bg-green-100 text-green-800';
      case 'Transferred': return 'bg-blue-100 text-blue-800';
      case 'Withdrawn': return 'bg-red-100 text-red-800';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Exit Date</TableHead>
            <TableHead>Exit Reason</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No inactive students found
              </TableCell>
            </TableRow>
          ) : (
            students.map((student) => (
              <>
                <TableRow key={student.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {student.anonymized ? `Former Student ${student.id.slice(0, 8)}` : `${student.first_name} ${student.last_name}`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {student.admission_number}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {student.class_name && student.section ? `${student.class_name} ${student.section}` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(student.status)}>
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDate(student.exit_date)}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-32 truncate" title={student.exit_reason || 'N/A'}>
                      {student.exit_reason || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onReactivateStudent(student.id)}
                        className="hover:bg-green-50"
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Reactivate
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewFeeHistory(student.id)}
                      >
                        <CreditCard className="w-4 h-4 mr-1" />
                        Fees
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewPaymentHistory(student.id)}
                      >
                        <Receipt className="w-4 h-4 mr-1" />
                        Payments
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleRowExpansion(student.id)}
                      >
                        <History className="w-4 h-4 mr-1" />
                        Details
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                {expandedRows.has(student.id) && (
                  <TableRow>
                    <TableCell colSpan={6} className="bg-muted/50">
                      <div className="p-4 space-y-3">
                        <h4 className="font-medium text-sm">Additional Information</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Inactive Since:</span>
                            <div className="text-muted-foreground">
                              {formatDateTime(student.inactive_at)}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Last Updated:</span>
                            <div className="text-muted-foreground">
                              {formatDateTime(student.updated_at)}
                            </div>
                          </div>
                          {student.exit_feedback && (
                            <div className="col-span-2">
                              <span className="font-medium">Exit Feedback:</span>
                              <div className="text-muted-foreground mt-1 p-2 bg-background rounded border">
                                {student.exit_feedback}
                              </div>
                            </div>
                          )}
                          {student.reactivated_at && (
                            <div className="col-span-2">
                              <span className="font-medium">Previous Reactivation:</span>
                              <div className="text-muted-foreground">
                                {formatDateTime(student.reactivated_at)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}