import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AcademicYear } from "@/types/database";
import { Loader2, Search } from "lucide-react";

interface StudentPromotionIndividualProps {
  targetAcademicYear: AcademicYear;
  currentAcademicYear: AcademicYear;
  onSuccess: () => void;
}

interface StudentRecord {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  class_id: string;
  className: string;
  promotionType: 'promoted' | 'repeated' | 'dropout';
  targetClassId: string | null;
  reason: string;
  notes: string;
}

export function StudentPromotionIndividual({ 
  targetAcademicYear, 
  currentAcademicYear, 
  onSuccess 
}: StudentPromotionIndividualProps) {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadStudentsAndClasses();
  }, []);

  const loadStudentsAndClasses = async () => {
    setLoading(true);
    try {
      // Load students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          first_name,
          last_name,
          admission_number,
          class_id,
          classes(name, section)
        `)
        .eq('status', 'Active')
        .order('first_name');

      if (studentsError) throw studentsError;

      // Load all classes
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('id, name, section')
        .order('name');

      if (classesError) throw classesError;

      // Helper to compute the next class id based on class naming (e.g., "Class 1" -> "Class 2")
      const getNextClassId = (currentClassId: string) => {
        const currentClass = (classesData || []).find((c: any) => c.id === currentClassId);
        if (!currentClass) return currentClassId;

        const currentNumber = parseInt(String(currentClass.name).replace(/\D/g, ''));
        const nextNumber = isNaN(currentNumber) ? NaN : currentNumber + 1;
        const nextClassName = isNaN(nextNumber)
          ? currentClass.name
          : String(currentClass.name).replace(/\d+/, nextNumber.toString());

        const nextClass = (classesData || []).find((c: any) => 
          c.name === nextClassName && c.section === currentClass.section
        );

        return nextClass?.id || currentClassId; // Fallback to same class if next not found
      };

      const studentRecords: StudentRecord[] = studentsData?.map(student => ({
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        admission_number: student.admission_number,
        class_id: student.class_id,
        className: `${student.classes?.name}${student.classes?.section ? ` (${student.classes.section})` : ''}`,
        promotionType: 'promoted',
        // Default target to the next class automatically for promoted
        targetClassId: getNextClassId(student.class_id),
        reason: '',
        notes: ''
      })) || [];

      setStudents(studentRecords);
      setClasses(classesData || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load students and classes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStudent = (studentId: string, field: keyof StudentRecord, value: any) => {
    setStudents(prev => prev.map(student => 
      student.id === studentId 
        ? { ...student, [field]: value }
        : student
    ));
  };

  const executeIndividualPromotion = async () => {
    setPromoting(true);
    try {
      const promotionData = students.map(student => ({
        student_id: student.id,
        from_academic_year_id: currentAcademicYear.id,
        from_class_id: student.class_id,
        to_class_id: student.promotionType === 'dropout' ? null : student.targetClassId,
        promotion_type: student.promotionType,
        reason: student.reason || `${student.promotionType} decision`,
        notes: student.notes
      }));

      const { data: result, error: promotionError } = await supabase
        .rpc('promote_students_with_fees', {
          promotion_data: JSON.stringify(promotionData),
          target_academic_year_id: targetAcademicYear.id,
          promoted_by_user: 'Admin',
          idempotency_key: `individual:${currentAcademicYear.id}:${targetAcademicYear.id}:${Date.now()}`
        });

      if (promotionError) throw promotionError;

      // Set the target academic year as current with better error handling
      console.log('Setting academic year as current:', targetAcademicYear.id, targetAcademicYear.year_name);
      
      // First, set all other academic years to not current
      const { error: updateOthersError } = await supabase
        .from('academic_years')
        .update({ is_current: false })
        .neq('id', targetAcademicYear.id);

      if (updateOthersError) {
        console.error('Error updating other academic years:', updateOthersError);
        throw new Error(`Failed to update other academic years: ${updateOthersError.message}`);
      }

      // Then, set the target academic year as current
      const { error: updateCurrentError } = await supabase
        .from('academic_years')
        .update({ is_current: true })
        .eq('id', targetAcademicYear.id);

      if (updateCurrentError) {
        console.error('Error setting current academic year:', updateCurrentError);
        throw new Error(`Failed to set current academic year: ${updateCurrentError.message}`);
      }

      // Verify the update was successful
      const { data: verifyData, error: verifyError } = await supabase
        .from('academic_years')
        .select('id, year_name, is_current')
        .eq('id', targetAcademicYear.id)
        .single();

      if (verifyError) {
        console.error('Error verifying academic year update:', verifyError);
        throw new Error(`Failed to verify academic year update: ${verifyError.message}`);
      }

      if (!verifyData?.is_current) {
        throw new Error('Academic year was not properly set as current');
      }

      console.log('Successfully updated academic year to current:', targetAcademicYear.year_name);
      console.log('Verification result:', verifyData);

      toast({
        title: "Promotion Complete",
        description: `Successfully processed ${students.length} students. ${targetAcademicYear.year_name} is now the current academic year.`,
      });

      // Force a page refresh to ensure all components reflect the new current academic year
      setTimeout(() => {
        window.location.reload();
      }, 1000);

      onSuccess();
    } catch (error: any) {
      console.error('Error executing individual promotion:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to execute promotion",
        variant: "destructive",
      });
    } finally {
      setPromoting(false);
    }
  };

  const filteredStudents = students.filter(student => 
    student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.admission_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.className.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Individual Student Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Current Class</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target Class</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {student.first_name} {student.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {student.admission_number}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{student.className}</Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={student.promotionType}
                          onValueChange={(value) => updateStudent(student.id, 'promotionType', value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="promoted">Promote</SelectItem>
                            <SelectItem value="repeated">Repeat</SelectItem>
                            <SelectItem value="dropout">Dropout</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {student.promotionType !== 'dropout' ? (
                          <Select
                            value={student.targetClassId || ''}
                            onValueChange={(value) => updateStudent(student.id, 'targetClassId', value)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                            <SelectContent>
                              {classes.map((cls) => (
                                <SelectItem key={cls.id} value={cls.id}>
                                  {cls.name}{cls.section ? ` (${cls.section})` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Reason..."
                          value={student.reason}
                          onChange={(e) => updateStudent(student.id, 'reason', e.target.value)}
                          className="w-32"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                onClick={executeIndividualPromotion} 
                disabled={promoting}
                size="lg"
              >
                {promoting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing Promotions...
                  </>
                ) : (
                  'Execute Individual Promotions'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
