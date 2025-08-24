# ADR-002: Multi-tenancy Strategy

## Status
Proposed

## Context
System needs to support multiple schools/organizations with complete data isolation and role-based access.

## Decision

### Row-Level Security (RLS) Based Multi-tenancy
- Add `tenant_id` to all domain tables
- Use Supabase RLS policies for automatic tenant isolation
- JWT contains tenant context for seamless filtering

### Schema Design
```sql
-- Tenant table
CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subdomain text UNIQUE NOT NULL,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- All domain tables include tenant_id
ALTER TABLE students ADD COLUMN tenant_id uuid REFERENCES tenants(id);
ALTER TABLE classes ADD COLUMN tenant_id uuid REFERENCES tenants(id);
-- ... apply to all tables
```

### RLS Policies Template
```sql
-- Example policy for students table
CREATE POLICY "tenant_isolation" ON students 
FOR ALL TO authenticated 
USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

CREATE POLICY "role_based_access" ON students
FOR SELECT TO authenticated
USING (
  tenant_id = auth.jwt() ->> 'tenant_id'::text AND
  (
    has_role('admin') OR 
    has_role('teacher') OR
    (has_role('parent') AND is_parent_of_student(id))
  )
);
```

### Authentication Flow
1. User login includes tenant context
2. JWT payload includes `tenant_id` claim  
3. All queries automatically filtered by tenant
4. Cross-tenant operations prohibited at DB level

## Consequences
- Complete data isolation between tenants
- Simplified application code (no manual tenant filtering)
- Database-level security enforcement
- Requires JWT token management for tenant context