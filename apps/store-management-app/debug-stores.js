import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// 環境変数を読み込み（.env.localファイル）
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// テスト用のユーザーIDを設定（実際のユーザーIDに変更してください）
const TEST_USER_ID = 'test-user-id' // 実際のユーザーIDに変更

async function debugStoreJoinQuery() {
  console.log('=== Debugging Store JOIN Query ===')
  
  try {
    // 1. business_usersテーブルの構造を確認
    console.log('\n1. Checking business_users table structure...')
    const { data: businessUsers, error: businessUsersError } = await supabase
      .from('business_users')
      .select('*')
      .limit(1)
    
    console.log('business_users sample:', businessUsers)
    if (businessUsersError) {
      console.error('business_users error:', businessUsersError)
    }
    
    // 2. store_membershipsテーブルの構造を確認
    console.log('\n2. Checking store_memberships table structure...')
    const { data: memberships, error: membershipsError } = await supabase
      .from('store_memberships')
      .select('*')
      .limit(1)
    
    console.log('store_memberships sample:', memberships)
    if (membershipsError) {
      console.error('store_memberships error:', membershipsError)
    }
    
    // 3. storesテーブルの構造を確認
    console.log('\n3. Checking stores table structure...')
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*')
      .limit(1)
    
    console.log('stores sample:', stores)
    if (storesError) {
      console.error('stores error:', storesError)
    }
    
    // 4. JOINクエリのテスト
    console.log('\n4. Testing JOIN query...')
    const { data: joinResult, error: joinError } = await supabase
      .from('business_users')
      .select(`
        id,
        store_memberships (
          id,
          role,
          store_id,
          stores (
            id,
            name,
            address
          )
        )
      `)
      .limit(1)
    
    console.log('JOIN query result:', joinResult)
    if (joinError) {
      console.error('JOIN query error:', joinError)
    }
    
    // 5. store_membershipsから直接storesをJOINする
    console.log('\n5. Testing direct store_memberships JOIN...')
    const { data: directJoin, error: directJoinError } = await supabase
      .from('store_memberships')
      .select(`
        id,
        role,
        store_id,
        stores (
          id,
          name,
          address
        )
      `)
      .limit(1)
    
    console.log('Direct JOIN result:', directJoin)
    if (directJoinError) {
      console.error('Direct JOIN error:', directJoinError)
    }
    
  } catch (error) {
    console.error('Exception occurred:', error)
  }
}

debugStoreJoinQuery()