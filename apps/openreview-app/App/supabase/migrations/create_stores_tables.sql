-- Create stores and related tables for staff invitation system

-- Companies table (if not exists)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  website_url TEXT,
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT
);

-- Company memberships table (if not exists)
CREATE TABLE IF NOT EXISTS company_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  business_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  UNIQUE(business_user_id, company_id)
);

-- Stores table
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  address TEXT,
  phone TEXT,
  email TEXT,
  website_url TEXT,
  opening_hours JSONB,
  is_active BOOLEAN DEFAULT true
);

-- Store invitations table
CREATE TABLE IF NOT EXISTS store_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('manager', 'staff')),
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'completed', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  UNIQUE(token)
);

-- Store memberships table
CREATE TABLE IF NOT EXISTS store_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  business_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('manager', 'staff')),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(business_user_id, store_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stores_company_id ON stores(company_id);
CREATE INDEX IF NOT EXISTS idx_store_invitations_token ON store_invitations(token);
CREATE INDEX IF NOT EXISTS idx_store_invitations_email ON store_invitations(email);
CREATE INDEX IF NOT EXISTS idx_store_invitations_status ON store_invitations(status);
CREATE INDEX IF NOT EXISTS idx_store_memberships_business_user_id ON store_memberships(business_user_id);
CREATE INDEX IF NOT EXISTS idx_store_memberships_store_id ON store_memberships(store_id);
CREATE INDEX IF NOT EXISTS idx_company_memberships_business_user_id ON company_memberships(business_user_id);
CREATE INDEX IF NOT EXISTS idx_company_memberships_company_id ON company_memberships(company_id);

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_memberships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stores
DROP POLICY IF EXISTS "stores_select_policy" ON stores;
DROP POLICY IF EXISTS "stores_insert_policy" ON stores;
DROP POLICY IF EXISTS "stores_update_policy" ON stores;
DROP POLICY IF EXISTS "stores_delete_policy" ON stores;

CREATE POLICY "stores_select_policy" ON stores
FOR SELECT
USING (
  company_id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);

CREATE POLICY "stores_insert_policy" ON stores
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);

CREATE POLICY "stores_update_policy" ON stores
FOR UPDATE
USING (
  company_id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
)
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);

CREATE POLICY "stores_delete_policy" ON stores
FOR DELETE
USING (
  company_id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);

-- RLS Policies for store_invitations
DROP POLICY IF EXISTS "store_invitations_select_policy" ON store_invitations;
DROP POLICY IF EXISTS "store_invitations_insert_policy" ON store_invitations;
DROP POLICY IF EXISTS "store_invitations_update_policy" ON store_invitations;
DROP POLICY IF EXISTS "store_invitations_delete_policy" ON store_invitations;

CREATE POLICY "store_invitations_select_policy" ON store_invitations
FOR SELECT
USING (
  -- サービスロールは制限なし
  auth.role() = 'service_role' OR
  -- 会社メンバーは自社の招待を表示可能
  company_id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);

CREATE POLICY "store_invitations_insert_policy" ON store_invitations
FOR INSERT
WITH CHECK (
  -- サービスロールは制限なし
  auth.role() = 'service_role' OR
  -- 会社メンバーは自社の招待を作成可能
  company_id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);

CREATE POLICY "store_invitations_update_policy" ON store_invitations
FOR UPDATE
USING (
  -- サービスロールは制限なし
  auth.role() = 'service_role' OR
  -- 会社メンバーは自社の招待を更新可能
  company_id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
)
WITH CHECK (
  -- サービスロールは制限なし
  auth.role() = 'service_role' OR
  -- 会社メンバーは自社の招待を更新可能
  company_id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);

CREATE POLICY "store_invitations_delete_policy" ON store_invitations
FOR DELETE
USING (
  -- サービスロールは制限なし
  auth.role() = 'service_role' OR
  -- 会社メンバーは自社の招待を削除可能
  company_id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);

-- RLS Policies for store_memberships
DROP POLICY IF EXISTS "store_memberships_select_policy" ON store_memberships;
DROP POLICY IF EXISTS "store_memberships_insert_policy" ON store_memberships;
DROP POLICY IF EXISTS "store_memberships_update_policy" ON store_memberships;
DROP POLICY IF EXISTS "store_memberships_delete_policy" ON store_memberships;

CREATE POLICY "store_memberships_select_policy" ON store_memberships
FOR SELECT
USING (
  -- サービスロールは制限なし
  auth.role() = 'service_role' OR
  -- 自分のメンバーシップまたは同じ会社のメンバーシップを表示可能
  business_user_id = auth.uid() OR
  company_id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);

CREATE POLICY "store_memberships_insert_policy" ON store_memberships
FOR INSERT
WITH CHECK (
  -- サービスロールは制限なし
  auth.role() = 'service_role' OR
  -- 会社メンバーは自社のメンバーシップを作成可能
  company_id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);

CREATE POLICY "store_memberships_update_policy" ON store_memberships
FOR UPDATE
USING (
  -- サービスロールは制限なし
  auth.role() = 'service_role' OR
  -- 自分のメンバーシップまたは同じ会社のメンバーシップを更新可能
  business_user_id = auth.uid() OR
  company_id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
)
WITH CHECK (
  -- サービスロールは制限なし
  auth.role() = 'service_role' OR
  -- 会社メンバーは自社のメンバーシップを更新可能
  company_id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);

CREATE POLICY "store_memberships_delete_policy" ON store_memberships
FOR DELETE
USING (
  -- サービスロールは制限なし
  auth.role() = 'service_role' OR
  -- 自分のメンバーシップまたは同じ会社のメンバーシップを削除可能
  business_user_id = auth.uid() OR
  company_id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);