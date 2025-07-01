
import { Button } from "@/components/ui/button";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Student, Class } from "@/types/database";
import { BasicInformationSection } from "./BasicInformationSection";
import { AddressSection } from "./AddressSection";
import { AcademicSection } from "./AcademicSection";
import { TransportSection } from "./TransportSection";
import { EmergencyContactSection } from "./EmergencyContactSection";
import { MedicalSection } from "./MedicalSection";
import { ParentFormSection } from "./ParentFormSection";
import { PostCreationDialog } from "./components/PostCreationDialog";
import { useStudentFormData } from "./hooks/useStudentFormData";
import { useStudentFormSubmission } from "./hooks/useStudentFormSubmission";
import { usePostStudentCreation } from "./hooks/usePostStudentCreation";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface StudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStudent: Student | null;
  classes: Class[];
  onStudentSaved: () => void;
}

interface PostCreationActions {
  createDefaultAcademicRecord: boolean;
  assignToCurrentYear: boolean;
  createInitialAttendanceRecord: boolean;
  notifyParents: boolean;
}

export function StudentForm({ open, onOpenChange, selectedStudent, classes, onStudentSaved }: StudentFormProps) {
  const [showPostCreationDialog, setShowPostCreationDialog] = useState(false);
  const [createdStudentData, setCreatedStudentData] = useState<{
    id: string;
    name: string;
    classId: string;
  } | null>(null);

  const { formData, setFormData, parents, setParents } = useStudentFormData(selectedStudent, open);
  const { handleSubmit, loading } = useStudentFormSubmission({
    selectedStudent,
    onStudentSaved: (studentData?: any) => {
      if (!selectedStudent && studentData) {
        // New student was created, show post-creation dialog
        setCreatedStudentData({
          id: studentData.id,
          name: `${studentData.first_name} ${studentData.last_name}`,
          classId: studentData.class_id
        });
        setShowPostCreationDialog(true);
      } else {
        // Student was updated, just refresh
        onStudentSaved();
      }
    },
    onOpenChange
  });
  const { handlePostStudentCreation, processing } = usePostStudentCreation();
  const { toast } = useToast();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate parent data before submission if we have parents
    if (!selectedStudent && parents.length > 0) {
      const validateParentData = (window as any).validateParentData;
      if (validateParentData && !validateParentData()) {
        toast({
          title: "Validation Error",
          description: "Please fix the errors in parent information before submitting.",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Convert ParentFormData to Parent format
    const convertedParents = parents.map(parent => ({
      first_name: parent.first_name,
      last_name: parent.last_name,
      relation: parent.relation,
      phone_number: parent.phone_number,
      email: parent.email,
      annual_income: parent.annual_income ? parseFloat(parent.annual_income) : null,
      address_line1: parent.address_line1,
      address_line2: parent.address_line2,
      city: parent.city,
      state: parent.state,
      pin_code: parent.pin_code,
      occupation: parent.occupation,
      employer_name: parent.employer_name,
      employer_address: parent.employer_address,
      alternate_phone: parent.alternate_phone,
    }));

    await handleSubmit(formData, convertedParents);
  };

  const handlePostCreationConfirm = async (actions: PostCreationActions) => {
    if (createdStudentData) {
      await handlePostStudentCreation(
        createdStudentData.id,
        createdStudentData.name,
        createdStudentData.classId,
        actions
      );
      setShowPostCreationDialog(false);
      setCreatedStudentData(null);
      onStudentSaved();
      onOpenChange(false);
    }
  };

  const handlePostCreationSkip = () => {
    setShowPostCreationDialog(false);
    setCreatedStudentData(null);
    onStudentSaved();
    onOpenChange(false);
  };

  return (
    <>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedStudent ? "Edit Student" : "Add New Student"}
          </DialogTitle>
          <DialogDescription>
            {selectedStudent ? "Update student information" : "Enter student and parent details to add to the system"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          <BasicInformationSection formData={formData} setFormData={setFormData} classes={classes} />
          <AddressSection formData={formData} setFormData={setFormData} />
          <AcademicSection formData={formData} setFormData={setFormData} />
          <TransportSection formData={formData} setFormData={setFormData} />
          <EmergencyContactSection formData={formData} setFormData={setFormData} />
          <MedicalSection formData={formData} setFormData={setFormData} />

          {!selectedStudent && (
            <ParentFormSection parents={parents} setParents={setParents} />
          )}

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : selectedStudent ? "Update Student" : "Add Student & Parent(s)"}
            </Button>
          </div>
        </form>
      </DialogContent>

      <PostCreationDialog
        open={showPostCreationDialog}
        onOpenChange={handlePostCreationSkip}
        studentName={createdStudentData?.name || ""}
        onConfirm={handlePostCreationConfirm}
        loading={processing}
      />
    </>
  );
}
