import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  X, 
  Calendar,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface EnhancedFilterState {
  search: string;
  class_id: string;
  section: string;
  status: string;
  fee_type: string;
  due_date_from: string;
  due_date_to: string;
  has_discount: string;
  payment_status: string;
  academic_year: string;
  amount_range: string;
  is_carry_forward: string;
  payment_blocked: string;
}

interface Class {
  id: string;
  name: string;
  section?: string;
}

interface SuperEnhancedFiltersProps {
  filters: EnhancedFilterState;
  onFiltersChange: (filters: EnhancedFilterState) => void;
  classes: Class[];
  academicYears: Array<{ id: string; year_name: string; is_current: boolean }>;
  feeTypes: string[];
  onReset: () => void;
  activeFiltersCount: number;
}

export function SuperEnhancedFilters({
  filters,
  onFiltersChange,
  classes,
  academicYears,
  feeTypes,
  onReset,
  activeFiltersCount
}: SuperEnhancedFiltersProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(true); // Hidden by default

  const sections = React.useMemo(() => {
    const sectionSet = new Set<string>();
    classes.forEach(cls => {
      if (cls.section) sectionSet.add(cls.section);
    });
    return Array.from(sectionSet).sort();
  }, [classes]);

  const updateFilter = (key: keyof EnhancedFilterState, value: string) => {
    // Convert "all" back to empty string for filtering logic
    const filterValue = value === 'all' ? '' : value;
    onFiltersChange({ ...filters, [key]: filterValue });
  };

  const clearFilter = (key: keyof EnhancedFilterState) => {
    updateFilter(key, '');
  };

  const statusOptions = [
    { value: 'Pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    { value: 'Paid', label: 'Paid', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    { value: 'Partial', label: 'Partial', color: 'bg-blue-100 text-blue-800', icon: DollarSign },
    { value: 'Overdue', label: 'Overdue', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
  ];

  const amountRanges = [
    { value: '0-1000', label: '₹0 - ₹1,000' },
    { value: '1000-5000', label: '₹1,000 - ₹5,000' },
    { value: '5000-10000', label: '₹5,000 - ₹10,000' },
    { value: '10000-25000', label: '₹10,000 - ₹25,000' },
    { value: '25000+', label: '₹25,000+' },
  ];

  const getActiveFilters = () => {
    return Object.entries(filters)
      .filter(([key, value]) => value !== '' && key !== 'search')
      .map(([key, value]) => ({ key: key as keyof EnhancedFilterState, value }));
  };

  const activeFilters = getActiveFilters();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Advanced Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">
                {activeFiltersCount} active
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onReset}
              disabled={activeFiltersCount === 0}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset All
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Show Filters
                </>
              ) : (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Hide Filters
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="space-y-6">
          {/* Quick Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students, admission numbers, or phone..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Active Filters Display */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeFilters.map(({ key, value }) => (
                <Badge key={String(key)} variant="secondary" className="flex items-center gap-1">
                  <span className="capitalize">{String(key).replace('_', ' ')}: {value}</span>
                  <X 
                    className="h-3 w-3 cursor-pointer hover:bg-destructive/20 rounded" 
                    onClick={() => clearFilter(key as keyof EnhancedFilterState)}
                  />
                </Badge>
              ))}
            </div>
          )}

          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Academic Year Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Academic Year</label>
              <Select value={filters.academic_year} onValueChange={(value) => updateFilter('academic_year', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.year_name} {year.is_current && "(Current)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Class Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Class</label>
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

            {/* Section Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Section</label>
              <Select value={filters.section} onValueChange={(value) => updateFilter('section', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {sections.map((section) => (
                    <SelectItem key={section} value={section}>
                      {section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fee Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Fee Type</label>
              <Select value={filters.fee_type} onValueChange={(value) => updateFilter('fee_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Fee Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fee Types</SelectItem>
                  {feeTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Status</label>
              <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <status.icon className="h-4 w-4" />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount Range Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount Range</label>
              <Select value={filters.amount_range} onValueChange={(value) => updateFilter('amount_range', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Amounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Amounts</SelectItem>
                  {amountRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Has Discount Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Discount Status</label>
              <Select value={filters.has_discount} onValueChange={(value) => updateFilter('has_discount', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Records" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Records</SelectItem>
                  <SelectItem value="yes">With Discount</SelectItem>
                  <SelectItem value="no">No Discount</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Carry Forward Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Carry Forward</label>
              <Select value={filters.is_carry_forward} onValueChange={(value) => updateFilter('is_carry_forward', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Records" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Records</SelectItem>
                  <SelectItem value="yes">Carry Forward Only</SelectItem>
                  <SelectItem value="no">Current Year Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range Filters */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">Due Date Range</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">From Date</label>
                <Input
                  type="date"
                  value={filters.due_date_from}
                  onChange={(e) => updateFilter('due_date_from', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">To Date</label>
                <Input
                  type="date"
                  value={filters.due_date_to}
                  onChange={(e) => updateFilter('due_date_to', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Special Status Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Blocked</label>
              <Select value={filters.payment_blocked} onValueChange={(value) => updateFilter('payment_blocked', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Students" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="yes">Blocked Only</SelectItem>
                  <SelectItem value="no">Not Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}