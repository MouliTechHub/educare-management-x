
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { Calendar, Search, FileText, FileDown, Percent, Eye, Settings, Download } from "lucide-react";
import { useFeeData } from "./fee-management/useFeeData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DiscountFormData {
  type: string;
  amount: number;
  reason: string;
  notes: string;
}

export default function FeeManagement() {
  const { fees, academicYears, currentAcademicYear, setCurrentAcademicYear, loading } = useFeeData();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("All Classes");
  const [selectedSection, setSelectedSection] = useState("All Sections");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [selectedFeeType, setSelectedFeeType] = useState("All Fee Types");
  const [dueDateFrom, setDueDateFrom] = useState("");
  const [dueDateTo, setDueDateTo] = useState("");
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [discountLoading, setDiscountLoading] = useState(false);

  const form = useForm<DiscountFormData>({
    defaultValues: {
      type: "Fixed Amount",
      amount: 0,
      reason: "",
      notes: "",
    },
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const totalExpected = fees.reduce((sum, fee) => sum + fee.actual_amount, 0);
    const totalCollected = fees.reduce((sum, fee) => sum + fee.total_paid, 0);
    const totalDiscount = fees.reduce((sum, fee) => sum + fee.discount_amount, 0);
    const pendingAmount = fees.reduce((sum, fee) => {
      const finalFee = fee.actual_amount - fee.discount_amount;
      const balance = finalFee - fee.total_paid;
      return sum + (balance > 0 ? balance : 0);
    }, 0);
    const overdueCount = fees.filter(fee => {
      const finalFee = fee.actual_amount - fee.discount_amount;
      const balance = finalFee - fee.total_paid;
      return balance > 0 && new Date(fee.due_date) < new Date();
    }).length;
    const activeStudents = new Set(fees.map(fee => fee.student_id)).size;
    const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

    return {
      totalExpected,
      totalCollected,
      totalDiscount,
      pendingAmount,
      overdueCount,
      activeStudents,
      collectionRate: Math.round(collectionRate)
    };
  }, [fees]);

  // Filter fees
  const filteredFees = useMemo(() => {
    return fees.filter(fee => {
      const matchesSearch = searchTerm === "" || 
        fee.student?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fee.student?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fee.student?.admission_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fee.fee_type?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesClass = selectedClass === "All Classes" || fee.student?.class_name === selectedClass;
      const matchesSection = selectedSection === "All Sections" || fee.student?.section === selectedSection;
      const matchesStatus = selectedStatus === "All Status" || fee.status === selectedStatus;
      const matchesFeeType = selectedFeeType === "All Fee Types" || fee.fee_type === selectedFeeType;
      
      return matchesSearch && matchesClass && matchesSection && matchesStatus && matchesFeeType;
    });
  }, [fees, searchTerm, selectedClass, selectedSection, selectedStatus, selectedFeeType]);

  const handleDiscountClick = (fee) => {
    setSelectedFee(fee);
    form.reset({
      type: "Fixed Amount",
      amount: 0,
      reason: "",
      notes: "",
    });
    setDiscountDialogOpen(true);
  };

  const onDiscountSubmit = async (data: DiscountFormData) => {
    if (!selectedFee) return;

    setDiscountLoading(true);
    try {
      let discountAmount = 0;
      
      if (data.type === 'Fixed Amount') {
        discountAmount = data.amount;
      } else if (data.type === 'Percentage') {
        discountAmount = (selectedFee.actual_amount * data.amount) / 100;
      }

      const { error } = await supabase
        .from('fees')
        .update({
          discount_amount: discountAmount,
          discount_notes: data.notes,
          discount_updated_by: 'Admin',
          discount_updated_at: new Date().toISOString()
        })
        .eq('id', selectedFee.id);

      if (error) throw error;

      toast({
        title: "Discount applied",
        description: `Discount of ₹${discountAmount.toFixed(2)} applied successfully`
      });

      setDiscountDialogOpen(false);
      form.reset();
      window.location.reload(); // Refresh to show updated data
    } catch (error: any) {
      console.error('Error applying discount:', error);
      toast({
        title: "Error applying discount",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDiscountLoading(false);
    }
  };

  const currentYear = academicYears.find(year => year.id === currentAcademicYear);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading fee data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Management</h1>
          <p className="text-gray-600 mt-1">Academic year-based fee tracking with comprehensive analytics</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button variant="outline" size="sm">
            <FileDown className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm">
            <Percent className="w-4 h-4 mr-2" />
            Discount Reports
          </Button>
        </div>
      </div>

      {/* Academic Year Selector */}
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">Academic Year:</span>
        <Select value={currentAcademicYear} onValueChange={setCurrentAcademicYear}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {academicYears.map((year) => (
              <SelectItem key={year.id} value={year.id}>
                {year.year_name} {year.is_current && "(Current)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-sm text-gray-600">Total Expected</span>
            </div>
            <div className="text-2xl font-bold">₹{stats.totalExpected.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Academic Year {currentYear?.year_name}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Collected</span>
            </div>
            <div className="text-2xl font-bold text-green-600">₹{stats.totalCollected.toLocaleString()}</div>
            <div className="text-xs text-gray-500">{stats.collectionRate}% collection rate</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Pending</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">₹{stats.pendingAmount.toLocaleString()}</div>
            <div className="text-xs text-gray-500">{stats.overdueCount} overdue records</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Total Discount</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">₹{stats.totalDiscount.toLocaleString()}</div>
            <div className="text-xs text-gray-500">{stats.totalExpected > 0 ? ((stats.totalDiscount / stats.totalExpected) * 100).toFixed(1) : 0}% of total</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Students</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">{stats.activeStudents}</div>
            <div className="text-xs text-gray-500">Active students</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Efficiency</span>
            </div>
            <div className="text-2xl font-bold text-indigo-600">{stats.collectionRate}%</div>
            <div className="text-xs text-gray-500">Collection efficiency</div>
          </CardContent>
        </Card>
      </div>

      {/* Fee Records Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Fee Records</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Academic year-based fee management with change tracking - {currentYear?.year_name} (Current Year)
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by student, class, or fee type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-80"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-6 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Search</label>
              <Input
                placeholder="Search by name, admission number, or fee type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Classes">All Classes</SelectItem>
                  <SelectItem value="1st Class">1st Class</SelectItem>
                  <SelectItem value="2nd Class">2nd Class</SelectItem>
                  <SelectItem value="3rd Class">3rd Class</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Section</label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Sections">All Sections</SelectItem>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Status">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Fee Type</label>
              <Select value={selectedFeeType} onValueChange={setSelectedFeeType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Fee Types">All Fee Types</SelectItem>
                  <SelectItem value="Tuition">Tuition</SelectItem>
                  <SelectItem value="Transport">Transport</SelectItem>
                  <SelectItem value="Library">Library</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Due Date From</label>
              <Input
                type="date"
                value={dueDateFrom}
                onChange={(e) => setDueDateFrom(e.target.value)}
                placeholder="dd/mm/yyyy"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Due Date To</label>
              <Input
                type="date"
                value={dueDateTo}
                onChange={(e) => setDueDateTo(e.target.value)}
                placeholder="dd/mm/yyyy"
              />
            </div>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Fee Type</TableHead>
                <TableHead>Actual Fee</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Final Fee</TableHead>
                <TableHead>Paid Amount</TableHead>
                <TableHead>Balance Fee</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFees.map((fee) => {
                const finalFee = fee.actual_amount - fee.discount_amount;
                const balance = finalFee - fee.total_paid;
                
                return (
                  <TableRow key={fee.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {fee.student?.first_name} {fee.student?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {fee.student?.admission_number}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{fee.student?.class_name}</TableCell>
                    <TableCell>{fee.fee_type}</TableCell>
                    <TableCell>₹{fee.actual_amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className="text-green-600">₹{fee.discount_amount.toLocaleString()}</span>
                    </TableCell>
                    <TableCell className="font-medium">₹{finalFee.toLocaleString()}</TableCell>
                    <TableCell className="text-blue-600">₹{fee.total_paid.toLocaleString()}</TableCell>
                    <TableCell className={balance > 0 ? 'text-red-600' : 'text-green-600'}>
                      ₹{balance.toLocaleString()}
                    </TableCell>
                    <TableCell>{fee.due_date ? new Date(fee.due_date).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          fee.status === 'Paid' ? 'bg-green-100 text-green-800' :
                          fee.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }
                      >
                        {fee.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDiscountClick(fee)}
                          title="Apply discount"
                        >
                          <Percent className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          title="View details"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          title="Settings"
                        >
                          <Settings className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Discount Dialog */}
      <Dialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Apply Discount</DialogTitle>
            <p className="text-sm text-gray-500">
              Apply discount for {selectedFee?.student?.first_name} {selectedFee?.student?.last_name} - {selectedFee?.fee_type}
            </p>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Actual Amount</p>
                <div className="text-xl font-bold">₹{selectedFee?.actual_amount?.toLocaleString()}</div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Current Discount</p>
                <div className="text-xl font-bold text-green-600">₹{selectedFee?.discount_amount?.toLocaleString()}</div>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onDiscountSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Fixed Amount">Fixed Amount</SelectItem>
                          <SelectItem value="Percentage">Percentage</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Amount {form.watch('type') === 'Percentage' ? '(%)' : '(₹)'}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          min="0"
                          max={form.watch('type') === 'Fixed Amount' ? selectedFee?.actual_amount : 100}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for Discount</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select reason" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Scholarship">Scholarship</SelectItem>
                          <SelectItem value="Financial Hardship">Financial Hardship</SelectItem>
                          <SelectItem value="Sibling Discount">Sibling Discount</SelectItem>
                          <SelectItem value="Merit Based">Merit Based</SelectItem>
                          <SelectItem value="Staff Quota">Staff Quota</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={3}
                          placeholder="Enter any additional notes about this discount..."
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setDiscountDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={discountLoading}>
                    {discountLoading ? "Applying..." : "Apply Discount"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
