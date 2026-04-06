-- 1. 給 staff 表新增 group_id 欄位
ALTER TABLE staff ADD COLUMN IF NOT EXISTS group_id TEXT;

-- 2. 若有舊的無組別資料，先全部分配到第 1 組 (神復組)
UPDATE staff SET group_id = '1' WHERE group_id IS NULL;

-- 3. 將目前第 1 組 (神復組) 的非刪除名單，複製給所有的其他 9 個組別作為初始員工盤底
DO $$
DECLARE
  base_staff RECORD;
  target_group TEXT;
  groups_array TEXT[] := ARRAY['2', '3', '3.1', '4', '5', '6', '7', '8', '9'];
BEGIN
  FOR base_staff IN SELECT name, is_active FROM staff WHERE group_id = '1' AND is_active = true LOOP
    FOREACH target_group IN ARRAY groups_array LOOP
      INSERT INTO staff (name, is_active, group_id)
      VALUES (base_staff.name, base_staff.is_active, target_group);
    END LOOP;
  END LOOP;
END $$;

-- 4. 重新確認 RLS 原則是開放讀寫的
DROP POLICY IF EXISTS "Allow public read and write on staff" ON staff;
CREATE POLICY "Allow public read and write on staff"
ON staff FOR ALL USING (true) WITH CHECK (true);
