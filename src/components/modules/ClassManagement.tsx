
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search } from "lucide-react";
import { Class } from "@/types/database";
import { ClassForm } from "./class-management/ClassForm";
import { ClassTable } from "./class-management/ClassTable";
import { useClassData } from "./class-management/useClassData";
import { useClassActions } from "./class-management/useClassActions";

export function ClassManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  const { classes, teachers, loading, fetchClasses } = useClassData();
  const { saveClass, deleteClass } = useClassActions(fetchClasses);

  const handleSubmit = async (data: any) => {
    await saveClass(data, selectedClass);
    setDialogOpen(false);
    setSelectedClass(null);
  };

  const openEditDialog = (classItem: Class) => {
    setSelectedClass(classItem);
    setDialogOpen(true);
  };

  const handleAddClass = () => {
    setSelectedClass(null);
    setDialogOpen(true);
  };

  const filteredClasses = classes.filter((classItem) =>
    `${classItem.name} ${classItem.section || ""}`.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold text-gray-900">Class Management</h1>
          <p className="text-gray-600 mt-2">Manage classes, sections, and homeroom teachers</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddClass}>
              <Plus className="w-4 h-4 mr-2" />
              Add Class
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedClass ? "Edit Class" : "Add New Class"}</DialogTitle>
              <DialogDescription>
                {selectedClass ? "Update class information" : "Create a new class with section and homeroom teacher"}
              </DialogDescription>
            </DialogHeader>
            <ClassForm
              teachers={teachers}
              selectedClass={selectedClass}
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
              <CardTitle>Classes</CardTitle>
              <CardDescription>Manage school classes and sections</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ClassTable
            classes={filteredClasses}
            onEdit={openEditDialog}
            onDelete={deleteClass}
          />
        </CardContent>
      </Card>
    </div>
  );
}
