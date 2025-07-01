
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { User, GraduationCap, Calendar, Bell } from "lucide-react";

interface PostCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  onConfirm: (actions: PostCreationActions) => void;
  loading?: boolean;
}

interface PostCreationActions {
  createDefaultAcademicRecord: boolean;
  assignToCurrentYear: boolean;
  createInitialAttendanceRecord: boolean;
  notifyParents: boolean;
}

export function PostCreationDialog({ 
  open, 
  onOpenChange, 
  studentName, 
  onConfirm, 
  loading = false 
}: PostCreationDialogProps) {
  const [actions, setActions] = useState<PostCreationActions>({
    createDefaultAcademicRecord: true,
    assignToCurrentYear: true,
    createInitialAttendanceRecord: true,
    notifyParents: false
  });

  const handleActionChange = (actionKey: keyof PostCreationActions, checked: boolean) => {
    setActions(prev => ({
      ...prev,
      [actionKey]: checked
    }));
  };

  const handleConfirm = () => {
    onConfirm(actions);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-600" />
            <span>Student Added Successfully!</span>
          </DialogTitle>
          <DialogDescription>
            {studentName} has been added to the system. Choose additional setup actions:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="academic-record"
              checked={actions.createDefaultAcademicRecord}
              onCheckedChange={(checked) => 
                handleActionChange('createDefaultAcademicRecord', checked as boolean)
              }
            />
            <Label htmlFor="academic-record" className="flex items-center space-x-2 cursor-pointer">
              <GraduationCap className="w-4 h-4 text-green-600" />
              <span>Create academic record for current year</span>
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="assign-year"
              checked={actions.assignToCurrentYear}
              onCheckedChange={(checked) => 
                handleActionChange('assignToCurrentYear', checked as boolean)
              }
            />
            <Label htmlFor="assign-year" className="flex items-center space-x-2 cursor-pointer">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Assign to current academic year</span>
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="attendance"
              checked={actions.createInitialAttendanceRecord}
              onCheckedChange={(checked) => 
                handleActionChange('createInitialAttendanceRecord', checked as boolean)
              }
            />
            <Label htmlFor="attendance" className="flex items-center space-x-2 cursor-pointer">
              <Calendar className="w-4 h-4 text-orange-600" />
              <span>Initialize attendance tracking</span>
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="notify-parents"
              checked={actions.notifyParents}
              onCheckedChange={(checked) => 
                handleActionChange('notifyParents', checked as boolean)
              }
            />
            <Label htmlFor="notify-parents" className="flex items-center space-x-2 cursor-pointer">
              <Bell className="w-4 h-4 text-purple-600" />
              <span>Send welcome notification to parents</span>
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Skip Setup
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? "Processing..." : "Complete Setup"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
