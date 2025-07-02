import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Filter } from "lucide-react";
import { Class, FilterState } from "./types/feeTypes";
import { FEE_TYPE_OPTIONS } from "@/constants/feeTypes";

interface EnhancedFilterState extends FilterState {
  has_discount: string;
  payment_status: string;
  search_parent: string;
}

interface EnhancedFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: EnhancedFilterState;
  onFiltersChange: (filters: EnhancedFilterState) => void;
  classes: Class[];
}

export function EnhancedFilters({ 
  searchTerm, 
  onSearchChange, 
  filters, 
  onFiltersChange, 
  classes 
}: EnhancedFiltersProps) {
  const updateFilter = (key: keyof EnhancedFilterState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    onSearchChange('');
    onFiltersChange({
      class_id: "all",
      section: "all",
      status: "all",
      fee_type: "all",
      due_date_from: "",
      due_date_to: "",
      has_discount: "all",
      payment_status: "all",
      search_parent: ""
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (filters.class_id !== "all") count++;
    if (filters.section !== "all") count++;
    if (filters.status !== "all") count++;
    if (filters.fee_type !== "all") count++;
    if (filters.due_date_from) count++;
    if (filters.due_date_to) count++;
    if (filters.has_discount !== "all") count++;
    if (filters.payment_status !== "all") count++;
    if (filters.search_parent) count++;
    return count;
  };

  const uniqueSections = Array.from(new Set(classes.map(c => c.section).filter(Boolean)));
  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filters</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">{activeFiltersCount} active</Badge>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Primary Search */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="search">Search Student</Label>
          <Input
            id="search"
            placeholder="Name, admission number, fee type..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="search-parent">Search Parent</Label>
          <Input
            id="search-parent"
            placeholder="Parent name, phone, email..."
            value={filters.search_parent}
            onChange={(e) => updateFilter('search_parent', e.target.value)}
          />
        </div>
      </div>

      {/* Class and Section Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <Label htmlFor="status-filter">Fee Status</Label>
          <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
            <SelectTrigger id="status-filter">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="payment-status-filter">Payment Status</Label>
          <Select value={filters.payment_status} onValueChange={(value) => updateFilter('payment_status', value)}>
            <SelectTrigger id="payment-status-filter">
              <SelectValue placeholder="Payment status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="fully_paid">Fully Paid</SelectItem>
              <SelectItem value="partially_paid">Partially Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Fee Type and Discount Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="fee-type-filter">Fee Type</Label>
          <Select value={filters.fee_type} onValueChange={(value) => updateFilter('fee_type', value)}>
            <SelectTrigger id="fee-type-filter">
              <SelectValue placeholder="Select fee type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Fee Types</SelectItem>
              {FEE_TYPE_OPTIONS.map((feeType) => (
                <SelectItem key={feeType.value} value={feeType.value}>
                  {feeType.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="discount-filter">Discount Applied</Label>
          <Select value={filters.has_discount} onValueChange={(value) => updateFilter('has_discount', value)}>
            <SelectTrigger id="discount-filter">
              <SelectValue placeholder="Discount status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="yes">With Discount</SelectItem>
              <SelectItem value="no">No Discount</SelectItem>
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