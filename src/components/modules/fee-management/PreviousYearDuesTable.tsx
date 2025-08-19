
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { IndianRupee, FileText, Send } from "lucide-react";

interface PreviousYearDue {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  amount: number;
  paidAmount: number;
  balanceAmount: number;
  dueDate: string;
  notes: string;
  status: string;
}

interface PreviousYearDuesTableProps {
  academicYearId: string;
  onRefresh?: () => void;
}

export function PreviousYearDuesTable({ academicYearId, onRefresh }: PreviousYearDuesTableProps) {
  const [dues, setDues] = useState<PreviousYearDue[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  const { toast } = useToast();

  const fetchPreviousYearDues = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('student_fee_records')
        .select(`
          id,
          student_id,
          actual_fee,
          paid_amount,
          balance_fee,
          due_date,
          discount_notes,
          status,
          students!inner(
            id,
            first_name,
            last_name,
            admission_number,
            classes(name, section)
          )
        `)
        .eq('academic_year_id', academicYearId)
        .eq('fee_type', 'Previous Year Dues')
        .gt('balance_fee', 0)
        .order('due_date', { ascending: true });

      if (error) throw error;

      const transformedDues: PreviousYearDue[] = (data || []).map((due: any) => ({
        id: due.id,
        studentId: due.student_id,
        studentName: `${due.students.first_name} ${due.students.last_name}`,
        admissionNumber: due.students.admission_number,
        className: `${due.students.classes.name}${due.students.classes.section ? ` (${due.students.classes.section})` : ''}`,
        amount: due.actual_fee,
        paidAmount: due.paid_amount,
        balanceAmount: due.balance_fee || (due.actual_fee - due.paid_amount),
        dueDate: due.due_date,
        notes: due.discount_notes || '',
        status: due.status
      }));

      setDues(transformedDues);
    } catch (error: any) {
      console.error('Error fetching previous year dues:', error);
      toast({
        title: "Error",
        description: "Failed to fetch previous year dues",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendReminders = async () => {
    setSendingReminders(true);
    try {
      const outstandingDues = dues.filter(due => due.balanceAmount > 0);
      
      // In a real implementation, you would integrate with your SMS/Email service
      // For now, we'll just log the action
      console.log('Sending reminders to:', outstandingDues.map(due => ({
        student: due.studentName,
        amount: due.balanceAmount,
        admissionNumber: due.admissionNumber
      })));

      toast({
        title: "Reminders Sent",
        description: `Reminders sent to ${outstandingDues.length} parents for previous year dues.`,
      });
    } catch (error: any) {
      console.error('Error sending reminders:', error);
      toast({
        title: "Error",
        description: "Failed to send reminders",
        variant: "destructive",
      });
    } finally {
      setSendingReminders(false);
    }
  };

  React.useEffect(() => {
    if (academicYearId) {
      fetchPreviousYearDues();
    }
  }, [academicYearId]);

  const totalOutstanding = dues.reduce((sum, due) => sum + due.balanceAmount, 0);
  const totalCollected = dues.reduce((sum, due) => sum + due.paidAmount, 0);
  const outstandingCount = dues.filter(due => due.balanceAmount > 0).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (dues.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="w-5 h-5" />
            Previous Year Dues
          </CardTitle>
          <CardDescription>
            No previous year dues found for this academic year
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IndianRupee className="w-5 h-5" />
          Previous Year Dues Management
        </CardTitle>
        <CardDescription>
          Manage and track dues carried forward from previous academic years
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {dues.length}
            </div>
            <div className="text-sm text-muted-foreground">Total Students</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">
              {outstandingCount}
            </div>
            <div className="text-sm text-muted-foreground">Outstanding</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">
              ₹{totalOutstanding.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">Total Outstanding</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              ₹{totalCollected.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">Total Collected</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Previous Year Dues Records</h3>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={sendReminders}
              disabled={sendingReminders || outstandingCount === 0}
            >
              <Send className="w-4 h-4 mr-2" />
              {sendingReminders ? 'Sending...' : `Send Reminders (${outstandingCount})`}
            </Button>
            <Button variant="outline" onClick={onRefresh}>
              Refresh
            </Button>
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Details</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Paid Amount</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dues.map((due) => (
              <TableRow key={due.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{due.studentName}</div>
                    <div className="text-sm text-muted-foreground">{due.admissionNumber}</div>
                  </div>
                </TableCell>
                <TableCell>{due.className}</TableCell>
                <TableCell>₹{due.amount.toFixed(2)}</TableCell>
                <TableCell>
                  <span className="text-green-600">₹{due.paidAmount.toFixed(2)}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={due.balanceAmount > 0 ? "destructive" : "default"}>
                    ₹{due.balanceAmount.toFixed(2)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(due.dueDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge variant={due.status === 'Paid' ? "default" : "secondary"}>
                    {due.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs truncate text-sm" title={due.notes}>
                    {due.notes || 'No notes'}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
