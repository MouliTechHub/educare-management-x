
import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Class } from "./types/feeTypes";

interface EnhancedFilterState {
  classId: string;
  section: string;
  status: string;
  feeType: string;
  dueDateFrom: string;
  dueDateTo: string;
  hasDiscount: string;
  paymentStatus: string;
  searchParent: string;
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
  
  const handleFilterChange = (key: keyof EnhancedFilterState, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      classId: '',
      section: '',
      status: '',
      feeType: '',
      dueDateFrom: '',
      dueDateTo: '',
      hasDiscount: '',
      paymentStatus: '',
      searchParent: ''
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search & Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Search by student name or admission number..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <Input
            placeholder="Search by parent phone or email..."
            value={filters.searchParent}
            onChange={(e) => handleFilterChange("searchParent", e.target.value)}
          />
        </div>

        {/* Main Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Class Filter */}
          <Select
            value={filters.classId}
            onValueChange={(value) => handleFilterChange("classId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name} {cls.section ? `- ${cls.section}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Section Filter */}
          <Select
            value={filters.section}
            onValueChange={(value) => handleFilterChange("section", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Sections" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              <SelectItem value="A">Section A</SelectItem>
              <SelectItem value="B">Section B</SelectItem>
              <SelectItem value="C">Section C</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange("status", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Partial">Partial</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>

          {/* Fee Type Filter */}
          <Select
            value={filters.feeType}
            onValueChange={(value) => handleFilterChange("feeType", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Fee Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Fee Types</SelectItem>
              <SelectItem value="Tuition Fee">Tuition Fee</SelectItem>
              <SelectItem value="Admission Fee">Admission Fee</SelectItem>
              <SelectItem value="Transport Fee">Transport Fee</SelectItem>
              <SelectItem value="Exam Fee">Exam Fee</SelectItem>
              <SelectItem value="Library Fee">Library Fee</SelectItem>
              <SelectItem value="Sports Fee">Sports Fee</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Due Date From</label>
            <Input
              type="date"
              value={filters.dueDateFrom}
              onChange={(e) => handleFilterChange("dueDateFrom", e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Due Date To</label>
            <Input
              type="date"
              value={filters.dueDateTo}
              onChange={(e) => handleFilterChange("dueDateTo", e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={clearFilters} className="w-full">
              Clear All Filters
            </Button>
          </div>
        </div>

        {/* Additional Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            value={filters.hasDiscount}
            onValueChange={(value) => handleFilterChange("hasDiscount", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Discount Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Records</SelectItem>
              <SelectItem value="yes">With Discount</SelectItem>
              <SelectItem value="no">No Discount</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.paymentStatus}
            onValueChange={(value) => handleFilterChange("paymentStatus", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Payment Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="has_payment">Has Payments</SelectItem>
              <SelectItem value="no_payment">No Payments</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
