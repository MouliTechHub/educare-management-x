import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Class, AcademicYear } from "@/types/database";
import { FeeStructureForm } from "./fee-structure-management/FeeStructureForm";
import { FeeStructureTable } from "./fee-structure-management/FeeStructureTable";
import { StandardizedFeeType } from "@/constants/feeTypes";

interface StandardizedFeeStructure {
  id: string;
  class_id: string;
  academic_year_id: string;
  fee_type: StandardizedFeeType;
  amount: number;
  frequency: 'Monthly' | 'Quarterly' | 'Annually' | 'One Time';
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  classes?: {
    name: string;
    section: string | null;
  };
  academic_years?: {
    year_name: string;
  };
}

export function FeeStructureManagement() {
  const [feeStructures, setFeeStructures] = useState<StandardizedFeeStructure[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState<StandardizedFeeStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch fee structures with class and academic year info
      const { data: structuresData, error: structuresError } = await supabase
        .from("fee_structures")
        .select(`
          *,
          classes:class_id(name, section),
          academic_years:academic_year_id(year_name)
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (structuresError) {
        console.error('Error fetching fee structures:', structuresError);
        throw structuresError;
      }

      // Transform data to match StandardizedFeeStructure interface
      const transformedStructures: StandardizedFeeStructure[] = (structuresData || []).map(structure => ({
        id: structure.id,
        class_id: structure.class_id,
        academic_year_id: structure.academic_year_id,
        fee_type: structure.fee_type as StandardizedFeeType,
        amount: structure.amount,
        frequency: structure.frequency as StandardizedFeeStructure['frequency'],
        description: structure.description,
        is_active: structure.is_active,
        created_at: structure.created_at,
        updated_at: structure.updated_at,
        classes: structure.classes,
        academic_years: structure.academic_years
      }));

      // Fetch classes
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select("*")
        .order("name");

      if (classesError) throw classesError;

      // Fetch academic years
      const { data: yearsData, error: yearsError } = await supabase
        .from("academic_years")
        .select("*")
        .order("start_date", { ascending: false });

      if (yearsError) throw yearsError;

      setFeeStructures(transformedStructures);
      setClasses(classesData || []);
      setAcademicYears(yearsData || []);
    } catch (error: any) {
      console.error('Error in fetchData:', error);
      toast({
        title: "Error fetching data",
        description: error.message || "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      console.log('Submitting fee structure data:', data);
      
      const submitData = {
        class_id: data.class_id,
        academic_year_id: data.academic_year_id,
        fee_type: data.fee_type,
        amount: parseFloat(data.amount),
        frequency: data.frequency,
        description: data.description || null,
      };

      console.log('Final submit data to database:', submitData);

      if (selectedStructure) {
        const { data: result, error } = await supabase
          .from("fee_structures")
          .update(submitData)
          .eq("id", selectedStructure.id)
          .select();

        console.log('Update result:', result);
        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        toast({ title: "Fee structure updated successfully" });
      } else {
        const { data: result, error } = await supabase
          .from("fee_structures")
          .insert([submitData])
          .select();

        console.log('Insert result:', result);
        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        toast({ title: "Fee structure created successfully" });
      }

      setDialogOpen(false);
      setSelectedStructure(null);
      fetchData();
    } catch (error: any) {
      console.error('Error saving fee structure:', error);
      
      let errorMessage = "Failed to save fee structure";
      if (error.message) {
        errorMessage = error.message;
      }
      if (error.details) {
        errorMessage += ` - ${error.details}`;
      }
      
      toast({
        title: "Error saving fee structure",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (structure: StandardizedFeeStructure) => {
    setSelectedStructure(structure);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this fee structure?")) return;

    try {
      const { error } = await supabase
        .from("fee_structures")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Fee structure deleted successfully" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error deleting fee structure",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddFeeStructure = () => {
    setSelectedStructure(null);
    setDialogOpen(true);
  };

  const filteredStructures = feeStructures.filter((structure) =>
    structure.fee_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    structure.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    structure.classes?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    structure.academic_years?.year_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fee Structure Management</h1>
          <p className="text-gray-600 mt-2">Define fee structures for classes and academic years</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddFeeStructure}>
              <Plus className="w-4 h-4 mr-2" />
              Add Fee Structure
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedStructure ? "Edit Fee Structure" : "Add Fee Structure"}
              </DialogTitle>
              <DialogDescription>
                {selectedStructure ? "Update fee structure details" : "Create a new fee structure for a class and academic year"}
              </DialogDescription>
            </DialogHeader>
            <FeeStructureForm
              selectedStructure={selectedStructure}
              classes={classes}
              academicYears={academicYears}
              onSubmit={handleSubmit}
              onCancel={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fee Structures</CardTitle>
              <CardDescription>Manage fee structures for different classes and academic years</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search fee structures..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <FeeStructureTable
            feeStructures={filteredStructures}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>
    </div>
  );
}
