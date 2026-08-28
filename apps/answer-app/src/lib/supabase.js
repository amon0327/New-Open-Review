import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
export const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to convert hex color string to valid CSS color
export const stringToColor = (colorString) => {
  if (!colorString) return '#8C52FF'; // Default primary color
  return colorString.startsWith('#') ? colorString : `#${colorString}`;
};

// Get review form with validation
export const getReviewForm = async (reviewFormId, isPreviewMode = false) => {
  try {
    let query = supabase
      .from('review_forms')
      .select('*')
      .eq('id', reviewFormId)
      .eq('is_deleted', false);
    
    // プレビューモードでない場合のみ公開状態をチェック
    if (!isPreviewMode) {
      query = query.eq('is_published', true);
    }
    
    const { data, error } = await query.single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    return null;
  }
};

// Get login screen settings for the form
export const getLoginScreenSettings = async (reviewFormId) => {
  try {
    const { data, error } = await supabase
      .from('login_screen_settings')
      .select('*')
      .eq('review_forms_id', reviewFormId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    return null;
  }
};

// Get form settings (logo, theme, etc.)
export const getReviewFormSettings = async (reviewFormId) => {
  try {
    const { data, error } = await supabase
      .from('review_form_settings')
      .select('*')
      .eq('review_form_id', reviewFormId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    return null;
  }
};

// Check if review form has pages/questions
export const getReviewFormPages = async (reviewFormId) => {
  try {
    const { data, error } = await supabase
      .from('review_form_pages')
      .select('*')
      .eq('review_forms_id', reviewFormId);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    return [];
  }
};

// Helper function to ensure user exists in public.users table (LINE専用に簡略化)
const ensureUserExists = async (authUser) => {
  try {
    // まず、ユーザーがpublic.usersテーブルに存在するか確認
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', authUser.id)
      .single();
    
    // PGRST116 means user not found
    if (checkError && checkError.code === 'PGRST116') {
      // LINEユーザーの場合はdisplayNameも考慮
      const userName = authUser.user_metadata?.full_name || 
                      authUser.user_metadata?.name ||
                      authUser.user_metadata?.displayName || 
                      authUser.email?.split('@')[0] || 
                      'ユーザー';
      
      const userData = {
        id: authUser.id,
        email: authUser.email,
        name: userName,
        line_user_id: authUser.user_metadata?.line_user_id || null,
        created_at: new Date().toISOString()
      };
      
      const { error: insertError } = await supabase
        .from('users')
        .insert([userData]);
      
      if (insertError) {
        console.error('User insert error:', insertError);
        throw insertError;
      }
      
      console.log('User created in public.users table:', userData);
    }
  } catch (error) {
    console.error('ensureUserExists error:', error);
    // エラーが発生してもアプリケーションは続行
  }
};

// Authentication functions
export const signInWithEmail = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    // Ensure user exists in public.users table
    if (data.user) {
      await ensureUserExists(data.user);
    }
    
    return { user: data.user, session: data.session };
  } catch (error) {
    throw error;
  }
};

export const signUpWithEmail = async (email, password, name) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name
        }
      }
    });
    
    if (error) throw error;
    
    // If user is created, also create user record in public.users table
    if (data.user) {
      // Use upsert to avoid conflicts if user already exists
      const { error: userError } = await supabase
        .from('users')
        .upsert([
          {
            id: data.user.id,
            email: email,
            name: name
          }
        ], { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });
      
      if (userError) {
        // Don't throw error here - auth user was created successfully
      }
    }
    
    return { user: data.user, session: data.session };
  } catch (error) {
    throw error;
  }
};

