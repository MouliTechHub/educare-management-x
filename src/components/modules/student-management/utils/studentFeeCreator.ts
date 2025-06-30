
// This file is being removed - no auto-fee creation for new students
// All fee assignments should be done through Fee Structure management
export const createDefaultFeeRecords = async (studentId: string) => {
  // Removed auto-fee creation logic
  // New students will not have any fees auto-assigned
  console.log('Auto-fee creation disabled for student:', studentId);
  return;
};
