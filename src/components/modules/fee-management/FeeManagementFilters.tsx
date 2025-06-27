
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Filter } from "lucide-react";

interface Class {
  id: string;
  name: string;
  section: string | null;
}

interface FilterState {
  class_id: string;
  section: string;
  status: string;
  fee_type: string;
  due_date_from: string;
  due_date_to: string;
}

interface FeeManagementFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  classes: Class[];
}

export function FeeManagementFilters({ filters, onFiltersChange, classes }: FeeManagementFiltersProps) {
  const updateFilter = (key: keyof FilterState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const uniqueSections = Array.from(
    new Set(classes.filter(c => c.section).map(c => c.section))
  ).filter(Boolean);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-4 h-4" />
          <span className="font-medium">Filters</span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <Label htmlFor="class-filter">Class</Label>
            <Select value={filters.class_id} onValueChange={(value) => updateFilter('class_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="section-filter">Section</Label>
            <Select value={filters.section} onValueChange={(value) => updateFilter('section', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Sections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {uniqueSections.map((section) => (
                  <SelectItem key={section} value={section}>
                    Section {section}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status-filter">Status</Label>
            <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="fee-type-filter">Fee Type</Label>
            <Select value={filters.fee_type} onValueChange={(value) => updateFilter('fee_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Tuition">Tuition Fee</SelectItem>
                <SelectItem value="Library">Library Fee</SelectItem>
                <SelectItem value="Lab">Laboratory Fee</SelectItem>
                <SelectItem value="Sports">Sports Fee</SelectItem>
                <SelectItem value="Transport">Transport Fee</SelectItem>
                <SelectItem value="Exam">Exam Fee</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="due-date-from">Due From</Label>
            <Input
              id="due-date-from"
              type="date"
              value={filters.due_date_from}
              onChange={(e) => updateFilter('due_date_from', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="due-date-to">Due To</Label>
            <Input
              id="due-date-to"
              type="date"
              value={filters.due_date_to}
              onChange={(e) => updateFilter('due_date_to', e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
