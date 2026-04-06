-- 給 Supabase SQL Editor 使用的建立資料表語法 (V2 支持多組別動態儲存)

-- 由於先前已經建立過 staff 人員表，且您提到「人員先維持一樣，後續再自己新增」，
-- 因此這裡我們保留舊的 `staff` 表不需要動。

-- 1. 建立全新支援動態欄位的指標表 daily_metrics_v2
CREATE TABLE daily_metrics_v2 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id BIGINT REFERENCES staff(id) ON DELETE CASCADE,
  group_id TEXT NOT NULL,         -- 標記是哪一個組的資料，例如 '1' 代表神復組，'3.1' 代表洗腎室
  record_date DATE NOT NULL,
  month_str TEXT NOT NULL,        -- 例如 '2026-04'
  care_counts JSONB DEFAULT '{}'::jsonb,    -- 動態儲存照護人數，例如 {"心臟科": 1, "腎臟科": 0}
  new_patients JSONB DEFAULT '{}'::jsonb,   -- 動態儲存新接人數，例如 {"心臟科": 2, "腎臟科": 1}
  new_others INTEGER DEFAULT 0,             -- 單獨保存「其他」人數
  new_beds TEXT[] DEFAULT '{}',             -- 新接病歷號陣列
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(staff_id, group_id, record_date)   -- 確保同一個人、同一個組、甚至同一天只有一筆獨立紀錄
);

-- 2. 設定權限 (RLS) - 針對這個單純內部的專案，允許所有匿名直接讀寫
ALTER TABLE daily_metrics_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read and write on daily_metrics_v2"
ON daily_metrics_v2 FOR ALL USING (true) WITH CHECK (true);
