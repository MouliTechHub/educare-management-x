
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, DollarSign, Calendar } from "lucide-react";
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

interface FeeStructureTableProps {
  feeStructures: StandardizedFeeStructure[];
  onEdit: (structure: StandardizedFeeStructure) => void;
  onDelete: (id: string) => void;
}

export function FeeStructureTable({ feeStructures, onEdit, onDelete }: FeeStructureTableProps) {
  if (feeStructures.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No fee structures found. Create one to get started.</p>
      </div>
    );
  }

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'Monthly': return 'bg-blue-100 text-blue-800';
      case 'Quarterly': return 'bg-green-100 text-green-800';
      case 'Annually': return 'bg-purple-100 text-purple-800';
      case 'One Time': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFeeTypeColor = (feeType: string) => {
    switch (feeType) {
      case 'Tuition Fee': return 'bg-indigo-100 text-indigo-800';
      case 'Transport Fee': return 'bg-yellow-100 text-yellow-800';
      case 'Meals Fee': return 'bg-pink-100 text-pink-800';
      case 'Books Fee': return 'bg-cyan-100 text-cyan-800';
      case 'Development Fee': return 'bg-emerald-100 text-emerald-800';
      case 'Library Fee': return 'bg-violet-100 text-violet-800';
      case 'Laboratory Fee': return 'bg-orange-100 text-orange-800';
      case 'Sports Fee': return 'bg-lime-100 text-lime-800';
      case 'Exam Fee': return 'bg-rose-100 text-rose-800';
      case 'Uniform Fee': return 'bg-teal-100 text-teal-800';
      case 'Activities Fee': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Class</TableHead>
            <TableHead>Academic Year</TableHead>
            <TableHead>Fee Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Frequency</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {feeStructures.map((structure) => (
            <TableRow key={structure.id}>
              <TableCell className="font-medium">
                {structure.classes ? (
                  `${structure.classes.name}${structure.classes.section ? ` - ${structure.classes.section}` : ''}`
                ) : (
                  'Unknown Class'
                )}
              </TableCell>
              <TableCell>
                {structure.academic_years?.year_name || 'Unknown Year'}
              </TableCell>
              <TableCell>
                <Badge className={getFeeTypeColor(structure.fee_type)}>
                  {structure.fee_type}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="font-medium">₹{structure.amount.toLocaleString()}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getFrequencyColor(structure.frequency)}>
                  {structure.frequency}
                </Badge>
              </TableCell>
              <TableCell className="max-w-xs">
                <div className="truncate" title={structure.description || ''}>
                  {structure.description || '-'}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(structure)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(structure.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
