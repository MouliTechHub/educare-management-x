
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, Calendar, User, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Class, Teacher, Subject } from "@/types/database";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface Timetable {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  day_of_week: string;
  period_number: number;
  start_time: string;
  end_time: string;
  created_at: string;
  class?: Class;
  subject?: Subject;
  teacher?: Teacher;
}

interface TimetableFormData {
  class_id: string;
  subject_id: string;
  teacher_id: string;
  day_of_week: string;
  period_number: number;
  start_time: string;
  end_time: string;
}

const DAYS_OF_WEEK = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export function TimetableScheduling() {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<TimetableFormData>({
    defaultValues: {
      class_id: "",
      subject_id: "",
      teacher_id: "",
      day_of_week: "Monday",
      period_number: 1,
      start_time: "",
      end_time: "",
    },
  });

  useEffect(() => {
    fetchClasses();
    fetchSubjects();
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchTimetables();
    } else {
      setTimetables([]);
    }
  }, [selectedClass]);

  const fetchTimetables = async () => {
    if (!selectedClass) return;

    try {
      const { data, error } = await supabase
        .from("timetables")
        .select(`
          *,
          classes(id, name, section),
          subjects(id, name, code),
          teachers(id, first_name, last_name)
        `)
        .eq("class_id", selectedClass)
        .order("day_of_week")
        .order("period_number");

      if (error) throw error;

      const timetablesWithDetails = (data || []).map(timetable => ({
        ...timetable,
        class: timetable.classes,
        subject: timetable.subjects,
        teacher: timetable.teachers
      }));

      setTimetables(timetablesWithDetails);
    } catch (error: any) {
      toast({
        title: "Error fetching timetables",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .eq("status", "Active")
        .order("first_name");

      if (error) throw error;
      setTeachers(data || []);
    } catch (error: any) {
      console.error("Error fetching teachers:", error);
    }
  };

  const onSubmit = async (data: TimetableFormData) => {
    try {
      // Check for conflicts
      const { data: existing, error: checkError } = await supabase
        .from("timetables")
        .select("*")
        .eq("class_id", data.class_id)
        .eq("day_of_week", data.day_of_week)
        .eq("period_number", data.period_number);

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        toast({
          title: "Schedule conflict",
          description: "This time slot is already occupied for this class",
          variant: "destructive",
        });
        return;
      }

      // Check teacher availability
      const { data: teacherConflict, error: teacherError } = await supabase
        .from("timetables")
        .select("*")
        .eq("teacher_id", data.teacher_id)
        .eq("day_of_week", data.day_of_week)
        .eq("period_number", data.period_number);

      if (teacherError) throw teacherError;

      if (teacherConflict && teacherConflict.length > 0) {
        toast({
          title: "Teacher conflict",
          description: "This teacher is already scheduled at this time",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("timetables")
        .insert([data]);

      if (error) throw error;

      toast({ title: "Timetable entry added successfully" });
      fetchTimetables();
      setDialogOpen(false);
      form.reset();
    } catch (error: any) {
      toast({
        title: "Error adding timetable entry",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteTimetableEntry = async (id: string) => {
    if (!confirm("Are you sure you want to delete this timetable entry?")) return;

    try {
      const { error } = await supabase
        .from("timetables")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Timetable entry deleted successfully" });
      fetchTimetables();
    } catch (error: any) {
      toast({
        title: "Error deleting timetable entry",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getTimetableGrid = () => {
    const grid: { [key: string]: { [key: number]: Timetable | null } } = {};
    
    DAYS_OF_WEEK.forEach(day => {
      grid[day] = {};
      PERIODS.forEach(period => {
        grid[day][period] = timetables.find(
          t => t.day_of_week === day && t.period_number === period
        ) || null;
      });
    });

    return grid;
  };

  const timetableGrid = getTimetableGrid();

  if (loading && selectedClass) {
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
          <h1 className="text-3xl font-bold text-gray-900">Timetable Scheduling</h1>
          <p className="text-gray-600 mt-2">Manage class schedules and periods</p>
        </div>
        {selectedClass && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                form.reset({ ...form.getValues(), class_id: selectedClass });
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Period
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Timetable Entry</DialogTitle>
                <DialogDescription>
                  Schedule a new period for the selected class
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
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
                    control={form.control}
                    name="teacher_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teacher</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a teacher" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {teachers.map((teacher) => (
                              <SelectItem key={teacher.id} value={teacher.id}>
                                {teacher.first_name} {teacher.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="day_of_week"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Day</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DAYS_OF_WEEK.map((day) => (
                                <SelectItem key={day} value={day}>
                                  {day}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="period_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Period</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PERIODS.map((period) => (
                                <SelectItem key={period} value={period.toString()}>
                                  Period {period}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="start_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input {...field} type="time" required />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="end_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input {...field} type="time" required />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Period</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Class Selection</CardTitle>
              <CardDescription>Select a class to view and manage its timetable</CardDescription>
            </div>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a class" />
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
        </CardHeader>
      </Card>

      {selectedClass && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Weekly Timetable</span>
            </CardTitle>
            <CardDescription>
              Schedule for {classes.find(c => c.id === selectedClass)?.name} 
              {classes.find(c => c.id === selectedClass)?.section && 
                ` - ${classes.find(c => c.id === selectedClass)?.section}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Period</TableHead>
                    {DAYS_OF_WEEK.map((day) => (
                      <TableHead key={day} className="text-center min-w-32">
                        {day}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PERIODS.map((period) => (
                    <TableRow key={period}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>P{period}</span>
                        </div>
                      </TableCell>
                      {DAYS_OF_WEEK.map((day) => {
                        const entry = timetableGrid[day][period];
                        return (
                          <TableCell key={`${day}-${period}`} className="p-2">
                            {entry ? (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <Badge variant="outline" className="text-xs">
                                    <BookOpen className="w-3 h-3 mr-1" />
                                    {entry.subject?.code}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 text-red-500 hover:text-red-700"
                                    onClick={() => deleteTimetableEntry(entry.id)}
                                  >
                                    ×
                                  </Button>
                                </div>
                                <div className="text-xs text-gray-600 flex items-center">
                                  <User className="w-3 h-3 mr-1" />
                                  {entry.teacher ? `${entry.teacher.first_name} ${entry.teacher.last_name}` : "TBA"}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {entry.start_time} - {entry.end_time}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center text-gray-400 text-xs py-4">
                                Free
                              </div>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedClass && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No Class Selected</h3>
              <p>Please select a class to view and manage its timetable</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
