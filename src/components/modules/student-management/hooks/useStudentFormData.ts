
import { useState, useEffect } from "react";
import { Student } from "@/types/database";
import { StudentFormData, ParentFormData } from "../types";

export function useStudentFormData(selectedStudent: Student | null, open: boolean) {
  const [formData, setFormData] = useState<StudentFormData>({
    first_name: "",
    last_name: "",
    admission_number: "",
    date_of_birth: "",
    gender: "",
    class_id: "",
    blood_group: "",
    religion: "",
    caste_category: "",
    previous_school: "",
    transport_route: "",
    transport_stop: "",
    medical_information: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relation: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pin_code: "",
    status: "Active",
    aadhaar_number: "",
  });

  const [parents, setParents] = useState<ParentFormData[]>([
    {
      first_name: "",
      last_name: "",
      relation: "",
      phone_number: "",
      email: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      pin_code: "",
      occupation: "",
      annual_income: "",
      employer_name: "",
      employer_address: "",
      alternate_phone: "",
      aadhaar_number: "",
      pan_number: "",
      education_qualification: "",
    }
  ]);

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      admission_number: "",
      date_of_birth: "",
      gender: "",
      class_id: "",
      blood_group: "",
      religion: "",
      caste_category: "",
      previous_school: "",
      transport_route: "",
      transport_stop: "",
      medical_information: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      emergency_contact_relation: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      pin_code: "",
      status: "Active",
      aadhaar_number: "",
    });
    setParents([{
      first_name: "",
      last_name: "",
      relation: "",
      phone_number: "",
      email: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      pin_code: "",
      occupation: "",
      annual_income: "",
      employer_name: "",
      employer_address: "",
      alternate_phone: "",
      aadhaar_number: "",
      pan_number: "",
      education_qualification: "",
    }]);
  };

  useEffect(() => {
    if (selectedStudent) {
      setFormData({
        first_name: selectedStudent.first_name,
        last_name: selectedStudent.last_name,
        admission_number: selectedStudent.admission_number,
        date_of_birth: selectedStudent.date_of_birth,
        gender: selectedStudent.gender,
        class_id: selectedStudent.class_id || "",
        blood_group: selectedStudent.blood_group || "",
        religion: selectedStudent.religion || "",
        caste_category: selectedStudent.caste_category || "",
        previous_school: selectedStudent.previous_school || "",
        transport_route: selectedStudent.transport_route || "",
        transport_stop: selectedStudent.transport_stop || "",
        medical_information: selectedStudent.medical_information || "",
        emergency_contact_name: selectedStudent.emergency_contact_name || "",
        emergency_contact_phone: selectedStudent.emergency_contact_phone || "",
        emergency_contact_relation: selectedStudent.emergency_contact_relation || "",
        address_line1: selectedStudent.address_line1 || "",
        address_line2: selectedStudent.address_line2 || "",
        city: selectedStudent.city || "",
        state: selectedStudent.state || "",
        pin_code: selectedStudent.pin_code || "",
        status: selectedStudent.status,
        aadhaar_number: selectedStudent.aadhaar_number || "",
      });

      if (selectedStudent.parents && selectedStudent.parents.length > 0) {
        const existingParents = selectedStudent.parents.map(parent => ({
          first_name: parent.first_name,
          last_name: parent.last_name,
          relation: parent.relation,
          phone_number: parent.phone_number,
          email: parent.email,
          address_line1: "",
          address_line2: "",
          city: "",
          state: "",
          pin_code: "",
          occupation: "",
          annual_income: "",
          employer_name: "",
          employer_address: "",
          alternate_phone: "",
          aadhaar_number: "",
          pan_number: "",
          education_qualification: "",
        }));
        setParents(existingParents);
      }
    } else {
      resetForm();
    }
  }, [selectedStudent, open]);

  return {
    formData,
    setFormData,
    parents,
    setParents,
    resetForm
  };
}
