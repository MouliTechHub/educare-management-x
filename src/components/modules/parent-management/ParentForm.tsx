
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Parent } from "@/types/database";
import { validateAndFormatPhoneNumber } from "@/components/modules/student-management/utils/phoneValidation";
import { validateEmail, validateAadhaarNumber, validatePinCode } from "@/components/modules/student-management/utils/formValidation";
import { relations } from "@/components/modules/student-management/constants";
import { useState } from "react";

interface ParentFormData {
  first_name: string;
  last_name: string;
  relation: string;
  phone_number: string;
  email: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pin_code: string;
  occupation: string;
  annual_income: number | null;
  employer_name: string;
  employer_address: string;
  alternate_phone: string;
  aadhaar_number: string;
  pan_number: string;
  education_qualification: string;
}

interface ParentFormProps {
  selectedParent: Parent | null;
  onSubmit: (data: ParentFormData) => Promise<void>;
  onCancel: () => void;
}

export function ParentForm({ selectedParent, onSubmit, onCancel }: ParentFormProps) {
  const [phoneError, setPhoneError] = useState<string>('');
  const [alternatePhoneError, setAlternatePhoneError] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [aadhaarError, setAadhaarError] = useState<string>('');
  const [panError, setPanError] = useState<string>('');
  const [pinCodeError, setPinCodeError] = useState<string>('');

  const form = useForm<ParentFormData>({
    defaultValues: {
      first_name: selectedParent?.first_name || "",
      last_name: selectedParent?.last_name || "",
      relation: selectedParent?.relation || "",
      phone_number: selectedParent?.phone_number || "",
      email: selectedParent?.email || "",
      address_line1: selectedParent?.address_line1 || "",
      address_line2: selectedParent?.address_line2 || "",
      city: selectedParent?.city || "",
      state: selectedParent?.state || "",
      pin_code: selectedParent?.pin_code || "",
      occupation: selectedParent?.occupation || "",
      annual_income: selectedParent?.annual_income || null,
      employer_name: selectedParent?.employer_name || "",
      employer_address: selectedParent?.employer_address || "",
      alternate_phone: selectedParent?.alternate_phone || "",
      aadhaar_number: (selectedParent as any)?.aadhaar_number || "",
      pan_number: (selectedParent as any)?.pan_number || "",
      education_qualification: (selectedParent as any)?.education_qualification || "",
    },
  });

  const handlePhoneChange = (value: string, field: 'phone_number' | 'alternate_phone') => {
    form.setValue(field, value);
    // Clear error when user starts typing
    if (field === 'phone_number' && phoneError) setPhoneError('');
    if (field === 'alternate_phone' && alternatePhoneError) setAlternatePhoneError('');
  };

  const handlePhoneBlur = (value: string, field: 'phone_number' | 'alternate_phone') => {
    if (!value.trim()) {
      if (field === 'phone_number') {
        setPhoneError('Phone number is required');
      } else {
        setAlternatePhoneError(''); // Alternate phone is optional
      }
      return;
    }

    console.log(`Validating parent ${field}:`, value);
    const phoneValidation = validateAndFormatPhoneNumber(value);
    console.log(`Parent ${field} validation result:`, phoneValidation);
    
    if (!phoneValidation.isValid) {
      if (field === 'phone_number') {
        setPhoneError(phoneValidation.error || 'Invalid phone number format');
      } else {
        setAlternatePhoneError(phoneValidation.error || 'Invalid phone number format');
      }
    } else {
      form.setValue(field, phoneValidation.formatted);
      if (field === 'phone_number') {
        setPhoneError('');
      } else {
        setAlternatePhoneError('');
      }
    }
  };

  const handleEmailBlur = (value: string) => {
    if (!value.trim()) {
      setEmailError('Email is required');
      return;
    }

    const emailValidation = validateEmail(value);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error || 'Invalid email format');
    } else {
      setEmailError('');
    }
  };

  const handleAadhaarBlur = (value: string) => {
    if (value.trim()) {
      const aadhaarValidation = validateAadhaarNumber(value);
      if (!aadhaarValidation.isValid) {
        setAadhaarError(aadhaarValidation.error || 'Invalid Aadhaar number');
      } else {
        form.setValue('aadhaar_number', aadhaarValidation.formatted);
        setAadhaarError('');
      }
    } else {
      setAadhaarError('');
    }
  };

  const handlePanBlur = (value: string) => {
    if (value.trim()) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(value.toUpperCase())) {
        setPanError('Invalid PAN format (e.g., ABCDE1234F)');
      } else {
        form.setValue('pan_number', value.toUpperCase());
        setPanError('');
      }
    } else {
      setPanError('');
    }
  };

  const handlePinCodeBlur = (value: string) => {
    if (value.trim()) {
      const pinValidation = validatePinCode(value);
      if (!pinValidation.isValid) {
        setPinCodeError(pinValidation.error || 'Invalid PIN code');
      } else {
        setPinCodeError('');
      }
    } else {
      setPinCodeError('');
    }
  };

  const handleSubmit = async (data: ParentFormData) => {
    // Validate phone numbers before submission
    if (data.phone_number) {
      const phoneValidation = validateAndFormatPhoneNumber(data.phone_number);
      if (!phoneValidation.isValid) {
        setPhoneError(phoneValidation.error || 'Invalid phone number format');
        return;
      }
    }

    if (data.alternate_phone) {
      const alternatePhoneValidation = validateAndFormatPhoneNumber(data.alternate_phone);
      if (!alternatePhoneValidation.isValid) {
        setAlternatePhoneError(alternatePhoneValidation.error || 'Invalid alternate phone number format');
        return;
      }
    }

    if (data.email) {
      const emailValidation = validateEmail(data.email);
      if (!emailValidation.isValid) {
        setEmailError(emailValidation.error || 'Invalid email format');
        return;
      }
    }

    if (data.aadhaar_number) {
      const aadhaarValidation = validateAadhaarNumber(data.aadhaar_number);
      if (!aadhaarValidation.isValid) {
        setAadhaarError(aadhaarValidation.error || 'Invalid Aadhaar number');
        return;
      }
    }

    if (data.pan_number) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(data.pan_number.toUpperCase())) {
        setPanError('Invalid PAN format (e.g., ABCDE1234F)');
        return;
      }
    }

    if (data.pin_code) {
      const pinValidation = validatePinCode(data.pin_code);
      if (!pinValidation.isValid) {
        setPinCodeError(pinValidation.error || 'Invalid PIN code');
        return;
      }
    }

    try {
      await onSubmit(data);
    } catch (error: any) {
      console.error("Error saving parent:", error);
      
      // Handle constraint violations
      if (error.message?.includes('phone_number_check')) {
        setPhoneError('Phone number must be in format +91XXXXXXXXXX');
      } else if (error.message?.includes('alternate_phone_check')) {
        setAlternatePhoneError('Alternate phone must be in format +91XXXXXXXXXX');
      } else if (error.message?.includes('aadhaar_check')) {
        setAadhaarError('Aadhaar number must be exactly 12 digits');
      } else if (error.message?.includes('pan_check')) {
        setPanError('PAN must be in format ABCDE1234F');
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Basic Information</h3>
          <div className="grid grid-cols-3 gap-4">
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
            <FormField
              control={form.control}
              name="relation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relation *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select relation" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {relations.map((relation) => (
                        <SelectItem key={relation} value={relation}>
                          {relation}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="email" 
                      required 
                      placeholder="parent@example.com"
                      onBlur={(e) => handleEmailBlur(e.target.value)}
                    />
                  </FormControl>
                  {emailError && (
                    <p className="text-xs text-destructive mt-1">{emailError}</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Identity Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Identity Information</h3>
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="aadhaar_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aadhaar Number</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="XXXX XXXX XXXX"
                      maxLength={12}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                        field.onChange(value);
                      }}
                      onBlur={(e) => handleAadhaarBlur(e.target.value)}
                    />
                  </FormControl>
                  {aadhaarError && (
                    <p className="text-xs text-destructive mt-1">{aadhaarError}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">12-digit unique identity number</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pan_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PAN Number</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      style={{ textTransform: 'uppercase' }}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
                        field.onChange(value);
                      }}
                      onBlur={(e) => handlePanBlur(e.target.value)}
                    />
                  </FormControl>
                  {panError && (
                    <p className="text-xs text-destructive mt-1">{panError}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Format: 5 letters + 4 digits + 1 letter</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="education_qualification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Education Qualification</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="e.g., B.Tech, M.A., etc."
                    />
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
              name="occupation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Occupation</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="annual_income"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Annual Income (₹)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number" 
                      placeholder="Enter amount in numbers"
                      min="0"
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="employer_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employer Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="alternate_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alternate Phone</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Enter 10-digit number or +91XXXXXXXXXX (optional)"
                      maxLength={15}
                      onChange={(e) => handlePhoneChange(e.target.value, 'alternate_phone')}
                      onBlur={(e) => handlePhoneBlur(e.target.value, 'alternate_phone')}
                    />
                  </FormControl>
                  {alternatePhoneError && (
                    <p className="text-xs text-destructive mt-1">{alternatePhoneError}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Format: +91XXXXXXXXXX (exactly 13 characters, optional)</p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="employer_address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employer Address</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
                    <Input 
                      {...field} 
                      placeholder="6-digit PIN code"
                      maxLength={6}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        field.onChange(value);
                      }}
                      onBlur={(e) => handlePinCodeBlur(e.target.value)}
                    />
                  </FormControl>
                  {pinCodeError && (
                    <p className="text-xs text-destructive mt-1">{pinCodeError}</p>
                  )}
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
          <Button type="submit" disabled={!!phoneError || !!alternatePhoneError || !!emailError || !!aadhaarError || !!panError || !!pinCodeError}>
            {selectedParent ? "Update" : "Create"} Parent
          </Button>
        </div>
      </form>
    </Form>
  );
}
