-- =============================================================================
-- Supabase internal role passwords
-- Mounted into the postgres container at startup.
-- Passwords are substituted from the POSTGRES_PASSWORD env var at runtime.
-- This file must NOT be committed with real passwords.
-- =============================================================================

-- These roles are created by the supabase/postgres image init scripts.
-- We set passwords here so that GoTrue (auth), Storage, and Kong can connect.
alter user supabase_auth_admin    with password 'POSTGRES_PASSWORD_PLACEHOLDER';
alter user supabase_storage_admin with password 'POSTGRES_PASSWORD_PLACEHOLDER';
alter user authenticator          with password 'POSTGRES_PASSWORD_PLACEHOLDER';
alter user pgbouncer              with password 'POSTGRES_PASSWORD_PLACEHOLDER';
alter user supabase_admin         with password 'POSTGRES_PASSWORD_PLACEHOLDER';
