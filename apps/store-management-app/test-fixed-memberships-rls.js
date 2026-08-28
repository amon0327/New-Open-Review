// 修正された store_memberships RLS のテストコード
// company_id フィールドを活用した循環参照なしのポリシー

const testFixedMembershipsRLS = {
  
  // 1. 基本的な動作確認
  async checkBasicAccess() {
    console.log('🔍 === 基本アクセス確認 ===')
    
    try {
      // 認証状態確認
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        console.log('❌ ユーザーがログインしていません')
        return false
      }
      
      console.log('✅ ユーザー認証OK:', user.email)
      
      // store_memberships テーブルへのアクセステスト
      console.log('📋 store_memberships アクセステスト...')
      const { data: memberships, error: membershipsError } = await supabase
        .from('store_memberships')
        .select('*')
      
      if (membershipsError) {
        console.error('❌ store_memberships アクセスエラー:', membershipsError.message)
        return false
      }
      
      console.log(`✅ store_memberships アクセス成功: ${memberships.length} 件`)
      
      return true
      
    } catch (error) {
      console.error('❌ 基本アクセス確認エラー:', error)
      return false
    }
  },
  
  // 2. 会社メンバーシップとの関連確認
  async checkCompanyRelationship() {
    console.log('🔍 === 会社との関連確認 ===')
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      // ユーザーの会社メンバーシップを確認
      console.log('📋 ユーザーの会社メンバーシップ確認...')
      const { data: companyMemberships, error: companyError } = await supabase
        .from('company_memberships')
        .select('company_id')
        .eq('business_user_id', user.id)
      
      if (companyError) {
        console.error('❌ company_memberships アクセスエラー:', companyError.message)
        return
      }
      
      const userCompanyIds = companyMemberships.map(cm => cm.company_id)
      console.log(`📊 所属会社数: ${userCompanyIds.length}`)
      console.log('📊 所属会社ID:', userCompanyIds)
      
      // store_memberships で同じ会社のデータが取得できているか確認
      console.log('📋 アクセス可能な store_memberships 確認...')
      const { data: storeMemberships, error: storeError } = await supabase
        .from('store_memberships')
        .select('id, business_user_id, store_id, role, company_id')
      
      if (storeError) {
        console.error('❌ store_memberships 詳細確認エラー:', storeError.message)
        return
      }
      
      console.log(`📊 アクセス可能な store_memberships: ${storeMemberships.length} 件`)
      
      // 会社IDでグループ化して表示
      const membershipsByCompany = {}
      storeMemberships.forEach(sm => {
        if (!membershipsByCompany[sm.company_id]) {
          membershipsByCompany[sm.company_id] = []
        }
        membershipsByCompany[sm.company_id].push(sm)
      })
      
      console.log('📋 会社別メンバーシップ:')
      Object.entries(membershipsByCompany).forEach(([companyId, memberships]) => {
        const isUserCompany = userCompanyIds.includes(companyId)
        const status = isUserCompany ? '✅' : '⚠️'
        console.log(`  ${status} 会社 ${companyId}: ${memberships.length} 件`)
        
        if (isUserCompany) {
          memberships.forEach(m => {
            console.log(`    - ${m.role} (store: ${m.store_id})`)
          })
        }
      })
      
      return {
        userCompanyIds,
        storeMemberships,
        membershipsByCompany
      }
      
    } catch (error) {
      console.error('❌ 会社関連確認エラー:', error)
    }
  },
  
  // 3. 循環参照が解決されているかテスト
  async testNoCircularReference() {
    console.log('🔍 === 循環参照解決テスト ===')
    
    try {
      // 複数回連続でアクセスして、無限ループが発生しないことを確認
      console.log('📋 連続アクセステスト（循環参照チェック）...')
      
      for (let i = 1; i <= 3; i++) {
        console.log(`  テスト ${i}/3...`)
        
        const startTime = Date.now()
        
        const { data, error } = await supabase
          .from('store_memberships')
          .select('id, company_id, role')
          .limit(10)
        
        const endTime = Date.now()
        
        if (error) {
          console.error(`❌ テスト ${i} エラー:`, error.message)
          return false
        }
        
        console.log(`  ✅ テスト ${i} 成功: ${data.length} 件, ${endTime - startTime}ms`)
        
        // 短い待機
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      console.log('✅ 循環参照なし: 全てのテストが正常完了')
      return true
      
    } catch (error) {
      console.error('❌ 循環参照テストエラー:', error)
      return false
    }
  },
  
  // 4. RLSポリシーの効果確認
  async testPolicyEffectiveness() {
    console.log('🔍 === RLSポリシー効果確認 ===')
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      // ユーザーの会社IDを取得
      const { data: userCompanies } = await supabase
        .from('company_memberships')
        .select('company_id')
        .eq('business_user_id', user.id)
      
      const userCompanyIds = userCompanies?.map(c => c.company_id) || []
      
      // RLS適用後の全データを取得
      const { data: accessibleMemberships } = await supabase
        .from('store_memberships')
        .select('company_id, business_user_id, role')
      
      console.log(`📊 RLS適用後アクセス可能データ: ${accessibleMemberships.length} 件`)
      
      // データの内訳分析
      let ownMemberships = 0
      let companyMemberships = 0
      let unexpectedAccess = 0
      
      accessibleMemberships.forEach(membership => {
        if (membership.business_user_id === user.id) {
          ownMemberships++
        } else if (userCompanyIds.includes(membership.company_id)) {
          companyMemberships++
        } else {
          unexpectedAccess++
        }
      })
      
      console.log('📋 アクセスデータ内訳:')
      console.log(`  ✅ 自分のメンバーシップ: ${ownMemberships} 件`)
      console.log(`  ✅ 同一会社のメンバーシップ: ${companyMemberships} 件`)
      console.log(`  ${unexpectedAccess > 0 ? '⚠️' : '✅'} 予期しないアクセス: ${unexpectedAccess} 件`)
      
      if (unexpectedAccess > 0) {
        console.log('⚠️ RLSポリシーに問題がある可能性があります')
      } else {
        console.log('✅ RLSポリシーが正常に動作しています')
      }
      
      return {
        totalAccess: accessibleMemberships.length,
        ownMemberships,
        companyMemberships,
        unexpectedAccess
      }
      
    } catch (error) {
      console.error('❌ ポリシー効果確認エラー:', error)
    }
  },
  
  // 5. 包括的テスト実行
  async runComprehensiveTest() {
    console.log('🚀 === store_memberships RLS 包括テスト開始 ===')
    
    const basicOk = await this.checkBasicAccess()
    if (!basicOk) {
      console.log('❌ 基本アクセスに問題があります。テストを中止します。')
      return
    }
    
    const companyRelation = await this.checkCompanyRelationship()
    const noCircularRef = await this.testNoCircularReference()
    const policyEffectiveness = await this.testPolicyEffectiveness()
    
    console.log('\n📋 === テスト結果サマリー ===')
    console.log('✅ 基本アクセス: 正常')
    console.log(`✅ 循環参照回避: ${noCircularRef ? '成功' : '失敗'}`)
    
    if (companyRelation) {
      console.log(`✅ 会社関連: ${companyRelation.userCompanyIds.length} 社に所属`)
    }
    
    if (policyEffectiveness) {
      console.log(`✅ RLSポリシー: ${policyEffectiveness.totalAccess} 件アクセス可能`)
      console.log(`   - 自分: ${policyEffectiveness.ownMemberships} 件`)
      console.log(`   - 同一会社: ${policyEffectiveness.companyMemberships} 件`)
    }
    
    if (noCircularRef && policyEffectiveness?.unexpectedAccess === 0) {
      console.log('🎉 全てのテストが成功しました！')
    } else {
      console.log('⚠️ 一部のテストで問題が検出されました')
    }
    
    return {
      basicOk,
      companyRelation,
      noCircularRef,
      policyEffectiveness
    }
  }
}

// 簡易テスト
const quickMembershipsTest = async () => {
  console.log('⚡ クイック store_memberships テスト')
  
  try {
    const { data, error } = await supabase
      .from('store_memberships')
      .select('id, role, company_id')
      .limit(5)
    
    if (error) {
      console.log('❌ エラー:', error.message)
    } else {
      console.log(`✅ アクセス成功: ${data.length} 件`)
      console.log('サンプルデータ:', data)
    }
  } catch (err) {
    console.log('❌ 例外:', err.message)
  }
}

console.log('🚀 修正された store_memberships RLS テストツールが読み込まれました')
console.log('使用方法:')
console.log('  testFixedMembershipsRLS.runComprehensiveTest() - 包括的テスト')
console.log('  quickMembershipsTest() - 簡易テスト')
console.log('  testFixedMembershipsRLS.testNoCircularReference() - 循環参照テストのみ')