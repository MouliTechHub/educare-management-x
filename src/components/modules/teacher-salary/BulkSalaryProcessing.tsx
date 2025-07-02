import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Calculator, Users } from "lucide-react";
import { Teacher } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BulkSalaryProcessingProps {
  teachers: Teacher[];
  onProcess: (teacherIds: string[], month: number, year: number, academicYearId: string) => Promise<void>;
  onClose: () => void;
}

export function BulkSalaryProcessing({ teachers, onProcess, onClose }: BulkSalaryProcessingProps) {
  const [selectedTeachers, setSelectedTeachers] = useState<Set<string>>(new Set());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [academicYearId, setAcademicYearId] = useState<string>('');
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useState(() => {
    fetchAcademicYears();
  });

  const fetchAcademicYears = async () => {
    try {
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .order("is_current", { ascending: false })
        .order("start_date", { ascending: false });

      if (error) throw error;
      setAcademicYears(data || []);
      
      // Auto-select current academic year
      const current = data?.find(year => year.is_current);
      if (current) {
        setAcademicYearId(current.id);
      }
    } catch (error) {
      console.error("Error fetching academic years:", error);
    }
  };

  const handleTeacherToggle = (teacherId: string) => {
    const newSelection = new Set(selectedTeachers);
    if (newSelection.has(teacherId)) {
      newSelection.delete(teacherId);
    } else {
      newSelection.add(teacherId);
    }
    setSelectedTeachers(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedTeachers.size === teachers.length) {
      setSelectedTeachers(new Set());
    } else {
      setSelectedTeachers(new Set(teachers.map(t => t.id)));
    }
  };

  const handleProcess = async () => {
    if (selectedTeachers.size === 0) {
      toast({
        title: "No teachers selected",
        description: "Please select at least one teacher",
        variant: "destructive"
      });
      return;
    }

    if (!academicYearId) {
      toast({
        title: "Academic year required",
        description: "Please select an academic year",
        variant: "destructive"
      });
      return;
    }

    try {
      setProcessing(true);
      await onProcess(Array.from(selectedTeachers), month, year, academicYearId);
      onClose();
    } catch (error) {
      console.error('Bulk processing failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  const calculateTotalSalary = () => {
    return Array.from(selectedTeachers)
      .map(id => teachers.find(t => t.id === id))
      .filter(Boolean)
      .reduce((sum, teacher) => sum + (teacher?.salary || 0), 0);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calculator className="w-5 h-5" />
          <CardTitle>Bulk Salary Processing</CardTitle>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Period Selection */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Month</label>
            <Select value={month.toString()} onValueChange={(value) => setMonth(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Year</label>
            <Select value={year.toString()} onValueChange={(value) => setYear(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => {
                  const yearOption = new Date().getFullYear() - 2 + i;
                  return (
                    <SelectItem key={yearOption} value={yearOption.toString()}>
                      {yearOption}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Academic Year</label>
            <Select value={academicYearId} onValueChange={setAcademicYearId}>
              <SelectTrigger>
                <SelectValue placeholder="Select academic year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.year_name} {year.is_current && '(Current)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Teacher Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Select Teachers ({selectedTeachers.size} selected)
            </h3>
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              {selectedTeachers.size === teachers.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
            {teachers.map((teacher) => (
              <div
                key={teacher.id}
                className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 ${
                  selectedTeachers.has(teacher.id) ? 'bg-primary/10 border-primary' : ''
                }`}
                onClick={() => handleTeacherToggle(teacher.id)}
              >
                <Checkbox
                  checked={selectedTeachers.has(teacher.id)}
                  onChange={() => handleTeacherToggle(teacher.id)}
                />
                <div className="flex-1">
                  <div className="font-medium">
                    {teacher.first_name} {teacher.last_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {teacher.employee_id || 'No ID'} • ₹{teacher.salary?.toLocaleString() || '0'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary and Action */}
        {selectedTeachers.size > 0 && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">Processing Summary</span>
              <Badge variant="secondary">
                {selectedTeachers.size} teacher{selectedTeachers.size !== 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="text-sm space-y-1">
              <div>Period: {new Date(0, month - 1).toLocaleString('default', { month: 'long' })} {year}</div>
              <div>Total Base Salary: ₹{calculateTotalSalary().toLocaleString()}</div>
              <div className="text-muted-foreground">
                Final amounts will be calculated based on attendance (default: 26 working days)
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleProcess} 
            disabled={selectedTeachers.size === 0 || !academicYearId || processing}
          >
            {processing ? 'Processing...' : `Process ${selectedTeachers.size} Salaries`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}