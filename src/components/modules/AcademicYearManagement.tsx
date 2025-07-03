
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Plus, Search, ArrowUp } from "lucide-react";
import { AcademicYearForm } from "./academic-year/AcademicYearForm";
import { AcademicYearTable } from "./academic-year/AcademicYearTable";
import { useAcademicYearData } from "./academic-year/useAcademicYearData";
import { EnhancedStudentPromotionDialog } from "./academic-year/EnhancedStudentPromotionDialog";
import { AcademicYear } from "@/types/database";

export function AcademicYearManagement() {
  const {
    academicYears,
    allAcademicYears,
    isLoading,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    totalPages,
    createYear,
    updateYear,
    deleteYear,
    isCreating,
    isUpdating,
    isDeleting,
  } = useAcademicYearData();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [yearToDelete, setYearToDelete] = useState<AcademicYear | null>(null);
  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false);
  const [promotionTargetYear, setPromotionTargetYear] = useState<AcademicYear | null>(null);

  const handleCreate = () => {
    setSelectedYear(null);
    setIsFormOpen(true);
  };

  const handleEdit = (year: AcademicYear) => {
    setSelectedYear(year);
    setIsFormOpen(true);
  };

  const handleDelete = (year: AcademicYear) => {
    setYearToDelete(year);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (yearToDelete) {
      deleteYear(yearToDelete.id);
      setIsDeleteDialogOpen(false);
      setYearToDelete(null);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (selectedYear) {
        await updateYear({ ...selectedYear, ...data });
      } else {
        await createYear(data);
      }
      setIsFormOpen(false);
      setSelectedYear(null);
    } catch (error) {
      console.error("Error saving academic year:", error);
    }
  };

  const handlePromoteStudents = (targetYear: AcademicYear) => {
    if (!currentYear) {
      alert("No current academic year set. Please set a current year first.");
      return;
    }

    // Check if target year is the immediate next year in sequence
    const sortedYears = [...allAcademicYears].sort((a, b) => 
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );
    
    const currentIndex = sortedYears.findIndex(year => year.id === currentYear.id);
    const targetIndex = sortedYears.findIndex(year => year.id === targetYear.id);
    
    if (targetIndex !== currentIndex + 1) {
      alert("Students can only be promoted to the immediate next academic year in sequence. Please select the correct year.");
      return;
    }

    setPromotionTargetYear(targetYear);
    setIsPromotionDialogOpen(true);
  };

  const currentYear = allAcademicYears.find(year => year.is_current);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Academic Year Management</h1>
          <p className="text-muted-foreground">
            Manage academic years for your institution
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Academic Year
        </Button>
      </div>

      {/* Current Academic Year Card */}
      {currentYear && (
        <Card>
          <CardHeader>
            <CardTitle>Current Academic Year</CardTitle>
            <CardDescription>
              The active academic year for your institution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{currentYear.year_name}</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(currentYear.start_date).toLocaleDateString()} - {new Date(currentYear.end_date).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleEdit(currentYear)}>
                  Edit
                </Button>
                {(() => {
                  // Find the immediate next year in sequence
                  const sortedYears = [...allAcademicYears].sort((a, b) => 
                    new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
                  );
                  const currentIndex = sortedYears.findIndex(year => year.id === currentYear.id);
                  const nextYear = sortedYears[currentIndex + 1];
                  
                  return nextYear ? (
                    <Button onClick={() => handlePromoteStudents(nextYear)}>
                      <ArrowUp className="w-4 h-4 mr-2" />
                      Promote to {nextYear.year_name}
                    </Button>
                  ) : (
                    <Button disabled variant="outline">
                      <ArrowUp className="w-4 h-4 mr-2" />
                      No Next Year Available
                    </Button>
                  );
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search academic years..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Academic Years Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Academic Years</CardTitle>
          <CardDescription>
            View and manage all academic years
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-muted-foreground">Loading academic years...</div>
            </div>
          ) : (
            <>
              <AcademicYearTable
                academicYears={academicYears}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedYear ? "Edit Academic Year" : "Add Academic Year"}
            </DialogTitle>
          </DialogHeader>
          <AcademicYearForm
            selectedYear={selectedYear}
            onSubmit={handleSubmit}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Academic Year</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the academic year "{yearToDelete?.year_name}"?
              This action cannot be undone and may affect related records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Enhanced Student Promotion Dialog */}
      {promotionTargetYear && currentYear && (
        <EnhancedStudentPromotionDialog
          open={isPromotionDialogOpen}
          onOpenChange={setIsPromotionDialogOpen}
          targetAcademicYear={promotionTargetYear}
          currentAcademicYear={currentYear}
          allAcademicYears={allAcademicYears}
        />
      )}
    </div>
  );
}