export const signInWithGoogle = async (customRedirectPath = null, preserveParams = true) => {
  try {
    // URLパラメータを取得
    const urlParams = new URLSearchParams(window.location.search);
    const reviewFormId = urlParams.get('reviewFormId');
    const mode = urlParams.get('mode');
    
    let redirectTo;
    
    if (customRedirectPath) {
      // カスタムリダイレクトパスが指定された場合（PreviewLoginPageから）
      redirectTo = customRedirectPath;
    } else {
      // 通常のリダイレクト処理
      if (mode === 'preview') {
        // プレビューモードの場合
        redirectTo = `${window.location.origin}/?reviewFormId=${reviewFormId}&mode=preview`;
      } else {
        // 通常モードの場合
        let questionsUrl = `${window.location.origin}/questions`;
        if (reviewFormId && preserveParams) {
          questionsUrl += `?reviewFormId=${reviewFormId}`;
        }
        redirectTo = questionsUrl;
      }
    }
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

// LINEログインでユーザーを登録・取得（シンプル版）
export const registerLineUser = async (lineProfile) => {
  try {
    console.log('registerLineUser called with profile:', lineProfile);
    console.log('Supabase URL:', supabaseUrl);
    console.log('Using endpoint:', `${supabaseUrl}/functions/v1/line-register`);
    
    const response = await fetch(`${supabaseUrl}/functions/v1/line-register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({ lineProfile })
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        throw new Error(`Server error: ${errorText}`);
      }
      
      throw new Error(errorData.error || 'LINE registration failed');
    }

    const responseData = await response.json();
    console.log('LINE registration response:', responseData);

    const { user, isNewUser } = responseData;

    if (user) {
      // ユーザー情報をlocalStorageに保存
      localStorage.setItem('line_user', JSON.stringify(user));
      console.log('User saved to localStorage');
    }
    
    return {
      user: user,
      isNewUser: isNewUser
    };
  } catch (error) {
    console.error('LINE registration error:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
};

export const signOut = async () => {
  try {
    // LINEユーザー情報をクリア
    localStorage.removeItem('line_user');
    
    // 通常のSupabaseサインアウト
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    // LINEユーザーの場合はlocalStorageから取得
    const lineUser = localStorage.getItem('line_user');
    if (lineUser) {
      return JSON.parse(lineUser);
    }
    
    // 通常のSupabase認証（LINE以外のユーザー用）
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    
    // Ensure user exists in public.users table
    if (user) {
      await ensureUserExists(user);
    }
    
    return user;
  } catch (error) {
    return null;
  }
};

// LINEユーザーかどうかを判定
export const isLineUser = (user) => {
  return user?.user_metadata?.is_line_user === true || 
         user?.app_metadata?.provider === 'line';
};

// ユーザーの詳細情報を取得（usersテーブルから）
export const getUserDetails = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    return null;
  }
};

export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};

// セッション取得関数
export const getSession = async () => {
  try {
    // LINEユーザーの場合はlocalStorageから取得
    const lineUser = localStorage.getItem('line_user');
    if (lineUser) {
      // 擬似セッションを返す
      return {
        user: JSON.parse(lineUser),
        access_token: 'line-user',
        token_type: 'bearer'
      };
    }
    
    // 通常のSupabase認証
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    return null;
  }
};

export const signInAnonymously = async () => {
  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    
    if (error) throw error;
    
    // Create a temporary user record for anonymous users
    if (data.user) {
      await ensureUserExists(data.user, true); // Pass true to indicate anonymous user
    }
    
    return { user: data.user, session: data.session };
  } catch (error) {
    throw error;
  }
};

// Get completion screen settings for the form
export const getCompletionScreenSettings = async (reviewFormId) => {
  try {
    const { data, error } = await supabase
      .from('completion_screen_settings')
      .select('*')
      .eq('review_forms_id', reviewFormId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    return null;
  }
};

// Get question screen settings for the form
export const getQuestionScreenSettings = async (reviewFormId) => {
  try {
    const { data, error } = await supabase
      .from('question_screen_settings')
      .select('*')
      .eq('review_forms_id', reviewFormId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    return null;
  }
};

// Get review questions for a specific page
export const getReviewQuestions = async (reviewFormId, pageId) => {
  try {
    const { data, error } = await supabase
      .from('review_questions')
      .select(`
        *,
        question_option_choices(*),
        question_option_linear_scale(*)
      `)
      .eq('review_fome_id', reviewFormId)
      .eq('review_form_pages_id', pageId)
      .order('question_number', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    return [];
  }
};

// Get all question option choices for a question
export const getQuestionOptionChoices = async (questionId) => {
  try {
    const { data, error } = await supabase
      .from('question_option_choices')
      .select('*')
      .eq('review_questions_id', questionId)
      .order('choice_number', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    return [];
  }
};

// Get linear scale settings for a question
export const getQuestionLinearScale = async (questionId) => {
  try {
    const { data, error } = await supabase
      .from('question_option_linear_scale')
      .select('*')
      .eq('review_questions_id', questionId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    return null;
  }
};

// Save review form answers (implementing Flutter app logic)
// New lottery function that calls Edge Function
export const submitAnswersWithLottery = async (reviewFormId, userId, answersData, storeCode = null, selectedAspectInfo = null) => {
  try {
    // First ensure user exists in public.users table
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userCheckError && userCheckError.code === 'PGRST116') {
      // User doesn't exist, get auth user info and create
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        await ensureUserExists(authUser);
      }
    }

    // Now call lottery function
    const { data, error } = await supabase.functions.invoke('lottery', {
      body: { reviewFormId, userId, answersData, storeCode, selectedAspectInfo }
    });

    if (error) throw error;

    return {
      success: true,
      ...data
    };
  } catch (error) {
    console.error('Error in lottery submission:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Save preset page 3 and 4 answers to the specific tables
export const savePresetDetailAnswers = async (presetAnswerId, userId, companyId, storeId, submissionId, answersData, aspectType, isPositive = null) => {
  console.log('=== savePresetDetailAnswers START ===');
  console.log('presetAnswerId:', presetAnswerId);
  console.log('aspectType:', aspectType);
  console.log('isPositive:', isPositive);
  console.log('answersData keys:', Object.keys(answersData));
  
  try {
    let tableName;
    let answers = {};
    
    // Determine table based on aspect type
    switch (aspectType) {
      case 'quality':
        tableName = 'preset_quality_question_answer';
        break;
      case 'service':
        tableName = 'preset_service_question_answer';
        break;
      case 'cleanliness':
        tableName = 'preset_cleanliness_question_answer';
        break;
      default:
        throw new Error(`Unknown aspect type: ${aspectType}`);
    }
    
    console.log('Selected table:', tableName);
    
    // Base record
    const record = {
      preset_question_answer_id: presetAnswerId,
      user_id: userId,
      company_id: companyId,
      store_id: storeId,
      review_form_submission_id: submissionId
    };
    
    // Add is_positive field if provided
    if (isPositive !== null) {
      record.is_positive = isPositive;
    }
    
    // Map page 3 sentiment matrix answers
    if (answersData['required_3_1']) {
      console.log('Processing page 3 matrix answers...');
      try {
        const matrixAnswers = JSON.parse(answersData['required_3_1'].answer);
        console.log('Parsed matrix answers:', matrixAnswers);
        
        // Map matrix items to q1-q10
        Object.entries(matrixAnswers).forEach(([key, value]) => {
          console.log(`Processing key: ${key}, value: ${value}`);
          
          // Extract question number from key (e.g., 'q1' -> 1, 's1' -> 1, 'c1' -> 1)
          const match = key.match(/[qsc](\d+)/);
          if (match) {
            const qNum = parseInt(match[1]);
            console.log(`Extracted question number: ${qNum}`);
            
            if (qNum >= 1 && qNum <= 10) {
              // Convert numeric values to emotion enum
              if (value === 1) {
                record[`q${qNum}`] = 'positive';
              } else if (value === -1) {
                record[`q${qNum}`] = 'negative';
              } else if (value === 0) {
                record[`q${qNum}`] = 'neutral';
              }
              console.log(`Set record.q${qNum} = ${record[`q${qNum}`]}`);
            }
          }
        });
      } catch (e) {
        console.error('Error parsing matrix answers:', e);
      }
    } else {
      console.log('No page 3 matrix answers found in answersData');
    }
    
    // Map page 4 text answers to the new preset_question_answer_comment table
    const page4Questions = ['required_4_1', 'required_4_2', 'required_4_3', 'required_4_4', 'required_4_5'];
    const commentInserts = [];
    
    page4Questions.forEach((questionId) => {
      if (answersData[questionId] && answersData[questionId].answer) {
        // Extract question number from ID (e.g., 'required_4_1' -> 1)
        const questionNumber = parseInt(questionId.split('_').pop());
        
        // Skip question 5 for cleanliness (it only has 4 questions)
        if (aspectType === 'cleanliness' && questionNumber === 5) {
          return;
        }
        
        commentInserts.push({
          preset_question_answer_id: presetAnswerId,
          comment: answersData[questionId].answer,
          selected_qsc: aspectType,
          question_number: questionNumber,
          is_positive: isPositive
        });
      }
    });
    
    // Insert comments into the new table if any exist
    if (commentInserts.length > 0) {
      const { error: commentError } = await supabase
        .from('preset_question_answer_comment')
        .insert(commentInserts);
        
      if (commentError) {
        console.error('Error saving preset comments:', commentError);
        throw commentError;
      }
    }
    
    // Log final record before insert
    console.log('Final record to insert:', JSON.stringify(record, null, 2));
    console.log('Inserting into table:', tableName);
    
    // Insert into the appropriate table
    const { data, error } = await supabase
      .from(tableName)
      .insert([record])
      .select();
      
    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }
    
    console.log('Insert successful, returned data:', data);
    console.log('=== savePresetDetailAnswers END ===');
    
    return { success: true };
  } catch (error) {
    console.error('Error saving preset detail answers:', error);
    console.log('=== savePresetDetailAnswers ERROR END ===');
    throw error;
  }
};

// Save preset question answers to the preset_question_answer table
// Save user features based on preset answers
export const savePresetUserFeatures = async (submissionId, userId, companyId, storeId, answersData, selectedAspectInfo) => {
  console.log('=== savePresetUserFeatures START ===');
  console.log('submissionId:', submissionId);
  console.log('selectedAspectInfo:', selectedAspectInfo);
  console.log('answersData keys:', Object.keys(answersData));
  
  try {
    // Determine result_type based on NPS, revisit intention, and visit frequency
    let resultType = null;
    
    // Get answers from page 1
    const npsScore = parseInt(answersData['required_1_1']?.answer || 0);
    const willRevisit = answersData['required_1_2']?.answer === '1'; // true if 'はい'
    const visitFrequency = answersData['required_1_3']?.answer;
    const isFirstVisit = visitFrequency === '1'; // '初めて'
    
    // Determine NPS category
    let npsCategory;
    if (npsScore >= 9) {
      npsCategory = '推奨';
    } else if (npsScore >= 7) {
      npsCategory = '中立';
    } else {
      npsCategory = '批判';
    }
    
    // Determine result_type based on the table
    if (npsCategory === '推奨' && willRevisit && !isFirstVisit) {
      resultType = 1;
    } else if (npsCategory === '推奨' && willRevisit && isFirstVisit) {
      resultType = 2;
    } else if (npsCategory === '中立' && willRevisit && isFirstVisit) {
      resultType = 3;
    } else if (npsCategory === '中立' && !willRevisit && !isFirstVisit) {
      resultType = 4;
    } else if (npsCategory === '中立' && !willRevisit && isFirstVisit) {
      resultType = 5;
    } else if (npsCategory === '批判' && willRevisit && isFirstVisit) {
      resultType = 6;
    } else if (npsCategory === '批判' && !willRevisit && !isFirstVisit) {
      resultType = 7;
    } else if (npsCategory === '批判' && !willRevisit && isFirstVisit) {
      resultType = 8;
    } else if (npsCategory === '推奨' && !willRevisit && !isFirstVisit) {
      resultType = 9;
    } else if (npsCategory === '推奨' && !willRevisit && isFirstVisit) {
      resultType = 10;
    } else if (npsCategory === '中立' && willRevisit && !isFirstVisit) {
      resultType = 11;
    } else if (npsCategory === '批判' && willRevisit && !isFirstVisit) {
      resultType = 12;
    }
    
    // Determine selected_qsc based on the aspect (use English enum values)
    let selectedQsc = null;
    if (selectedAspectInfo?.aspectType === 'quality') {
      selectedQsc = 'quality';
    } else if (selectedAspectInfo?.aspectType === 'service') {
      selectedQsc = 'service';
    } else if (selectedAspectInfo?.aspectType === 'cleanliness') {
      selectedQsc = 'cleanliness';
    }
    
    // For page 5 (tournament), determine top preferences
    let topPreference = null;
    let secondPreference = null;
    
    if (answersData['required_5_1']) {
      try {
        const tournamentData = JSON.parse(answersData['required_5_1'].answer);
        
        // Get tournament results from saved data
        if (tournamentData.matches && tournamentData.matches.length >= 6) {
          // Simple win counting logic
          const winCounts = {};
          tournamentData.matches.forEach(match => {
            winCounts[match.winner] = (winCounts[match.winner] || 0) + 1;
          });
          
          // Sort by wins
          const sorted = Object.entries(winCounts).sort((a, b) => b[1] - a[1]);
          
          // Map attribute IDs to preferences (use English enum values)
          const preferenceMap = {
            'taste': 'quality',
            'service': 'service',
            'space': 'space',
            'hygiene': 'cleanliness',
            'price': 'price_sensitivity'
          };
          
          if (sorted[0]) {
            topPreference = preferenceMap[sorted[0][0]];
          }
          if (sorted[1]) {
            secondPreference = preferenceMap[sorted[1][0]];
          }
        }
      } catch (e) {
        console.error('Error parsing tournament data:', e);
      }
    }
    
    // Create record
    const record = {
      review_form_submission_id: submissionId,
      user_id: userId,
      company_id: companyId,
      store_id: storeId,
      result_type: resultType,
      selected_qsc: selectedQsc,
      top_preference: topPreference,
      second_preference: secondPreference
    };
    
    // Log final record before insert
    console.log('Final user features record:', JSON.stringify(record, null, 2));
    
    // Insert into preset_answer_user_features table
    const { data, error } = await supabase
      .from('preset_answer_user_features')
      .insert([record])
      .select();
      
    if (error) {
      console.error('Supabase insert error for user features:', error);
      throw error;
    }
    
    console.log('User features insert successful:', data);
    console.log('=== savePresetUserFeatures END ===');
    
    return { success: true };
  } catch (error) {
    console.error('Error saving preset user features:', error);
    console.log('=== savePresetUserFeatures ERROR END ===');
    throw error;
  }
};

export const savePresetQuestionAnswers = async (reviewFormId, userId, answersData, submissionId, storeCode = null) => {
  try {
    // Get company_id and store_id
    const { data: formData, error: formError } = await supabase
      .from('review_forms')
      .select('company_id')
      .eq('id', reviewFormId)
      .single();

    if (formError) throw formError;

    const companyId = formData.company_id;

    // Get store_id from storeCode if provided
    let storeId = null;
    if (storeCode) {
      const { data: storeData } = await supabase
        .from('stores')
        .select('id')
        .eq('store_url_code', storeCode)
        .eq('company_id', companyId)
        .single();
      
      if (storeData) {
        storeId = storeData.id;
      }
    }

    // If no storeId from storeCode, try to get from store_review_forms
    if (!storeId) {
      const { data: storeReviewForm } = await supabase
        .from('store_review_forms')
        .select('store_id')
        .eq('review_form_id', reviewFormId)
        .single();
      
      if (storeReviewForm) {
        storeId = storeReviewForm.store_id;
      }
    }

    // Map answers to preset_question_answer columns
    const presetAnswers = {
      review_form_submission_id: submissionId,
      user_id: userId,
      company_id: companyId,
      store_id: storeId
    };

    // Page 1 mappings
    if (answersData['required_1_1']) {
      presetAnswers.p1_q1 = parseInt(answersData['required_1_1'].answer);
    }
    if (answersData['required_1_2']) {
      const revisitMap = {
        '1': '1ヶ月以内',
        '2': '3ヶ月以内',
        '3': '6ヶ月以内',
        '4': '10ヶ月以内',
        '5': '1年以内',
        '6': '1年以上'
      };
      presetAnswers.p1_q2 = revisitMap[answersData['required_1_2'].answer];
    }
    if (answersData['required_1_3']) {
      const visitMap = {
        '1': '初めて',
        '2': '2回目',
        '3': '3回目',
        '4': '4回目',
        '5': '5回目',
        '6': '6回目~10回目',
        '7': '11回目以上'
      };
      presetAnswers.p1_q3 = visitMap[answersData['required_1_3'].answer];
    }
    if (answersData['required_1_4']) {
      const genderMap = {
        '1': '男性',
        '2': '女性',
        '3': 'その他'
      };
      presetAnswers.p1_q4 = genderMap[answersData['required_1_4'].answer];
    }
    if (answersData['required_1_5']) {
      const ageMap = {
        '1': '~19歳',
        '2': '20歳~24歳',
        '3': '25歳~29歳',
        '4': '30歳~34歳',
        '5': '35歳~39歳',
        '6': '40歳~44歳',
        '7': '45歳~49歳',
        '8': '50歳~54歳',
        '9': '55歳~59歳',
        '10': '60歳~69歳',
        '11': '70歳~79歳',
        '12': '80歳~'
      };
      presetAnswers.p1_q5 = ageMap[answersData['required_1_5'].answer];
    }
    if (answersData['required_1_6']) {
      const companionMap = {
        '1': 'お一人',
        '2': 'ご家族',
        '3': 'ご友人',
        '4': '恋人・パートナー',
        '5': '職場の同僚',
        '6': 'お取引先・ビジネス関係',
        '7': 'その他'
      };
      presetAnswers.p1_q6 = companionMap[answersData['required_1_6'].answer];
    }
    if (answersData['required_1_7']) {
      const groupSizeMap = {
        '1': '1名様',
        '2': '2名様',
        '3': '3名様',
        '4': '4名様',
        '5': '5名様',
        '6': '6名様以上'
      };
      presetAnswers.p1_q7 = groupSizeMap[answersData['required_1_7'].answer];
    }

    // Page 2 mappings
    if (answersData['required_2_1']) {
      presetAnswers.p2_q1 = parseInt(answersData['required_2_1'].answer);
    }
    if (answersData['required_2_2']) {
      presetAnswers.p2_q2 = parseInt(answersData['required_2_2'].answer);
    }
    if (answersData['required_2_3']) {
      presetAnswers.p2_q3 = parseInt(answersData['required_2_3'].answer);
    }
    if (answersData['required_2_4']) {
      presetAnswers.p2_q4 = answersData['required_2_4'].answer === '1';
    }

    // Insert into preset_question_answer table
    const { data: presetData, error: insertError } = await supabase
      .from('preset_question_answer')
      .insert([presetAnswers])
      .select()
      .single();

    if (insertError) throw insertError;

    return { success: true, presetAnswerId: presetData.id };
  } catch (error) {
    console.error('Error saving preset answers:', error);
    throw error;
  }
};

// Confirm receipt function that calls Edge Function
export const confirmReceipt = async (winnerId) => {
  try {
    const { data, error } = await supabase.functions.invoke('confirm-receipt', {
      body: { winnerId }
    });

    if (error) throw error;

    return {
      success: true,
      ...data
    };
  } catch (error) {
    console.error('Error in confirm receipt:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Verify winner token function that calls Edge Function
export const verifyWinnerToken = async (token) => {
  try {
    const { data, error } = await supabase.functions.invoke('verify-winner-token', {
      body: { token }
    });

    if (error) throw error;

    return {
      success: true,
      ...data
    };
  } catch (error) {
    console.error('Error in verify winner token:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Keep original function for backward compatibility
export const saveReviewFormAnswers = async (reviewFormId, userId, answersData) => {
  try {
    // 0. Ensure user exists in public.users table before creating submission
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    // 1. Get store_id from store_review_forms table
    console.log('Looking for store_id for reviewFormId:', reviewFormId);
    const { data: storeReviewForm, error: storeError } = await supabase
      .from('store_review_forms')
      .select('store_id')
      .eq('review_form_id', reviewFormId)
      .single();
    
    let storeId;
    if (storeError) {
      console.error('Store lookup error:', storeError);
      
      // If no store relationship exists, create a default store_id
      // This is a fallback to prevent complete failure
      if (storeError.code === 'PGRST116') {
        console.log('No store relationship found, using fallback store_id');
        // Use a default UUID that indicates this is a fallback
        storeId = '00000000-0000-0000-0000-000000000001';
        console.log('Using fallback store_id:', storeId);
      } else {
        throw storeError;
      }
    } else {
      storeId = storeReviewForm.store_id;
      console.log('Found store_id:', storeId);
    }
    
    // 2. Create submission record
    const submissionRecord = {
      review_forms_id: reviewFormId,
      users: userId
    };
    
    // Always include store_id (including fallback value)
    submissionRecord.store_id = storeId;
    
    console.log('Creating submission with record:', submissionRecord);
    const { data: submissionData, error: submissionError } = await supabase
      .from('review_form_submissions')
      .insert([submissionRecord])
      .select()
      .single();
    
    if (submissionError) throw submissionError;
    
    const submissionId = submissionData.id;
    
    // 3. Process each answer
    for (const [questionId, answerData] of Object.entries(answersData)) {
      // Create question answer record
      const questionAnswerRecord = {
        review_form_submissions_id: submissionId,
        review_questions_id: questionId
      };
      
      // Always include store_id (including fallback value)
      questionAnswerRecord.store_id = storeId;
      
      const { data: questionAnswerData, error: questionAnswerError } = await supabase
        .from('review_question_answers')
        .insert([questionAnswerRecord])
        .select()
        .single();
      
      if (questionAnswerError) throw questionAnswerError;
      
      const questionAnswerId = questionAnswerData.id;
      
      // 4. Save specific answer type based on question type
      const questionTypeId = answerData.questionTypeId;
      
      switch (questionTypeId) {
        case 1: // Short text
        case 2: // Long text
          if (answerData.answer) {
            const textAnswerRecord = {
              review_questions_answers_id: questionAnswerId,
              answer_text: answerData.answer
            };
            
            // Always include store_id (including fallback value)
            textAnswerRecord.store_id = storeId;
            
            const { error: textError } = await supabase
              .from('question_answer_texts')
              .insert([textAnswerRecord]);
            if (textError) throw textError;
          }
          break;
          
        case 3: // Single choice
        case 8: // Pull down
          if (answerData.answer) {
            // Find the choice ID based on choice number
            const { data: choiceData, error: choiceError } = await supabase
              .from('question_option_choices')
              .select('id')
              .eq('review_questions_id', questionId)
              .eq('choice_number', parseInt(answerData.answer))
              .single();
            
            if (choiceError) {
              if (choiceError.code === 'PGRST116') {
                continue; // Skip this answer
              }
              throw choiceError;
            }
            
            const choiceAnswerRecord = {
              review_question_answers_id: questionAnswerId,
              question_option_choices_id: choiceData.id
            };
            
            // Always include store_id (including fallback value)
            choiceAnswerRecord.store_id = storeId;
            
            const { error: choiceAnswerError } = await supabase
              .from('question_answer_option_choices')
              .insert([choiceAnswerRecord]);
            if (choiceAnswerError) throw choiceAnswerError;
          }
          break;
          
        case 4: // Multiple choice
        case 5: // Single choice matrix
        case 6: // Multiple choice matrix
          if (answerData.answers && Array.isArray(answerData.answers)) {
            for (const choiceNumber of answerData.answers) {
              // Find the choice ID based on choice number
              const { data: choiceData, error: choiceError } = await supabase
                .from('question_option_choices')
                .select('id')
                .eq('review_questions_id', questionId)
                .eq('choice_number', parseInt(choiceNumber))
                .single();
              
              if (choiceError) {
                if (choiceError.code === 'PGRST116') {
                  continue; // Skip this choice
                }
                throw choiceError;
              }
              
              const choiceAnswerRecord = {
                review_question_answers_id: questionAnswerId,
                question_option_choices_id: choiceData.id
              };
              
              // Always include store_id (including fallback value)
              choiceAnswerRecord.store_id = storeId;
              
              const { error: choiceAnswerError } = await supabase
                .from('question_answer_option_choices')
                .insert([choiceAnswerRecord]);
              if (choiceAnswerError) throw choiceAnswerError;
            }
          }
          break;
          
        case 7: // Linear scale
          if (answerData.answer) {
            const scaleAnswerRecord = {
              review_question_answers_id: questionAnswerId,
              answer_number: parseInt(answerData.answer)
            };
            
            // Always include store_id (including fallback value)
            scaleAnswerRecord.store_id = storeId;
            
            const { error: scaleError } = await supabase
              .from('question_answer_option_linear_scale')
              .insert([scaleAnswerRecord]);
            if (scaleError) throw scaleError;
          }
          break;
          
        default:
      }
    }
    
    return { success: true, submissionId };
  } catch (error) {
    throw error;
  }
};

// Check if current time is within store business hours
export const checkBusinessHours = async (reviewFormId) => {
  try {
    // Get store_id from store_review_forms table
    // Use maybeSingle() instead of single() to handle 0 rows gracefully
    const { data: storeReviewForm, error: storeError } = await supabase
      .from('store_review_forms')
      .select('store_id')
      .eq('review_form_id', reviewFormId)
      .maybeSingle();

    // If no store relationship exists, assume no time restrictions
    if (!storeReviewForm || storeError) {
      console.log('No store relationship found, skipping business hours check');
      return true;
    }

    // Get store business hours
    const { data: storeData, error: storeDataError } = await supabase
      .from('stores')
      .select('opening_time, closing_time')
      .eq('id', storeReviewForm.store_id)
      .maybeSingle();

    // If no store data exists, assume no time restrictions
    if (!storeData || storeDataError) {
      console.log('No store data found, skipping business hours check');
      return true;
    }

    // If opening_time or closing_time is null, assume no time restrictions
    if (!storeData.opening_time || !storeData.closing_time) {
      return true;
    }

    // Get current time in Japan timezone
    const now = new Date();
    const japanTime = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(now);

    const currentTime = japanTime;
    const openingTime = storeData.opening_time;
    const closingTime = storeData.closing_time;

    // Compare times (format: HH:MM:SS)
    return currentTime >= openingTime && currentTime <= closingTime;
  } catch (error) {
    console.log('Business hours check info:', error);
    // If any error occurs, assume no time restrictions (allow submission)
    return true;
  }
};

// Get store redirect URL by store code
export const getStoreRedirectUrl = async (storeCode) => {
  try {
    console.log('Looking up store with code:', storeCode);

    // First, try Edge Function
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/store-redirect?code=${storeCode}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();
      console.log('Edge Function response:', {
        status: response.status,
        ok: response.ok,
        result
      });

      if (response.ok) {
        return result;
      } else {
        console.error('Edge Function returned error:', result);
      }
    } catch (fetchError) {
      console.log('Edge Function failed, falling back to direct query:', fetchError);
    }

    // Fallback: Direct Supabase query
    // Find the store by store_url_code
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('id, company_id, companies!inner(line_mini_app_url)')
      .eq('store_url_code', storeCode)
      .single();

    if (storeError || !storeData) {
      console.error('Store not found:', storeError);
      return {
        success: false,
        error: 'Store not found'
      };
    }

    console.log('Found store:', storeData);

    // Find the published review form for this store
    const { data: storeReviewForms, error: formError } = await supabase
      .from('store_review_forms')
      .select(`
        review_form_id,
        is_published,
        created_at,
        review_forms!inner (
          id,
          is_published,
          is_deleted
        )
      `)
      .eq('store_id', storeData.id)
      .eq('is_published', true)
      .eq('review_forms.is_published', true)
      .eq('review_forms.is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (formError || !storeReviewForms || storeReviewForms.length === 0) {
      console.error('No published review form found for store:', formError);
      return {
        success: false,
        error: 'No published review form found for this store'
      };
    }

    const storeReviewForm = storeReviewForms[0];

    console.log('Found review form:', storeReviewForm.review_form_id);

    // The review form is already verified in the join query above, so we can proceed directly

    // Return the review form ID
    return {
      success: true,
      formId: storeReviewForm.review_form_id,
      storeId: storeData.id,
      companyId: storeData.company_id,
      lineMiniAppUrl: storeData.companies?.line_mini_app_url ?? null
    };
  } catch (error) {
    console.error('Error getting store redirect:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get all questions for a review form (all pages)
export const getAllReviewQuestions = async (reviewFormId) => {
  try {
    const { data, error } = await supabase
      .from('review_questions')
      .select(`
        *,
        question_option_choices(*),
        question_option_linear_scale(*)
      `)
      .eq('review_fome_id', reviewFormId)
      .order('pege_number', { ascending: true })
      .order('question_number', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    return [];
  }
};

// Check if user is eligible to answer (cooldown days are looked up per store)
export const checkAnswerEligibility = async (reviewFormId, userId, storeCode = null) => {
  try {
    const { data, error } = await supabase.functions.invoke('check-eligibility', {
      body: { reviewFormId, userId, storeCode: storeCode || undefined }
    });

    if (error) throw error;

    return {
      success: true,
      isEligible: data.isEligible,
      message: data.message,
      cooldownDays: data.cooldownDays
    };
  } catch (error) {
    console.error('Error checking eligibility:', error);
    // エラーの場合は回答可能として扱う（チェックをスキップ）
    return {
      success: true,
      isEligible: true
    };
  }
};