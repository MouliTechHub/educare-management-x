
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  classes: Class[];
}

// Valid fee types that match the database constraint
const VALID_FEE_TYPES = [
  { value: 'Tuition', label: 'Tuition Fee' },
  { value: 'Development', label: 'Development Fee' },
  { value: 'Library', label: 'Library Fee' },
  { value: 'Lab', label: 'Laboratory Fee' },
  { value: 'Sports', label: 'Sports Fee' },
  { value: 'Transport', label: 'Transport Fee' },
  { value: 'Exam', label: 'Exam Fee' },
  { value: 'Other', label: 'Other' }
];

export function FeeManagementFilters({ 
  searchTerm, 
  onSearchChange, 
  filters, 
  onFiltersChange, 
  classes 
}: FeeManagementFiltersProps) {
  const updateFilter = (key: keyof FilterState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const uniqueSections = Array.from(new Set(classes.map(c => c.section).filter(Boolean)));

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search by name, admission number, or fee type..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="class-filter">Class</Label>
          <Select value={filters.class_id} onValueChange={(value) => updateFilter('class_id', value)}>
            <SelectTrigger id="class-filter">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name} {cls.section && `- Section ${cls.section}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="section-filter">Section</Label>
          <Select value={filters.section} onValueChange={(value) => updateFilter('section', value)}>
            <SelectTrigger id="section-filter">
              <SelectValue placeholder="Select section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {uniqueSections.map((section) => (
                <SelectItem key={section} value={section!}>
                  Section {section}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status-filter">Status</Label>
          <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
            <SelectTrigger id="status-filter">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="fee-type-filter">Fee Type</Label>
          <Select value={filters.fee_type} onValueChange={(value) => updateFilter('fee_type', value)}>
            <SelectTrigger id="fee-type-filter">
              <SelectValue placeholder="Select fee type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Fee Types</SelectItem>
              {VALID_FEE_TYPES.map((feeType) => (
                <SelectItem key={feeType.value} value={feeType.value}>
                  {feeType.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="due-date-from">Due Date From</Label>
          <Input
            id="due-date-from"
            type="date"
            value={filters.due_date_from}
            onChange={(e) => updateFilter('due_date_from', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="due-date-to">Due Date To</Label>
          <Input
            id="due-date-to"
            type="date"
            value={filters.due_date_to}
            onChange={(e) => updateFilter('due_date_to', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
