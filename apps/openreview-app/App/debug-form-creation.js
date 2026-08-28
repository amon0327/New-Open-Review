// デバッグ用スクリプト: フォーム作成問題の調査
// ブラウザの開発者ツールのコンソールで実行してください

const debugFormCreation = async () => {
  console.log('=== フォーム作成問題デバッグ開始 ===');
  
  try {
    // 1. 現在のユーザー情報を確認
    console.log('1. ユーザー情報確認中...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ ユーザー認証エラー:', userError);
      return;
    }
    console.log('✅ ユーザーID:', user.id);
    console.log('✅ ユーザーメール:', user.email);
    
    // 2. company_membershipsテーブルの存在確認とユーザーレコード確認
    console.log('\n2. company_memberships テーブル確認中...');
    const { data: memberships, error: membershipError } = await supabase
      .from('company_memberships')
      .select('*')
      .eq('business_user_id', user.id);
    
    if (membershipError) {
      console.error('❌ company_memberships テーブルエラー:', membershipError);
      return;
    }
    
    if (!memberships || memberships.length === 0) {
      console.error('❌ ユーザーの company_memberships レコードが存在しません');
      console.log('💡 CompanySetup画面でcompany_membershipsレコードを作成する必要があります');
      return;
    }
    
    console.log('✅ company_memberships レコード数:', memberships.length);
    console.log('✅ company_id:', memberships[0].company_id);
    
    // 3. companiesテーブルの確認
    console.log('\n3. companies テーブル確認中...');
    const { data: companies, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', memberships[0].company_id);
    
    if (companyError) {
      console.error('❌ companies テーブルエラー:', companyError);
      return;
    }
    
    if (!companies || companies.length === 0) {
      console.error('❌ 参照先の companies レコードが存在しません');
      return;
    }
    
    console.log('✅ company 名:', companies[0].name);
    
    // 4. company_review_formsテーブルの存在確認
    console.log('\n4. company_review_forms テーブル確認中...');
    const { data: companyReviewForms, error: companyFormError } = await supabase
      .from('company_review_forms')
      .select('*');
    
    if (companyFormError) {
      console.error('❌ company_review_forms テーブルエラー:', companyFormError);
      console.log('💡 テーブルが存在しない可能性があります');
      return;
    }
    
    console.log('✅ company_review_forms テーブル確認完了');
    console.log('✅ 既存レコード数:', companyReviewForms.length);
    
    // 5. Edge Function呼び出しテスト
    console.log('\n5. Edge Function呼び出しテスト中...');
    const { data: functionResult, error: functionError } = await supabase.functions.invoke('create-review-form', {
      body: {
        title: 'デバッグテストフォーム'
      }
    });
    
    if (functionError) {
      console.error('❌ Edge Function エラー:', functionError);
      return;
    }
    
    if (!functionResult.success) {
      console.error('❌ Edge Function 実行エラー:', functionResult.error);
      return;
    }
    
    console.log('✅ Edge Function 実行成功');
    console.log('✅ 作成されたフォーム:', functionResult.reviewForm);
    
    // 6. company_review_formsテーブルに書き込まれたか確認
    console.log('\n6. company_review_forms への書き込み確認中...');
    const { data: newCompanyReviewForms, error: newCompanyFormError } = await supabase
      .from('company_review_forms')
      .select('*')
      .eq('review_form_id', functionResult.reviewForm.id);
    
    if (newCompanyFormError) {
      console.error('❌ company_review_forms 書き込み確認エラー:', newCompanyFormError);
      return;
    }
    
    if (!newCompanyReviewForms || newCompanyReviewForms.length === 0) {
      console.error('❌ company_review_forms テーブルに書き込まれていません');
      return;
    }
    
    console.log('✅ company_review_forms に正常に書き込まれました');
    console.log('✅ 書き込まれたレコード:', newCompanyReviewForms[0]);
    
    console.log('\n=== デバッグ完了：問題は検出されませんでした ===');
    
  } catch (error) {
    console.error('❌ 予期しないエラー:', error);
  }
};

// 実行
debugFormCreation();