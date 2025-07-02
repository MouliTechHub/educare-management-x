
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { ClassWithStats, TeacherBasic } from "@/types/database";

interface ClassFormProps {
  teachers: TeacherBasic[];
  selectedClass: ClassWithStats | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function ClassForm({ teachers, selectedClass, onSubmit, onCancel }: ClassFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    section: '',
    homeroom_teacher_id: '',
  });

  useEffect(() => {
    if (selectedClass) {
      setFormData({
        name: selectedClass.name,
        section: selectedClass.section || '',
        homeroom_teacher_id: selectedClass.homeroom_teacher_id || 'no-teacher',
      });
    } else {
      setFormData({
        name: '',
        section: '',
        homeroom_teacher_id: 'no-teacher',
      });
    }
  }, [selectedClass]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Class name is required');
      return;
    }

    onSubmit({
      ...formData,
      homeroom_teacher_id: formData.homeroom_teacher_id === "no-teacher" ? null : formData.homeroom_teacher_id || null,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Class Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="e.g., Class 1, Grade 10"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="section">Section</Label>
        <Input
          id="section"
          value={formData.section}
          onChange={(e) => handleInputChange('section', e.target.value)}
          placeholder="e.g., A, B, Alpha"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="homeroom_teacher_id">Homeroom Teacher</Label>
        <Select
          value={formData.homeroom_teacher_id}
          onValueChange={(value) => handleInputChange('homeroom_teacher_id', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a teacher" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no-teacher">No teacher assigned</SelectItem>
            {teachers.map((teacher) => (
              <SelectItem key={teacher.id} value={teacher.id}>
                {teacher.first_name} {teacher.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {selectedClass ? "Update Class" : "Create Class"}
        </Button>
      </div>
    </form>
  );
}
