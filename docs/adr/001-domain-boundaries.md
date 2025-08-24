# ADR-001: Domain Boundaries and Aggregate Design

## Status
Proposed

## Context
The current school management system has grown organically with tightly coupled modules. We need clear domain boundaries for maintainability and scalability.

## Decision

### Core Domains
1. **Identity & Access** - Users, roles, permissions, tenants
2. **Academic Structure** - Schools, classes, subjects, academic years
3. **Student Management** - Students, guardians, enrollments, academic records
4. **Financial Management** - Fee structures, payments, discounts, billing
5. **Operations** - Attendance, exams, grades, reports
6. **Communication** - Notifications, reminders, messaging

### Aggregate Roots
- **Tenant** - Multi-tenancy boundary
- **Student** - Student profile, enrollments, academic progression
- **FeeAccount** - Fee records, payments, discounts for a student/year
- **AcademicYear** - Year-specific configurations and data
- **Class** - Class composition and structure

### Domain Events
```typescript
// Student Domain
StudentEnrolled { studentId, classId, academicYearId, enrolledAt }
StudentPromoted { studentId, fromClass, toClass, academicYear }

// Financial Domain  
FeeAssigned { studentId, feeStructureId, amount, dueDate }
PaymentReceived { studentId, amount, feeRecordIds, paidAt }
DiscountApplied { studentId, feeRecordId, amount, reason }

// Academic Domain
AcademicYearStarted { yearId, startDate }
ClassCreated { classId, name, academicYearId }
```

## Consequences
- Clear boundaries enable independent scaling
- Events enable loose coupling between domains  
- Aggregates ensure consistency within boundaries
- Domain services handle cross-boundary operations