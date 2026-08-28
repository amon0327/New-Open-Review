-- テスト用シフトデータを作成
-- 複数の日付にシフトデータを追加

-- 今日の日付を取得して複数日分のシフトデータを作成
INSERT INTO shift (id, work_date, staff_name, start_time, end_time, store_id, created_at)
VALUES 
  -- 今日のシフト
  (gen_random_uuid(), CURRENT_DATE, '佐藤太郎', '09:00:00', '17:00:00', 'test-store-1234-1234-1234-123456789012', NOW()),
  (gen_random_uuid(), CURRENT_DATE, '田中花子', '10:00:00', '18:00:00', 'test-store-1234-1234-1234-123456789012', NOW()),
  (gen_random_uuid(), CURRENT_DATE, '山田次郎', '11:00:00', '19:00:00', 'test-store-1234-1234-1234-123456789012', NOW()),
  
  -- 昨日のシフト
  (gen_random_uuid(), CURRENT_DATE - INTERVAL '1 day', '鈴木一郎', '08:30:00', '16:30:00', 'test-store-1234-1234-1234-123456789012', NOW()),
  (gen_random_uuid(), CURRENT_DATE - INTERVAL '1 day', '高橋美咲', '09:30:00', '17:30:00', 'test-store-1234-1234-1234-123456789012', NOW()),
  (gen_random_uuid(), CURRENT_DATE - INTERVAL '1 day', '渡辺健', '12:00:00', '20:00:00', 'test-store-1234-1234-1234-123456789012', NOW()),
  (gen_random_uuid(), CURRENT_DATE - INTERVAL '1 day', '小林さくら', '13:00:00', '21:00:00', 'test-store-1234-1234-1234-123456789012', NOW()),
  
  -- 一昨日のシフト
  (gen_random_uuid(), CURRENT_DATE - INTERVAL '2 days', '中村大輔', '07:00:00', '15:00:00', 'test-store-1234-1234-1234-123456789012', NOW()),
  (gen_random_uuid(), CURRENT_DATE - INTERVAL '2 days', '加藤優子', '14:00:00', '22:00:00', 'test-store-1234-1234-1234-123456789012', NOW()),
  (gen_random_uuid(), CURRENT_DATE - INTERVAL '2 days', '伊藤大樹', '16:00:00', '24:00:00', 'test-store-1234-1234-1234-123456789012', NOW()),
  
  -- 3日前のシフト
  (gen_random_uuid(), CURRENT_DATE - INTERVAL '3 days', '吉田真理', '06:00:00', '14:00:00', 'test-store-1234-1234-1234-123456789012', NOW()),
  (gen_random_uuid(), CURRENT_DATE - INTERVAL '3 days', '松本修', '15:00:00', '23:00:00', 'test-store-1234-1234-1234-123456789012', NOW()),
  (gen_random_uuid(), CURRENT_DATE - INTERVAL '3 days', '岡田彩', '18:00:00', '02:00:00', 'test-store-1234-1234-1234-123456789012', NOW()),
  
  -- 4日前のシフト
  (gen_random_uuid(), CURRENT_DATE - INTERVAL '4 days', '森川拓也', '09:00:00', '17:00:00', 'test-store-1234-1234-1234-123456789012', NOW()),
  (gen_random_uuid(), CURRENT_DATE - INTERVAL '4 days', '清水恵', '10:30:00', '18:30:00', 'test-store-1234-1234-1234-123456789012', NOW()),
  (gen_random_uuid(), CURRENT_DATE - INTERVAL '4 days', '石川亮', '12:30:00', '20:30:00', 'test-store-1234-1234-1234-123456789012', NOW()),
  (gen_random_uuid(), CURRENT_DATE - INTERVAL '4 days', '斎藤里奈', '14:30:00', '22:30:00', 'test-store-1234-1234-1234-123456789012', NOW()),
  
  -- 5日前のシフト
  (gen_random_uuid(), CURRENT_DATE - INTERVAL '5 days', '藤井俊介', '08:00:00', '16:00:00', 'test-store-1234-1234-1234-123456789012', NOW()),
  (gen_random_uuid(), CURRENT_DATE - INTERVAL '5 days', '木村香織', '11:00:00', '19:00:00', 'test-store-1234-1234-1234-123456789012', NOW()),
  (gen_random_uuid(), CURRENT_DATE - INTERVAL '5 days', '原田光', '13:00:00', '21:00:00', 'test-store-1234-1234-1234-123456789012', NOW()),
  
  -- 6日前のシフト
  (gen_random_uuid(), CURRENT_DATE - INTERVAL '6 days', '池田智子', '07:30:00', '15:30:00', 'test-store-1234-1234-1234-123456789012', NOW()),
  (gen_random_uuid(), CURRENT_DATE - INTERVAL '6 days', '橋本誠', '16:00:00', '24:00:00', 'test-store-1234-1234-1234-123456789012', NOW())

ON CONFLICT (id) DO NOTHING;

-- 作成されたデータを確認
SELECT 'Test shift data created successfully!' as result;

SELECT 
  work_date,
  COUNT(*) as staff_count,
  STRING_AGG(staff_name, ', ') as staff_names
FROM shift 
WHERE store_id = 'test-store-1234-1234-1234-123456789012'
  AND work_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY work_date
ORDER BY work_date DESC;

-- 店舗IDの確認
SELECT 'Available store IDs:' as info;
SELECT DISTINCT store_id FROM shift LIMIT 10;