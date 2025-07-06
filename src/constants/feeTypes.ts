
// Standardized fee types used across the entire application
export const STANDARDIZED_FEE_TYPES = [
  'Tuition Fee',
  'Development Fee', 
  'Library Fee',
  'Laboratory Fee',
  'Sports Fee',
  'Transport Fee',
  'Exam Fee',
  'Books Fee',
  'Uniform Fee',
  'Activities Fee',
  'Meals Fee',
  'Other Fee',
  'Previous Year Dues'
] as const;

export type StandardizedFeeType = typeof STANDARDIZED_FEE_TYPES[number];

// Fee type options for dropdowns with user-friendly labels
export const FEE_TYPE_OPTIONS = [
  { value: 'Tuition Fee', label: 'Tuition Fee' },
  { value: 'Development Fee', label: 'Development Fee' },
  { value: 'Library Fee', label: 'Library Fee' },
  { value: 'Laboratory Fee', label: 'Laboratory Fee' },
  { value: 'Sports Fee', label: 'Sports Fee' },
  { value: 'Transport Fee', label: 'Transport Fee' },
  { value: 'Exam Fee', label: 'Exam Fee' },
  { value: 'Books Fee', label: 'Books Fee' },
  { value: 'Uniform Fee', label: 'Uniform Fee' },
  { value: 'Activities Fee', label: 'Activities Fee' },
  { value: 'Meals Fee', label: 'Meals Fee' },
  { value: 'Other Fee', label: 'Other Fee' },
  { value: 'Previous Year Dues', label: 'Previous Year Dues' }
];

// Helper function to validate fee type
export const isValidFeeType = (feeType: string): feeType is StandardizedFeeType => {
  return STANDARDIZED_FEE_TYPES.includes(feeType as StandardizedFeeType);
};

// Helper function to get fee type label
export const getFeeTypeLabel = (feeType: string): string => {
  const option = FEE_TYPE_OPTIONS.find(opt => opt.value === feeType);
  return option ? option.label : feeType;
};
