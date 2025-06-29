
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Teacher } from "@/types/database";
import { TeacherFormData } from "./useTeacherActions";
import { validateAndFormatPhoneNumber } from "@/components/modules/student-management/utils/phoneValidation";
import { useState } from "react";

interface TeacherFormProps {
  selectedTeacher: Teacher | null;
  onSubmit: (data: TeacherFormData) => Promise<void>;
  onCancel: () => void;
}

export function TeacherForm({ selectedTeacher, onSubmit, onCancel }: TeacherFormProps) {
  const [phoneError, setPhoneError] = useState<string>('');
  const [emergencyPhoneError, setEmergencyPhoneError] = useState<string>('');

  const form = useForm<TeacherFormData>({
    defaultValues: {
      first_name: selectedTeacher?.first_name || "",
      last_name: selectedTeacher?.last_name || "",
      email: selectedTeacher?.email || "",
      phone_number: selectedTeacher?.phone_number || "",
      hire_date: selectedTeacher?.hire_date || new Date().toISOString().split('T')[0],
      status: selectedTeacher?.status || "Active",
      employee_id: selectedTeacher?.employee_id || "",
      department: selectedTeacher?.department || "",
      designation: selectedTeacher?.designation || "",
      qualification: selectedTeacher?.qualification || "",
      experience_years: selectedTeacher?.experience_years || undefined,
      salary: selectedTeacher?.salary || undefined,
      address_line1: selectedTeacher?.address_line1 || "",
      address_line2: selectedTeacher?.address_line2 || "",
      city: selectedTeacher?.city || "",
      state: selectedTeacher?.state || "",
      pin_code: selectedTeacher?.pin_code || "",
      emergency_contact_name: selectedTeacher?.emergency_contact_name || "",
      emergency_contact_phone: selectedTeacher?.emergency_contact_phone || "",
      emergency_contact_relation: selectedTeacher?.emergency_contact_relation || "",
    },
  });

  const handlePhoneChange = (value: string, field: 'phone_number' | 'emergency_contact_phone') => {
    form.setValue(field, value);
    // Clear error when user starts typing
    if (field === 'phone_number' && phoneError) setPhoneError('');
    if (field === 'emergency_contact_phone' && emergencyPhoneError) setEmergencyPhoneError('');
  };

  const handlePhoneBlur = (value: string, field: 'phone_number' | 'emergency_contact_phone') => {
    if (!value.trim()) {
      if (field === 'phone_number') {
        setPhoneError('Phone number is required');
      } else {
        setEmergencyPhoneError(''); // Emergency phone is optional
      }
      return;
    }

    console.log(`Validating teacher ${field}:`, value);
    const phoneValidation = validateAndFormatPhoneNumber(value);
    console.log(`Teacher ${field} validation result:`, phoneValidation);
    
    if (!phoneValidation.isValid) {
      if (field === 'phone_number') {
        setPhoneError(phoneValidation.error || 'Invalid phone number format');
      } else {
        setEmergencyPhoneError(phoneValidation.error || 'Invalid phone number format');
      }
    } else {
      form.setValue(field, phoneValidation.formatted);
      if (field === 'phone_number') {
        setPhoneError('');
      } else {
        setEmergencyPhoneError('');
      }
    }
  };

  const handleSubmit = async (data: TeacherFormData) => {
    try {
      await onSubmit(data);
    } catch (error: any) {
      console.error("Error saving teacher:", error);
      
      // Handle phone number constraint violations
      if (error.message?.includes('phone_number_check')) {
        setPhoneError('Phone number must be in format +91XXXXXXXXXX');
      } else if (error.message?.includes('emergency_contact_phone_check')) {
        setEmergencyPhoneError('Emergency contact phone must be in format +91XXXXXXXXXX');
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name *</FormLabel>
                  <FormControl>
                    <Input {...field} required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name *</FormLabel>
                  <FormControl>
                    <Input {...field} required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="employee_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee ID</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      required 
                      placeholder="Enter 10-digit number or +91XXXXXXXXXX"
                      maxLength={15}
                      onChange={(e) => handlePhoneChange(e.target.value, 'phone_number')}
                      onBlur={(e) => handlePhoneBlur(e.target.value, 'phone_number')}
                    />
                  </FormControl>
                  {phoneError && (
                    <p className="text-xs text-destructive mt-1">{phoneError}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Format: +91XXXXXXXXXX (exactly 13 characters)</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hire_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hire Date *</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Professional Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Professional Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="designation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Designation</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="qualification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Qualification</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="experience_years"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Experience (Years)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="salary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Salary</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="On Leave">On Leave</SelectItem>
                      <SelectItem value="Retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Address Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Address Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="address_line1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 1</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address_line2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 2</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pin_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PIN Code</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Emergency Contact</h3>
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="emergency_contact_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency Contact Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emergency_contact_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency Contact Phone</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Enter 10-digit number or +91XXXXXXXXXX (optional)"
                      maxLength={15}
                      onChange={(e) => handlePhoneChange(e.target.value, 'emergency_contact_phone')}
                      onBlur={(e) => handlePhoneBlur(e.target.value, 'emergency_contact_phone')}
                    />
                  </FormControl>
                  {emergencyPhoneError && (
                    <p className="text-xs text-destructive mt-1">{emergencyPhoneError}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Format: +91XXXXXXXXXX (exactly 13 characters, optional)</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emergency_contact_relation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relation</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Spouse, Parent" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {selectedTeacher ? "Update" : "Create"} Teacher
          </Button>
        </div>
      </form>
    </Form>
  );
}
