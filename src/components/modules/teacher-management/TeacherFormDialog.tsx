
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Teacher } from "@/types/database";
import { TeacherForm } from "./TeacherForm";
import { TeacherFormData } from "./useTeacherActions";

interface TeacherFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTeacher: Teacher | null;
  onSubmit: (data: TeacherFormData, selectedTeacher: Teacher | null) => Promise<void>;
}

export function TeacherFormDialog({ open, onOpenChange, selectedTeacher, onSubmit }: TeacherFormDialogProps) {
  const handleSubmit = async (data: TeacherFormData) => {
    await onSubmit(data, selectedTeacher);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{selectedTeacher ? "Edit Teacher" : "Add New Teacher"}</DialogTitle>
          <DialogDescription>
            {selectedTeacher ? "Update teacher information" : "Enter teacher details to add to the system"}
          </DialogDescription>
        </DialogHeader>
        <TeacherForm
          selectedTeacher={selectedTeacher}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
