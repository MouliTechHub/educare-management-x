import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Users, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Class, Teacher, Subject, TeacherBasic } from "@/types/database";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface ClassFormData {
  name: string;
  section?: string;
  homeroom_teacher_id?: string;
}

interface ClassWithDetails extends Class {
  teacher?: TeacherBasic;
  student_count?: number;
  subjects?: Subject[];
}

export function ClassManagement() {
  const [classes, setClasses] = useState<ClassWithDetails[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const { toast } = useToast();

  const form = useForm<ClassFormData>({
    defaultValues: {
      name: "",
      section: "",
      homeroom_teacher_id: "",
    },
  });

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
    fetchSubjects();
  }, []);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select(`
          *,
          teachers:homeroom_teacher_id (id, first_name, last_name)
        `)
        .order("name");

      if (error) throw error;

      // Get student counts for each class
      const classesWithCounts = await Promise.all(
        (data || []).map(async (classItem) => {
          const { count } = await supabase
            .from("students")
            .select("*", { count: "exact", head: true })
            .eq("class_id", classItem.id);

          return {
            ...classItem,
            student_count: count || 0,
            teacher: classItem.teachers ? {
              id: classItem.teachers.id,
              first_name: classItem.teachers.first_name,
              last_name: classItem.teachers.last_name
            } : undefined
          };
        })
      );

      setClasses(classesWithCounts);
    } catch (error: any) {
      toast({
        title: "Error fetching classes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
      
      // Type cast the status field
      const typedTeachers = (data || []).map(teacher => ({
        ...teacher,
        status: teacher.status as 'Active' | 'On Leave' | 'Retired'
      }));
      
      setTeachers(typedTeachers);
    } catch (error: any) {
      console.error("Error fetching teachers:", error);
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

  const onSubmit = async (data: ClassFormData) => {
    try {
      const classData = {
        ...data,
        homeroom_teacher_id: data.homeroom_teacher_id || null,
      };

      if (selectedClass) {
        const { error } = await supabase
          .from("classes")
          .update(classData)
          .eq("id", selectedClass.id);

        if (error) throw error;
        toast({ title: "Class updated successfully" });
      } else {
        const { error } = await supabase
          .from("classes")
          .insert([classData]);

        if (error) throw error;
        toast({ title: "Class created successfully" });
      }

      fetchClasses();
      setDialogOpen(false);
      setSelectedClass(null);
      form.reset();
    } catch (error: any) {
      toast({
        title: "Error saving class",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteClass = async (id: string) => {
    if (!confirm("Are you sure you want to delete this class?")) return;

    try {
      const { error } = await supabase
        .from("classes")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Class deleted successfully" });
      fetchClasses();
    } catch (error: any) {
      toast({
        title: "Error deleting class",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (classItem: Class) => {
    setSelectedClass(classItem);
    form.reset({
      name: classItem.name,
      section: classItem.section || "",
      homeroom_teacher_id: classItem.homeroom_teacher_id || "",
    });
    setDialogOpen(true);
  };

  const filteredClasses = classes.filter((classItem) =>
    `${classItem.name} ${classItem.section || ""}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold text-gray-900">Class Management</h1>
          <p className="text-gray-600 mt-2">Manage classes, sections, and homeroom teachers</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setSelectedClass(null);
              form.reset();
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Class
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedClass ? "Edit Class" : "Add New Class"}</DialogTitle>
              <DialogDescription>
                {selectedClass ? "Update class information" : "Create a new class with section and homeroom teacher"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Grade 10, Class XII" required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="section"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., A, B, Science" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="homeroom_teacher_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Homeroom Teacher</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a teacher" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No teacher assigned</SelectItem>
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
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {selectedClass ? "Update" : "Create"} Class
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Classes</CardTitle>
              <CardDescription>Manage school classes and sections</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search classes..."
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
                <TableHead>Class</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Homeroom Teacher</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClasses.map((classItem) => (
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
                        onClick={() => openEditDialog(classItem)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteClass(classItem.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
