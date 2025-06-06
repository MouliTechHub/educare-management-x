
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, XCircle, Clock, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { StudentBasic, Class } from "@/types/database";

interface AttendanceRecord {
  student_id: string;
  status: "Present" | "Absent" | "Late";
  remarks?: string;
}

interface StudentAttendance extends StudentBasic {
  status?: "Present" | "Absent" | "Late";
  remarks?: string;
}

export function AttendanceTracking() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedDate) {
      fetchStudentsAndAttendance();
    }
  }, [selectedClass, selectedDate]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .order("name");

      if (error) throw error;
      setClasses(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching classes",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchStudentsAndAttendance = async () => {
    setLoading(true);
    try {
      // Fetch students in the selected class
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("id, first_name, last_name, admission_number")
        .eq("class_id", selectedClass)
        .eq("status", "Active")
        .order("first_name");

      if (studentsError) throw studentsError;

      // Fetch existing attendance for the selected date
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendance")
        .select("*")
        .eq("class_id", selectedClass)
        .eq("date", selectedDate);

      if (attendanceError) throw attendanceError;

      // Merge student data with attendance data
      const studentsWithAttendance = (studentsData || []).map(student => {
        const attendance = attendanceData?.find(att => att.student_id === student.id);
        return {
          ...student,
          status: attendance?.status as "Present" | "Absent" | "Late" || "Present",
          remarks: attendance?.remarks || ""
        };
      });

      setStudents(studentsWithAttendance);
    } catch (error: any) {
      toast({
        title: "Error fetching attendance data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStudentAttendance = (studentId: string, field: "status" | "remarks", value: string) => {
    setStudents(prev => prev.map(student => 
      student.id === studentId 
        ? { ...student, [field]: value }
        : student
    ));
  };

  const markAllPresent = () => {
    setStudents(prev => prev.map(student => ({
      ...student,
      status: "Present" as const,
      remarks: ""
    })));
  };

  const saveAttendance = async () => {
    if (!selectedClass || !selectedDate) {
      toast({
        title: "Missing information",
        description: "Please select a class and date",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Delete existing attendance records for this class and date
      await supabase
        .from("attendance")
        .delete()
        .eq("class_id", selectedClass)
        .eq("date", selectedDate);

      // Insert new attendance records
      const attendanceRecords = students.map(student => ({
        student_id: student.id,
        class_id: selectedClass,
        date: selectedDate,
        status: student.status || "Present",
        remarks: student.remarks || null
      }));

      const { error } = await supabase
        .from("attendance")
        .insert(attendanceRecords);

      if (error) throw error;

      toast({
        title: "Attendance saved successfully",
        description: `Saved attendance for ${students.length} students`,
      });
    } catch (error: any) {
      toast({
        title: "Error saving attendance",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Present":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "Absent":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "Late":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Present":
        return "default";
      case "Absent":
        return "destructive";
      case "Late":
        return "secondary";
      default:
        return "default";
    }
  };

  const attendanceStats = {
    present: students.filter(s => s.status === "Present").length,
    absent: students.filter(s => s.status === "Absent").length,
    late: students.filter(s => s.status === "Late").length,
    total: students.length
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Tracking</h1>
          <p className="text-gray-600 mt-2">Mark and manage student attendance</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={markAllPresent}
            variant="outline"
            disabled={!selectedClass || students.length === 0}
          >
            Mark All Present
          </Button>
          <Button
            onClick={saveAttendance}
            disabled={!selectedClass || students.length === 0 || saving}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Attendance"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{attendanceStats.present}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{attendanceStats.absent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Late</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{attendanceStats.late}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceStats.total}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daily Attendance</CardTitle>
              <CardDescription>Select class and date to mark attendance</CardDescription>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-40"
                />
              </div>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.name} {classItem.section && `- ${classItem.section}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : students.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Admission No.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(student.status || "Present")}
                        <span className="font-medium">
                          {student.first_name} {student.last_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{student.admission_number}</TableCell>
                    <TableCell>
                      <Select
                        value={student.status || "Present"}
                        onValueChange={(value) => updateStudentAttendance(student.id, "status", value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Present">Present</SelectItem>
                          <SelectItem value="Absent">Absent</SelectItem>
                          <SelectItem value="Late">Late</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Add remarks..."
                        value={student.remarks || ""}
                        onChange={(e) => updateStudentAttendance(student.id, "remarks", e.target.value)}
                        className="w-48"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {selectedClass ? "No students found in this class" : "Please select a class to view students"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
