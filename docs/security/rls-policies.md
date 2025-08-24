# Row-Level Security (RLS) Policy Design

## Overview
Comprehensive RLS strategy ensuring tenant isolation and role-based access control across all data entities.

## Core Security Functions

### Role Check Functions (SECURITY DEFINER)
```sql
-- Get current user's tenant
CREATE OR REPLACE FUNCTION auth.current_tenant_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT (auth.jwt() ->> 'tenant_id')::uuid;
$$;

-- Check if user has specific role in current tenant  
CREATE OR REPLACE FUNCTION auth.has_tenant_role(check_role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.users u ON ur.user_id = u.id  
    WHERE u.auth_id = auth.uid()
    AND ur.tenant_id = auth.current_tenant_id()
    AND ur.role = check_role
    AND ur.is_active = true
  );
$$;

-- Check if user is parent of specific student
CREATE OR REPLACE FUNCTION auth.is_parent_of_student(student_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.student_parent_links spl
    JOIN public.parents p ON spl.parent_id = p.id
    JOIN public.users u ON p.user_id = u.id
    WHERE spl.student_id = is_parent_of_student.student_id
    AND u.auth_id = auth.uid()
    AND spl.tenant_id = auth.current_tenant_id()
  );
$$;
```

## Standard RLS Policy Templates

### 1. Admin Full Access Pattern
```sql
-- For tables requiring admin-only modification
CREATE POLICY "admin_full_access" ON table_name
FOR ALL TO authenticated
USING (
  tenant_id = auth.current_tenant_id() AND 
  auth.has_tenant_role('admin')
);
```

### 2. Role-Based Read Access Pattern
```sql
-- For tables with role-based read permissions
CREATE POLICY "role_based_read" ON table_name  
FOR SELECT TO authenticated
USING (
  tenant_id = auth.current_tenant_id() AND (
    auth.has_tenant_role('admin') OR
    auth.has_tenant_role('accountant') OR  
    auth.has_tenant_role('teacher') OR
    (auth.has_tenant_role('parent') AND is_accessible_to_parent())
  )
);
```

### 3. Finance Role Write Access Pattern  
```sql
-- For financial tables requiring finance permissions
CREATE POLICY "finance_write_access" ON table_name
FOR INSERT TO authenticated  
WITH CHECK (
  tenant_id = auth.current_tenant_id() AND (
    auth.has_tenant_role('admin') OR
    auth.has_tenant_role('accountant')
  )
);
```

## Table-Specific Policies

### Students Table
```sql
-- Students can be viewed by staff and parents of the student
CREATE POLICY "students_read_access" ON students
FOR SELECT TO authenticated
USING (
  tenant_id = auth.current_tenant_id() AND (
    auth.has_tenant_role('admin') OR
    auth.has_tenant_role('teacher') OR  
    auth.has_tenant_role('accountant') OR
    (auth.has_tenant_role('parent') AND auth.is_parent_of_student(id))
  )
);

-- Only admins can modify students
CREATE POLICY "students_admin_modify" ON students  
FOR ALL TO authenticated
USING (
  tenant_id = auth.current_tenant_id() AND
  auth.has_tenant_role('admin')
);
```

### Fee Records Table
```sql
-- Fee records visible to finance staff and parents of the student
CREATE POLICY "fee_records_read_access" ON student_fee_records
FOR SELECT TO authenticated  
USING (
  tenant_id = auth.current_tenant_id() AND (
    auth.has_tenant_role('admin') OR
    auth.has_tenant_role('accountant') OR
    (auth.has_tenant_role('parent') AND auth.is_parent_of_student(student_id))
  )
);

-- Only finance staff can modify fee records
CREATE POLICY "fee_records_finance_modify" ON student_fee_records
FOR ALL TO authenticated
USING (
  tenant_id = auth.current_tenant_id() AND (
    auth.has_tenant_role('admin') OR  
    auth.has_tenant_role('accountant')
  )
);
```

### Payment Records Table
```sql
-- Payments follow same pattern as fee records
CREATE POLICY "payments_read_access" ON fee_payment_records  
FOR SELECT TO authenticated
USING (
  tenant_id = auth.current_tenant_id() AND (
    auth.has_tenant_role('admin') OR
    auth.has_tenant_role('accountant') OR
    (auth.has_tenant_role('parent') AND auth.is_parent_of_student(student_id))
  )
);

-- Only finance staff can create payments (no updates/deletes)
CREATE POLICY "payments_finance_create" ON fee_payment_records
FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = auth.current_tenant_id() AND (
    auth.has_tenant_role('admin') OR
    auth.has_tenant_role('accountant')  
  )
);
```

### Audit Tables (Read-Only)
```sql
-- Audit logs are read-only for admins
CREATE POLICY "audit_admin_read" ON audit_log
FOR SELECT TO authenticated
USING (
  tenant_id = auth.current_tenant_id() AND
  auth.has_tenant_role('admin')
);

-- System can insert audit records  
CREATE POLICY "audit_system_insert" ON audit_log
FOR INSERT TO authenticated
WITH CHECK (true); -- System context, no user restrictions
```

## Implementation Checklist

### Phase 1: Core Security Setup
- [ ] Create security definer functions
- [ ] Add tenant_id to all tables  
- [ ] Implement user_roles table with tenant_id
- [ ] Add basic tenant isolation policies

### Phase 2: Role-Based Access
- [ ] Implement role hierarchy policies
- [ ] Add parent-student relationship checks
- [ ] Create finance-specific policies
- [ ] Add read-only auditor access

### Phase 3: Advanced Security
- [ ] Implement field-level restrictions
- [ ] Add time-based access controls
- [ ] Create emergency admin access procedures
- [ ] Add security event logging

## Testing Strategy

### Security Tests
1. **Tenant Isolation**: Verify users can't access other tenant data
2. **Role Enforcement**: Test each role's permissions thoroughly
3. **Parent Access**: Verify parents only see their children's data
4. **Admin Override**: Ensure admins have appropriate access
5. **Audit Trail**: Verify all security events are logged

### Test Scenarios  
```sql
-- Test tenant isolation
SET auth.jwt_claim.tenant_id TO 'tenant-a-uuid';
SELECT * FROM students; -- Should only return tenant A students

-- Test parent access
SET auth.jwt_claim.sub TO 'parent-user-uuid';  
SELECT * FROM student_fee_records; -- Should only return their children's records

-- Test role restrictions
SET auth.jwt_claim.sub TO 'teacher-user-uuid';
INSERT INTO fee_payment_records (...); -- Should fail (no finance role)
```

## Monitoring & Alerting

### Security Events to Monitor
- Failed RLS policy violations
- Unauthorized access attempts  
- Privilege escalation attempts
- Cross-tenant data access
- Unusual query patterns

### Alerts Configuration
- Immediate: Multiple failed access attempts
- Hourly: RLS policy violations summary
- Daily: Security audit report
- Weekly: Access pattern analysis

## Emergency Procedures

### Admin Lock-Out Recovery
1. Use Supabase dashboard admin access
2. Temporarily disable RLS on user_roles table
3. Fix role assignments
4. Re-enable RLS and verify

### Data Breach Response
1. Immediately revoke affected user sessions
2. Audit access logs for breach scope
3. Notify affected tenants
4. Implement additional security measures
5. Conduct post-incident review