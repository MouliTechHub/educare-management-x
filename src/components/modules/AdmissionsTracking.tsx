import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, UserMinus, Download, Calendar, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AdmissionRecord {
  id: string;
  student_id: string;
  academic_year_id: string;
  enrollment_date: string;
  departure_date?: string;
  departure_reason?: string;
  status: string;
  student: {
    first_name: string;
    last_name: string;
    admission_number: string;
    date_of_join: string;
  };
  academic_year: {
    year_name: string;
  };
  class: {
    name: string;
    section?: string;
  };
}

interface AcademicYear {
  id: string;
  year_name: string;
  is_current: boolean;
}

export function AdmissionsTracking() {
  const [admissionRecords, setAdmissionRecords] = useState<AdmissionRecord[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [dropoutDialog, setDropoutDialog] = useState(false);
  const [dropoutReason, setDropoutReason] = useState("");
  const [dropoutNotes, setDropoutNotes] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchAdmissionRecords();
    }
  }, [selectedYear]);

  const fetchAcademicYears = async () => {
    try {
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;

      setAcademicYears(data || []);
      
      // Set current year as default
      const currentYear = data?.find(year => year.is_current);
      if (currentYear) {
        setSelectedYear(currentYear.id);
      }
    } catch (error: any) {
      console.error('Error fetching academic years:', error);
      toast({
        title: "Error",
        description: "Failed to fetch academic years",
        variant: "destructive",
      });
    }
  };

  const fetchAdmissionRecords = async () => {
    if (!selectedYear) return;
    
    setLoading(true);
    try {
      console.log('🔍 Fetching admission records for year:', selectedYear);

      // First get the academic records
      const { data: records, error: recordsError } = await supabase
        .from('student_academic_records')
        .select('*')
        .eq('academic_year_id', selectedYear);

      if (recordsError) throw recordsError;

      if (!records || records.length === 0) {
        setAdmissionRecords([]);
        return;
      }

      // Get student data
      const studentIds = records.map(r => r.student_id);
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, first_name, last_name, admission_number, date_of_join')
        .in('id', studentIds);

      if (studentsError) throw studentsError;

      // Get academic year data
      const { data: academicYear, error: yearError } = await supabase
        .from('academic_years')
        .select('id, year_name')
        .eq('id', selectedYear)
        .single();

      if (yearError) throw yearError;

      // Get class data
      const classIds = records.map(r => r.class_id).filter(Boolean);
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('id, name, section')
        .in('id', classIds);

      if (classesError) throw classesError;

      // Combine data to match interface
      const transformedData = records.map(record => {
        const student = students?.find(s => s.id === record.student_id);
        const classData = classes?.find(c => c.id === record.class_id);
        
        return {
          id: record.id,
          student_id: record.student_id,
          academic_year_id: record.academic_year_id,
          enrollment_date: record.enrollment_date,
          departure_date: record.departure_date,
          departure_reason: record.departure_reason,
          status: record.status,
          student: student || { first_name: '', last_name: '', admission_number: '', date_of_join: '' },
          academic_year: academicYear,
          class: classData || { name: 'N/A', section: null }
        };
      });

      console.log('📊 Admission records loaded:', transformedData.length);
      setAdmissionRecords(transformedData);

    } catch (error: any) {
      console.error('❌ Error fetching admission records:', error);
      toast({
        title: "Error",
        description: "Failed to fetch admission records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDropout = async () => {
    if (!selectedStudent || !dropoutReason) return;

    try {
      const dropoutDate = new Date().toISOString().split('T')[0];

      // Update student status to inactive
      const { error: studentError } = await supabase
        .from('students')
        .update({ status: 'Inactive' })
        .eq('id', selectedStudent.student_id);

      if (studentError) throw studentError;

      // Update academic record with departure info
      const { error: recordError } = await supabase
        .from('student_academic_records')
        .update({
          departure_date: dropoutDate,
          departure_reason: dropoutReason,
          status: 'Departed'
        })
        .eq('id', selectedStudent.id);

      if (recordError) throw recordError;

      toast({
        title: "Student Marked as Dropout",
        description: `${selectedStudent.student.first_name} ${selectedStudent.student.last_name} has been marked as dropout`,
      });

      setDropoutDialog(false);
      setDropoutReason("");
      setDropoutNotes("");
      setSelectedStudent(null);
      fetchAdmissionRecords();

    } catch (error: any) {
      console.error('Error marking dropout:', error);
      toast({
        title: "Error",
        description: "Failed to mark student as dropout",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Departed': return 'bg-red-100 text-red-800';
      case 'Transferred': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRecords = admissionRecords.filter(record => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      record.student.first_name.toLowerCase().includes(searchLower) ||
      record.student.last_name.toLowerCase().includes(searchLower) ||
      record.student.admission_number.toLowerCase().includes(searchLower)
    );
  });

  const newAdmissions = filteredRecords.filter(r => 
    r.enrollment_date && new Date(r.enrollment_date).getFullYear() === new Date().getFullYear()
  );
  
  const departures = filteredRecords.filter(r => r.status === 'Departed');
  const activeStudents = filteredRecords.filter(r => r.status === 'Active');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admissions & Departures Tracking</h1>
          <p className="text-muted-foreground mt-2">Track student admissions and departures by academic year</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Academic Year" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((year) => (
                <SelectItem key={year.id} value={year.id}>
                  {year.year_name} {year.is_current && "(Current)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredRecords.length}</div>
            <p className="text-xs text-muted-foreground">All records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <UserPlus className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeStudents.length}</div>
            <p className="text-xs text-muted-foreground">Currently enrolled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Admissions</CardTitle>
            <UserPlus className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{newAdmissions.length}</div>
            <p className="text-xs text-muted-foreground">This year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departures</CardTitle>
            <UserMinus className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{departures.length}</div>
            <p className="text-xs text-muted-foreground">Students left</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Student Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or admission number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Admission Number</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Enrollment Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Departure Date</TableHead>
                  <TableHead>Departure Reason</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {record.student.first_name} {record.student.last_name}
                    </TableCell>
                    <TableCell>{record.student.admission_number}</TableCell>
                    <TableCell>
                      {record.class ? `${record.class.name}${record.class.section ? ` ${record.class.section}` : ''}` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {record.enrollment_date ? new Date(record.enrollment_date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(record.status)}>
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {record.departure_date ? new Date(record.departure_date).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      {record.departure_reason || '-'}
                    </TableCell>
                    <TableCell>
                      {record.status === 'Active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedStudent(record);
                            setDropoutDialog(true);
                          }}
                        >
                          <UserMinus className="w-3 h-3 mr-1" />
                          Mark Dropout
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dropout Dialog */}
      <Dialog open={dropoutDialog} onOpenChange={setDropoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Student as Dropout</DialogTitle>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded">
                <h4 className="font-medium">
                  {selectedStudent.student.first_name} {selectedStudent.student.last_name}
                </h4>
                <p className="text-sm text-muted-foreground">
                  Admission Number: {selectedStudent.student.admission_number}
                </p>
              </div>

              <div>
                <Label htmlFor="dropoutReason">Reason for Departure *</Label>
                <Select value={dropoutReason} onValueChange={setDropoutReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Financial Issues">Financial Issues</SelectItem>
                    <SelectItem value="Relocation">Relocation</SelectItem>
                    <SelectItem value="Academic Issues">Academic Issues</SelectItem>
                    <SelectItem value="Disciplinary Issues">Disciplinary Issues</SelectItem>
                    <SelectItem value="Health Issues">Health Issues</SelectItem>
                    <SelectItem value="Transfer to Another School">Transfer to Another School</SelectItem>
                    <SelectItem value="Personal Reasons">Personal Reasons</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dropoutNotes">Additional Notes</Label>
                <Textarea
                  id="dropoutNotes"
                  value={dropoutNotes}
                  onChange={(e) => setDropoutNotes(e.target.value)}
                  placeholder="Any additional information..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setDropoutDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleMarkDropout}
                  disabled={!dropoutReason}
                  variant="destructive"
                >
                  Mark as Dropout
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}