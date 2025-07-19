import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AcademicYear } from "@/types/database";
import { ArrowRight, Loader2 } from "lucide-react";

interface StudentPromotionPreviewProps {
  targetAcademicYear: AcademicYear;
  currentAcademicYear: AcademicYear;
  onSuccess: () => void;
}

interface PromotionPlan {
  classId: string;
  className: string;
  currentStudents: number;
  targetClassName: string;
  targetClassId: string;
}

export function StudentPromotionPreview({ 
  targetAcademicYear, 
  currentAcademicYear, 
  onSuccess 
}: StudentPromotionPreviewProps) {
  const [promotionPlan, setPromotionPlan] = useState<PromotionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    generatePromotionPlan();
  }, []);

  const generatePromotionPlan = async () => {
    setLoading(true);
    try {
      // Get current class structure with student counts
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          section,
          students!inner(id, status)
        `)
        .eq('students.status', 'Active');

      if (classError) throw classError;

      // Group by class and count students
      const classStudentCounts = classData?.reduce((acc: any, item: any) => {
        const classKey = `${item.name}${item.section ? ` (${item.section})` : ''}`;
        if (!acc[item.id]) {
          acc[item.id] = {
            id: item.id,
            name: item.name,
            section: item.section,
            displayName: classKey,
            studentCount: 0
          };
        }
        acc[item.id].studentCount += item.students.length;
        return acc;
      }, {}) || {};

      // Generate next class mapping (simple increment)
      const plan: PromotionPlan[] = Object.values(classStudentCounts).map((cls: any) => {
        const nextClassNumber = parseInt(cls.name.replace(/\D/g, '')) + 1;
        const nextClassName = cls.name.replace(/\d+/, nextClassNumber.toString());
        
        return {
          classId: cls.id,
          className: cls.displayName,
          currentStudents: cls.studentCount,
          targetClassName: `${nextClassName}${cls.section ? ` (${cls.section})` : ''}`,
          targetClassId: cls.id // This would need proper mapping in real scenario
        };
      });

      setPromotionPlan(plan);
    } catch (error: any) {
      console.error('Error generating promotion plan:', error);
      toast({
        title: "Error",
        description: "Failed to generate promotion plan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const executePromotion = async () => {
    setPromoting(true);
    try {
      // Get all active students with their current classes
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, class_id, classes(name)')
        .eq('status', 'Active');

      if (studentsError) throw studentsError;

      // Get all classes to find next class mapping
      const { data: allClasses, error: classesError } = await supabase
        .from('classes')
        .select('id, name, section')
        .order('name');

      if (classesError) throw classesError;

      // Create a mapping for next class (increment class number)
      const getNextClassId = (currentClassId: string) => {
        const currentClass = allClasses?.find(c => c.id === currentClassId);
        if (!currentClass) return currentClassId;
        
        const currentNumber = parseInt(currentClass.name.replace(/\D/g, ''));
        const nextNumber = currentNumber + 1;
        const nextClassName = currentClass.name.replace(/\d+/, nextNumber.toString());
        
        const nextClass = allClasses?.find(c => 
          c.name === nextClassName && c.section === currentClass.section
        );
        
        return nextClass?.id || currentClassId; // Fallback to same class if next class not found
      };

      // Prepare promotion data
      const promotionData = studentsData?.map(student => ({
        student_id: student.id,
        from_academic_year_id: currentAcademicYear.id,
        from_class_id: student.class_id,
        to_class_id: getNextClassId(student.class_id),
        promotion_type: 'promoted',
        reason: 'Automatic bulk promotion',
        notes: `Promoted from ${currentAcademicYear.year_name} to ${targetAcademicYear.year_name}`
      })) || [];

      // Call the database function to handle promotion with fee creation
      const { data: result, error: promotionError } = await supabase
        .rpc('promote_students_with_fees', {
          promotion_data: JSON.stringify(promotionData),
          target_academic_year_id: targetAcademicYear.id,
          promoted_by_user: 'Admin' // In real app, get from auth context
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

      const promotionResult = result as {
        promoted: number;
        repeated: number;
        dropouts: number;
        errors: string[];
      };

      toast({
        title: "Promotion Complete",
        description: `Successfully promoted ${promotionResult.promoted} students. ${targetAcademicYear.year_name} is now the current academic year.`,
      });

      if (promotionResult.errors && promotionResult.errors.length > 0) {
        console.warn('Promotion errors:', promotionResult.errors);
      }

      // Force a page refresh to ensure all components reflect the new current academic year
      setTimeout(() => {
        window.location.reload();
      }, 1000);

      onSuccess();
    } catch (error: any) {
      console.error('Error executing promotion:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to execute promotion",
        variant: "destructive",
      });
    } finally {
      setPromoting(false);
    }
  };

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
          <CardTitle>Bulk Promotion Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will automatically promote all active students to the next class level and create fee records for the new academic year.
            </p>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Current Class</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead></TableHead>
                  <TableHead>Target Class</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotionPlan.map((plan) => (
                  <TableRow key={plan.classId}>
                    <TableCell className="font-medium">{plan.className}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{plan.currentStudents} students</Badge>
                    </TableCell>
                    <TableCell>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell>{plan.targetClassName}</TableCell>
                    <TableCell>
                      <Badge variant="default">Ready</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                onClick={executePromotion} 
                disabled={promoting}
                size="lg"
              >
                {promoting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Promoting Students...
                  </>
                ) : (
                  'Execute Bulk Promotion'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
