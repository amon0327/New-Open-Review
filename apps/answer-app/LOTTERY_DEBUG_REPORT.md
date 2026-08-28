# Lottery System Debug Report

## Problem Summary
The lottery system with 1/1 probability (always win) is not working as expected because **there are no lottery records in the database**.

## Current Database State

### ✅ Tables Exist
- `lottery` table exists
- `lottery_log` table exists  
- `lottery_winners` table exists

### ❌ Missing Data
- **No lottery records exist** for any review forms
- This is the root cause of the lottery not working

### 📋 Available Review Forms
Found 4 published review forms that need lottery configuration:
1. **本番フォーム** (ID: `c0033553-ec3a-4709-a6aa-efecf8bf7c0e`)
2. **トラットリアアズーリ** (ID: `79484234-a8db-454e-8e49-e32961ae623e`)
3. **新規レビューフォーム** (ID: `b56f61fb-4840-4710-9f0b-0b73b22959b5`)
4. **新規レビューフォーム** (ID: `2c92cfca-5dfe-42c3-8bb9-8558ea8a7f01`)

## How the Lottery System Works

### Edge Function Flow (`/supabase/functions/lottery/index.ts`)
1. **Eligibility Check**: User must not have answered within last 5 days
2. **Answer Saving**: Saves review form answers to database
3. **Lottery Logic**: 
   - Queries `lottery` table for review form configuration
   - **FAILS HERE** - No lottery record exists, causing error
   - If record existed: checks current month wins vs max allowed
   - Generates random number 1 to `win_rate_divisor`
   - User wins if random number equals 1
4. **Winner Recording**: Creates `lottery_log` and `lottery_winners` records

### Expected Lottery Configuration for 1/1 Probability
```sql
win_rate_divisor = 1        -- 1/1 = 100% win rate (always win)
max_wins_per_month = 1000   -- High limit so it doesn't block wins
current_wins = 0            -- Current wins this month
current_trials = 0          -- Current trials this month
```

## Solutions

### Option 1: Run SQL Commands in Supabase Dashboard ⭐ **RECOMMENDED**

Copy and paste the following SQL into the Supabase SQL Editor:

```sql
-- Insert lottery records for all published review forms with 1/1 probability (always win)
INSERT INTO lottery (review_form_id, win_rate_divisor, max_wins_per_month, current_wins, current_trials)
SELECT 
    id as review_form_id,
    1 as win_rate_divisor,        -- 1/1 = 100% win rate (always win)
    1000 as max_wins_per_month,   -- High limit so it doesn't block wins
    0 as current_wins,            -- Reset current wins
    0 as current_trials           -- Reset current trials
FROM review_forms 
WHERE is_deleted = false 
  AND is_published = true
  AND id NOT IN (SELECT review_form_id FROM lottery)  -- Only insert if not already exists
;

-- Verify the lottery records were created
SELECT 
    l.id,
    rf.title,
    l.win_rate_divisor,
    ROUND(100.0 / l.win_rate_divisor, 2) as win_percentage,
    l.max_wins_per_month,
    l.current_wins,
    l.current_trials,
    CASE 
        WHEN l.win_rate_divisor = 1 THEN 'ALWAYS WIN (100%)'
        ELSE CONCAT('1 in ', l.win_rate_divisor, ' chance')
    END as lottery_description
FROM lottery l
JOIN review_forms rf ON l.review_form_id = rf.id
ORDER BY rf.title;
```

### Option 2: Manual Record Creation

If you prefer to create records individually, run this for each form:

```sql
-- Example for one form (replace the UUID with actual form ID)
INSERT INTO lottery (review_form_id, win_rate_divisor, max_wins_per_month, current_wins, current_trials)
VALUES (
    'c0033553-ec3a-4709-a6aa-efecf8bf7c0e',  -- Replace with actual form ID
    1,        -- Always win
    1000,     -- High monthly limit
    0,        -- Current wins
    0         -- Current trials
);
```

### Option 3: Fix RLS Policy (Advanced)

The automatic script failed due to Row Level Security. To fix:

1. **Temporarily disable RLS** on lottery table:
   ```sql
   ALTER TABLE lottery DISABLE ROW LEVEL SECURITY;
   ```

2. **Run the setup script**:
   ```bash
   node setup_lottery_data.js
   ```

3. **Re-enable RLS**:
   ```sql
   ALTER TABLE lottery ENABLE ROW LEVEL SECURITY;
   ```

## Verification Steps

After implementing the solution, verify it worked:

1. **Check lottery records exist**:
   ```bash
   node check_lottery_data.js
   ```

2. **Test the lottery system** by submitting a form answer

3. **Expected result**: User should always win (see winner page instead of completion page)

## Key Files

- **Lottery Edge Function**: `/supabase/functions/lottery/index.ts`
- **Setup SQL Script**: `/lottery_setup.sql`
- **Debug Scripts**: 
  - `/check_lottery_data.js` - Check current state
  - `/setup_lottery_data.js` - Attempt automatic setup (blocked by RLS)

## Database Tables Structure

### `lottery` table
- `id`: Primary key
- `review_form_id`: Foreign key to review_forms table
- `win_rate_divisor`: 1 = always win, 2 = 50%, 10 = 10%, etc.
- `max_wins_per_month`: Maximum wins allowed per month
- `current_wins`: Current wins this month  
- `current_trials`: Current trials this month

### `lottery_log` table
- Records every lottery attempt (eligible submissions)
- Used for 5-day cooldown check

### `lottery_winners` table  
- Records actual winners
- Links to lottery_log entries
- Tracks if prize was received

## Next Steps

1. ✅ **Run the SQL commands above** in Supabase dashboard
2. ✅ **Verify lottery records were created** using the debug script
3. ✅ **Test the lottery** by submitting a form
4. ✅ **Confirm always-win behavior** is working

The lottery system should work perfectly once the missing lottery records are created with `win_rate_divisor = 1`.