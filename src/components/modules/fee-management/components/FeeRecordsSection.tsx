
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, BarChart3, Search, RefreshCw } from "lucide-react";
import { EnhancedFeeTable } from "../EnhancedFeeTable";
import { CreateFeeRecordsButton } from "../CreateFeeRecordsButton";
import { StudentFeeRecord } from "@/types/enhanced-fee-types";

interface FeeRecordsSectionProps {
  feeRecords: StudentFeeRecord[];
  selectedAcademicYear: string;
  currentYear?: { year_name: string; is_current: boolean };
  onDiscountClick: (feeRecord: StudentFeeRecord) => void;
  onPaymentClick: (feeRecord: StudentFeeRecord) => void;
  onHistoryClick: (feeRecord: StudentFeeRecord) => void;
  onRefreshClick: () => void;
  onExportClick: () => void;
  onReportsClick: () => void;
  onRecordsCreated: () => void;
}

export function FeeRecordsSection({
  feeRecords,
  selectedAcademicYear,
  currentYear,
  onDiscountClick,
  onPaymentClick,
  onHistoryClick,
  onRefreshClick,
  onExportClick,
  onReportsClick,
  onRecordsCreated
}: FeeRecordsSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    feeType: '',
    class: ''
  });

  const filteredFeeRecords = feeRecords.filter(record => {
    const matchesSearch = searchTerm === '' || 
      (record.student?.first_name + ' ' + record.student?.last_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.fee_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.student?.class_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filters.status === '' || record.status === filters.status;
    const matchesFeeType = filters.feeType === '' || record.fee_type === filters.feeType;
    const matchesClass = filters.class === '' || record.student?.class_name === filters.class;
    
    return matchesSearch && matchesStatus && matchesFeeType && matchesClass;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Enhanced Fee Records</CardTitle>
            <CardDescription>
              Complete fee management with automatic assignment, discount tracking, and payment history
              {currentYear && 
                ` - ${currentYear.year_name}${currentYear.is_current ? ' (Current Year)' : ''}`
              }
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by student, class, or fee type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            {selectedAcademicYear && feeRecords.length === 0 && (
              <CreateFeeRecordsButton 
                academicYearId={selectedAcademicYear} 
                onRecordsCreated={onRecordsCreated}
              />
            )}
            <Button
              variant="outline"
              onClick={onRefreshClick}
              className="bg-gray-50 hover:bg-gray-100"
              title="Refresh fee records"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={onExportClick}
              className="bg-blue-50 hover:bg-blue-100"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              variant="outline"
              onClick={onReportsClick}
              className="bg-purple-50 hover:bg-purple-100"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Reports
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
            <option value="Partial">Partial</option>
          </select>
          
          <select
            value={filters.feeType}
            onChange={(e) => setFilters(prev => ({ ...prev, feeType: e.target.value }))}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">All Fee Types</option>
            <option value="Tuition Fee">Tuition Fee</option>
            <option value="Transport Fee">Transport Fee</option>
            <option value="Exam Fee">Exam Fee</option>
          </select>
        </div>

        <EnhancedFeeTable
          feeRecords={filteredFeeRecords}
          onDiscountClick={onDiscountClick}
          onPaymentClick={onPaymentClick}
          onHistoryClick={onHistoryClick}
        />
      </CardContent>
    </Card>
  );
}
