
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, GraduationCap, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Class, Subject, StudentBasic } from "@/types/database";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface Exam {
  id: string;
  name: string;
  exam_date: string;
  class_id: string;
  created_at: string;
  class?: Class;
}

interface Grade {
  id: string;
  exam_id: string;
  student_id: string;
  subject_id: string;
  score: number;
  grade: string;
  remarks?: string;
  student?: StudentBasic;
  subject?: Subject;
}

interface ExamFormData {
  name: string;
  exam_date: string;
  class_id: string;
}

interface GradeFormData {
  student_id: string;
  subject_id: string;
  score: number;
  remarks?: string;
}

export function ExamGrading() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<StudentBasic[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [examDialogOpen, setExamDialogOpen] = useState(false);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const { toast } = useToast();

  const examForm = useForm<ExamFormData>({
    defaultValues: {
      name: "",
      exam_date: "",
      class_id: "",
    },
  });

  const gradeForm = useForm<GradeFormData>({
    defaultValues: {
      student_id: "",
      subject_id: "",
      score: 0,
      remarks: "",
    },
  });

  useEffect(() => {
    fetchExams();
    fetchClasses();
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedExam) {
      fetchGrades();
      fetchStudentsForExam();
    }
  }, [selectedExam]);

  const calculateGrade = (score: number): string => {
    if (score >= 90) return "A+";
    if (score >= 80) return "A";
    if (score >= 70) return "B+";
    if (score >= 60) return "B";
    if (score >= 50) return "C+";
    if (score >= 40) return "C";
    if (score >= 33) return "D";
    return "F";
  };

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase
        .from("exams")
        .select(`
          *,
          classes(id, name, section)
        `)
        .order("exam_date", { ascending: false });

      if (error) throw error;

      const examsWithClasses = (data || []).map(exam => ({
        ...exam,
        class: exam.classes
      }));

      setExams(examsWithClasses);
    } catch (error: any) {
      toast({
        title: "Error fetching exams",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchGrades = async () => {
    if (!selectedExam) return;

    try {
      const { data, error } = await supabase
        .from("grades")
        .select(`
          *,
          students!inner(id, first_name, last_name, admission_number),
          subjects!inner(id, name, code)
        `)
        .eq("exam_id", selectedExam);

      if (error) throw error;

      const gradesWithDetails = (data || []).map(grade => ({
        ...grade,
        student: grade.students,
        subject: grade.subjects
      }));

      setGrades(gradesWithDetails);
    } catch (error: any) {
      toast({
        title: "Error fetching grades",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .order("name");

      if (error) throw error;
      setClasses(data || []);
    } catch (error: any) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .order("name");

      if (error) throw error;
      setSubjects(data || []);
    } catch (error: any) {
      console.error("Error fetching subjects:", error);
    }
  };

  const fetchStudentsForExam = async () => {
    if (!selectedExam) return;

    try {
      const exam = exams.find(e => e.id === selectedExam);
      if (!exam?.class_id) return;

      const { data, error } = await supabase
        .from("students")
        .select("id, first_name, last_name, admission_number")
        .eq("class_id", exam.class_id)
        .eq("status", "Active")
        .order("first_name");

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      console.error("Error fetching students:", error);
    }
  };

  const onSubmitExam = async (data: ExamFormData) => {
    try {
      const { error } = await supabase
        .from("exams")
        .insert([data]);

      if (error) throw error;

      toast({ title: "Exam created successfully" });
      fetchExams();
      setExamDialogOpen(false);
      examForm.reset();
    } catch (error: any) {
      toast({
        title: "Error creating exam",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const onSubmitGrade = async (data: GradeFormData) => {
    if (!selectedExam) return;

    try {
      const gradeValue = calculateGrade(data.score);
      
      const { error } = await supabase
        .from("grades")
        .insert([{
          ...data,
          exam_id: selectedExam,
          grade: gradeValue
        }]);

      if (error) throw error;

      toast({ title: "Grade recorded successfully" });
      fetchGrades();
      setGradeDialogOpen(false);
      gradeForm.reset();
    } catch (error: any) {
      toast({
        title: "Error recording grade",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredGrades = grades.filter((grade) => {
    if (!grade.student) return false;
    return `${grade.student.first_name} ${grade.student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
           grade.student.admission_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (grade.subject?.name.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const getGradeColor = (grade: string) => {
    if (["A+", "A"].includes(grade)) return "text-green-600";
    if (["B+", "B"].includes(grade)) return "text-blue-600";
    if (["C+", "C"].includes(grade)) return "text-yellow-600";
    if (grade === "D") return "text-orange-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exam & Grading</h1>
          <p className="text-gray-600 mt-2">Manage exams and student grades</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={examDialogOpen} onOpenChange={setExamDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => examForm.reset()}>
                <FileText className="w-4 h-4 mr-2" />
                Create Exam
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Exam</DialogTitle>
                <DialogDescription>
                  Set up a new exam for a class
                </DialogDescription>
              </DialogHeader>
              <Form {...examForm}>
                <form onSubmit={examForm.handleSubmit(onSubmitExam)} className="space-y-4">
                  <FormField
                    control={examForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exam Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Mid-term Exam, Final Exam" required />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={examForm.control}
                    name="exam_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exam Date</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" required />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={examForm.control}
                    name="class_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a class" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {classes.map((classItem) => (
                              <SelectItem key={classItem.id} value={classItem.id}>
                                {classItem.name} {classItem.section && `- ${classItem.section}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setExamDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Exam</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {selectedExam && (
            <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => gradeForm.reset()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Grade
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Grade</DialogTitle>
                  <DialogDescription>
                    Record a grade for the selected exam
                  </DialogDescription>
                </DialogHeader>
                <Form {...gradeForm}>
                  <form onSubmit={gradeForm.handleSubmit(onSubmitGrade)} className="space-y-4">
                    <FormField
                      control={gradeForm.control}
                      name="student_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a student" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {students.map((student) => (
                                <SelectItem key={student.id} value={student.id}>
                                  {student.first_name} {student.last_name} ({student.admission_number})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={gradeForm.control}
                      name="subject_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a subject" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {subjects.map((subject) => (
                                <SelectItem key={subject.id} value={subject.id}>
                                  {subject.name} ({subject.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={gradeForm.control}
                      name="score"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Score (out of 100)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              min="0" 
                              max="100"
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              required 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={gradeForm.control}
                      name="remarks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Remarks (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Additional comments" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setGradeDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Record Grade</Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Exam</CardTitle>
            <CardDescription>Choose an exam to view and manage grades</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedExam} onValueChange={setSelectedExam}>
              <SelectTrigger>
                <SelectValue placeholder="Select an exam" />
              </SelectTrigger>
              <SelectContent>
                {exams.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>
                    {exam.name} - {exam.class?.name} {exam.class?.section && `(${exam.class.section})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedExam && (
          <Card>
            <CardHeader>
              <CardTitle>Exam Statistics</CardTitle>
              <CardDescription>Overview of grades for this exam</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold">{grades.length}</div>
                  <div className="text-sm text-gray-600">Total Grades</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {grades.length > 0 ? Math.round(grades.reduce((sum, g) => sum + g.score, 0) / grades.length) : 0}%
                  </div>
                  <div className="text-sm text-gray-600">Average Score</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedExam && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Grades</CardTitle>
                <CardDescription>Manage grades for the selected exam</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGrades.map((grade) => (
                  <TableRow key={grade.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="w-4 h-4 text-blue-600" />
                        <div>
                          <div className="font-medium">
                            {grade.student ? `${grade.student.first_name} ${grade.student.last_name}` : "Unknown"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {grade.student?.admission_number}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{grade.subject?.name}</TableCell>
                    <TableCell className="font-medium">{grade.score}%</TableCell>
                    <TableCell>
                      <Badge className={getGradeColor(grade.grade)} variant="outline">
                        {grade.grade}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {grade.remarks || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredGrades.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No grades recorded for this exam yet
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
