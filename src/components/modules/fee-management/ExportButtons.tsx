
import React from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExportButtonsProps {
  data: any[];
  academicYear: string;
  onExport: (format: 'excel' | 'pdf') => void;
}

export function ExportButtons({ data, academicYear, onExport }: ExportButtonsProps) {
  const { toast } = useToast();

  const handleExport = (format: 'excel' | 'pdf') => {
    if (data.length === 0) {
      toast({
        title: "No data to export",
        description: "Please ensure there are fee records to export.",
        variant: "destructive",
      });
      return;
    }

    onExport(format);
    toast({
      title: `Export Started`,
      description: `Preparing ${format.toUpperCase()} file for ${academicYear}...`,
    });
  };

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('excel')}
        className="flex items-center space-x-2"
      >
        <FileSpreadsheet className="w-4 h-4" />
        <span>Export Excel</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('pdf')}
        className="flex items-center space-x-2"
      >
        <FileText className="w-4 h-4" />
        <span>Export PDF</span>
      </Button>
    </div>
  );
}
