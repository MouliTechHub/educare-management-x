import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

const EXPENSE_CATEGORIES = [
  'Salaries',
  'Rent', 
  'Maintenance',
  'Electricity',
  'Water',
  'Stationery',
  'Toilet Needs',
  'Newspapers',
  'Advertisements',
  'Publicity',
  'Social Media',
  'Activities',
  'Independence Day',
  'Krishna Janmashtami',
  'Christmas',
  'Sankranti',
  'Miscellaneous'
];

const PAYMENT_MODES = [
  'Cash',
  'Cheque',
  'Bank Transfer',
  'Card',
  'PhonePe',
  'GPay',
  'Online'
];

interface ExpenseFiltersProps {
  filters: {
    category: string;
    paymentMode: string;
    dateFrom: string;
    dateTo: string;
    amountMin: string;
    amountMax: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
}

export function ExpenseFilters({ filters, onFilterChange, onClearFilters }: ExpenseFiltersProps) {
  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="w-4 h-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <Select value={filters.category} onValueChange={(value) => onFilterChange('category', value)}>
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All categories</SelectItem>
              {EXPENSE_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Payment Mode</label>
          <Select value={filters.paymentMode} onValueChange={(value) => onFilterChange('paymentMode', value)}>
            <SelectTrigger>
              <SelectValue placeholder="All modes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All modes</SelectItem>
              {PAYMENT_MODES.map((mode) => (
                <SelectItem key={mode} value={mode}>
                  {mode}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Date From</label>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onFilterChange('dateFrom', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Date To</label>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onFilterChange('dateTo', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Min Amount</label>
          <Input
            type="number"
            placeholder="0"
            value={filters.amountMin}
            onChange={(e) => onFilterChange('amountMin', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Max Amount</label>
          <Input
            type="number"
            placeholder="No limit"
            value={filters.amountMax}
            onChange={(e) => onFilterChange('amountMax', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}