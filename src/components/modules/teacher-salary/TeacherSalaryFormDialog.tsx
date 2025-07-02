import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TeacherSalaryForm } from "./TeacherSalaryForm";
import { TeacherSalary, Teacher } from "@/types/database";

interface TeacherSalaryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSalary: TeacherSalary | null;
  teachers: Teacher[];
  onSubmit: (data: any) => Promise<void>;
}

export function TeacherSalaryFormDialog({
  open,
  onOpenChange,
  selectedSalary,
  teachers,
  onSubmit
}: TeacherSalaryFormDialogProps) {
  const handleSubmit = async (data: any) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedSalary ? "Edit Salary Record" : "Add New Salary Record"}
          </DialogTitle>
        </DialogHeader>
        <TeacherSalaryForm
          selectedSalary={selectedSalary}
          teachers={teachers}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}