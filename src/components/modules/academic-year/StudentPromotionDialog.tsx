import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AcademicYear } from "@/types/database";
import { AlertTriangle, CheckCircle, Users, ArrowUp } from "lucide-react";
import { StudentPromotionPreview } from "./StudentPromotionPreview";
import { StudentPromotionIndividual } from "./StudentPromotionIndividual";

interface StudentPromotionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetAcademicYear: AcademicYear;
  currentAcademicYear: AcademicYear;
}

interface PromotionSummary {
  totalStudents: number;
  missingFeeStructures: string[];
  readyForPromotion: boolean;
}

export function StudentPromotionDialog({ 
  open, 
  onOpenChange, 
  targetAcademicYear, 
  currentAcademicYear 
}: StudentPromotionDialogProps) {
  const [promotionSummary, setPromotionSummary] = useState<PromotionSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [promotionMode, setPromotionMode] = useState<'bulk' | 'individual'>('bulk');
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      checkPromotionReadiness();
    }
  }, [open, targetAcademicYear.id]);

  const checkPromotionReadiness = async () => {
    setLoading(true);
    try {
      // Get total active students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, class_id, classes(name, section)')
        .eq('status', 'Active');

      if (studentsError) throw studentsError;

      // Get all classes that have active students
      const classIds = [...new Set(studentsData?.map(s => s.class_id) || [])];

      // Check fee structures for target academic year
      const { data: feeStructuresData, error: feeError } = await supabase
        .from('fee_structures')
        .select('class_id, classes(name, section)')
        .eq('academic_year_id', targetAcademicYear.id)
        .eq('is_active', true)
        .in('class_id', classIds);

      if (feeError) throw feeError;

      const feeStructureClassIds = feeStructuresData?.map(fs => fs.class_id) || [];
      const missingFeeStructureClasses = classIds.filter(classId => 
        !feeStructureClassIds.includes(classId)
      );

      // Get class names for missing fee structures
      const { data: missingClassesData, error: missingClassesError } = await supabase
        .from('classes')
        .select('name, section')
        .in('id', missingFeeStructureClasses);

      if (missingClassesError) throw missingClassesError;

      const missingFeeStructures = missingClassesData?.map(cls => 
        `${cls.name}${cls.section ? ` (${cls.section})` : ''}`
      ) || [];

      setPromotionSummary({
        totalStudents: studentsData?.length || 0,
        missingFeeStructures,
        readyForPromotion: missingFeeStructures.length === 0
      });
    } catch (error: any) {
      console.error('Error checking promotion readiness:', error);
      toast({
        title: "Error",
        description: "Failed to check promotion readiness",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !promotionSummary) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUp className="w-5 h-5" />
            Student Promotion to {targetAcademicYear.year_name}
          </DialogTitle>
          <DialogDescription>
            Promote students from {currentAcademicYear.year_name} to {targetAcademicYear.year_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Promotion Status Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Promotion Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {promotionSummary.totalStudents}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Students</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    <Badge variant={promotionSummary.readyForPromotion ? "default" : "destructive"}>
                      {promotionSummary.readyForPromotion ? (
                        <CheckCircle className="w-4 h-4 mr-1" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 mr-1" />
                      )}
                      {promotionSummary.readyForPromotion ? "Ready" : "Not Ready"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">Promotion Status</div>
                </div>
              </div>

              {!promotionSummary.readyForPromotion && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium">Missing Fee Structures</div>
                    <div className="mt-1">
                      Please define fee structures for {targetAcademicYear.year_name} for the following classes:
                    </div>
                    <ul className="mt-2 list-disc list-inside">
                      {promotionSummary.missingFeeStructures.map((className, index) => (
                        <li key={index}>{className}</li>
                      ))}
                    </ul>
                    <div className="mt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open('/fee-structure', '_blank')}
                      >
                        Go to Fee Structure Management
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Promotion Mode Tabs */}
          {promotionSummary.readyForPromotion && (
            <Tabs value={promotionMode} onValueChange={(value) => setPromotionMode(value as 'bulk' | 'individual')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="bulk">Bulk Promotion</TabsTrigger>
                <TabsTrigger value="individual">Individual Review</TabsTrigger>
              </TabsList>

              <TabsContent value="bulk" className="mt-6">
                <StudentPromotionPreview
                  targetAcademicYear={targetAcademicYear}
                  currentAcademicYear={currentAcademicYear}
                  onSuccess={() => {
                    onOpenChange(false);
                    toast({
                      title: "Success",
                      description: "Students promoted successfully",
                    });
                  }}
                />
              </TabsContent>

              <TabsContent value="individual" className="mt-6">
                <StudentPromotionIndividual
                  targetAcademicYear={targetAcademicYear}
                  currentAcademicYear={currentAcademicYear}
                  onSuccess={() => {
                    onOpenChange(false);
                    toast({
                      title: "Success",
                      description: "Students promoted successfully",
                    });
                  }}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}