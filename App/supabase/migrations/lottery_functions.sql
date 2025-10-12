-- 抽選機能用のデータベース関数を作成

-- 試行回数を増加させる関数
CREATE OR REPLACE FUNCTION increment_lottery_trials(form_id uuid)
RETURNS lottery
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result lottery;
BEGIN
  UPDATE lottery 
  SET 
    current_trials = current_trials + 1,
    updated_at = now()
  WHERE review_form_id = form_id
  RETURNING * INTO result;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lottery record not found for form_id: %', form_id;
  END IF;
  
  RETURN result;
END;
$$;

-- 当選回数を増加させる関数
CREATE OR REPLACE FUNCTION increment_lottery_wins(form_id uuid)
RETURNS lottery
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result lottery;
BEGIN
  UPDATE lottery 
  SET 
    current_wins = current_wins + 1,
    updated_at = now()
  WHERE review_form_id = form_id
  RETURNING * INTO result;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lottery record not found for form_id: %', form_id;
  END IF;
  
  RETURN result;
END;
$$;

-- 月間統計をリセットする関数
CREATE OR REPLACE FUNCTION reset_lottery_monthly_stats(form_id uuid)
RETURNS lottery
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result lottery;
BEGIN
  UPDATE lottery 
  SET 
    current_wins = 0,
    current_trials = 0,
    updated_at = now()
  WHERE review_form_id = form_id
  RETURNING * INTO result;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lottery record not found for form_id: %', form_id;
  END IF;
  
  RETURN result;
END;
$$;

-- 抽選実行用の関数（確率計算と当選判定を含む）
CREATE OR REPLACE FUNCTION execute_lottery_draw(form_id uuid)
RETURNS TABLE (
  won boolean,
  random_value numeric,
  win_rate numeric,
  current_wins bigint,
  current_trials bigint,
  max_wins_per_month bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  lottery_record lottery;
  random_val numeric;
  calculated_win_rate numeric;
  is_winner boolean;
BEGIN
  -- 抽選設定を取得
  SELECT * INTO lottery_record
  FROM lottery 
  WHERE review_form_id = form_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lottery record not found for form_id: %', form_id;
  END IF;
  
  -- 月間当選上限チェック
  IF lottery_record.current_wins >= lottery_record.max_wins_per_month THEN
    RAISE EXCEPTION 'Monthly win limit reached: % / %', 
      lottery_record.current_wins, lottery_record.max_wins_per_month;
  END IF;
  
  -- 確率計算
  calculated_win_rate := 1.0 / lottery_record.win_rate_divisor;
  
  -- 乱数生成
  random_val := random();
  
  -- 当選判定
  is_winner := random_val < calculated_win_rate;
  
  -- 試行回数を増加
  UPDATE lottery 
  SET current_trials = current_trials + 1
  WHERE review_form_id = form_id;
  
  -- 当選の場合は当選回数も増加
  IF is_winner THEN
    UPDATE lottery 
    SET current_wins = current_wins + 1
    WHERE review_form_id = form_id;
  END IF;
  
  -- 更新後のデータを取得
  SELECT * INTO lottery_record
  FROM lottery 
  WHERE review_form_id = form_id;
  
  -- 結果を返す
  RETURN QUERY SELECT 
    is_winner,
    random_val,
    calculated_win_rate,
    lottery_record.current_wins,
    lottery_record.current_trials,
    lottery_record.max_wins_per_month;
END;
$$;