-- ½x_ý(nÇü¿Ùü¹¢p’\

-- fLÞp’— U[‹¢p
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

-- SxÞp’— U[‹¢p
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

-- “q’ê»ÃÈY‹¢p
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

-- ½xŸL(n¢pº‡—hSx$š’+€	
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
  -- ½x-š’Ö—
  SELECT * INTO lottery_record
  FROM lottery 
  WHERE review_form_id = form_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lottery record not found for form_id: %', form_id;
  END IF;
  
  -- “Sx
PÁ§Ã¯
  IF lottery_record.current_wins >= lottery_record.max_wins_per_month THEN
    RAISE EXCEPTION 'Monthly win limit reached: % / %', 
      lottery_record.current_wins, lottery_record.max_wins_per_month;
  END IF;
  
  -- º‡—
  calculated_win_rate := 1.0 / lottery_record.win_rate_divisor;
  
  -- qp
  random_val := random();
  
  -- Sx$š
  is_winner := random_val < calculated_win_rate;
  
  -- fLÞp’— 
  UPDATE lottery 
  SET current_trials = current_trials + 1
  WHERE review_form_id = form_id;
  
  -- Sxn4oSxÞp‚— 
  IF is_winner THEN
    UPDATE lottery 
    SET current_wins = current_wins + 1
    WHERE review_form_id = form_id;
  END IF;
  
  -- ô°ŒnÇü¿’Ö—
  SELECT * INTO lottery_record
  FROM lottery 
  WHERE review_form_id = form_id;
  
  -- Pœ’ÔY
  RETURN QUERY SELECT 
    is_winner,
    random_val,
    calculated_win_rate,
    lottery_record.current_wins,
    lottery_record.current_trials,
    lottery_record.max_wins_per_month;
END;
$$;