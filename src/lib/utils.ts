import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { DailyRecord } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const weightNewPatient = 1.2;

export function recalculateStaffTotals(
  records: DailyRecord[],
  cmiConfig: Record<string, number>
) {
  let totalCareByDept: Record<string, number> = {};
  let totalCare = 0;
  let totalNew = 0;
  let workdays = 0;

  records.forEach((r) => {
    let dayHasWork = false;
    let dayNew = 0;

    // 計算照護數量
    if (r.careCounts) {
      Object.keys(r.careCounts).forEach(deptId => {
        const count = r.careCounts[deptId] || 0;
        totalCareByDept[deptId] = (totalCareByDept[deptId] || 0) + count;
        totalCare += count;
        if (count > 0) dayHasWork = true;
      });
    }

    // 計算新接人數
    if (r.newPatients) {
      Object.keys(r.newPatients).forEach(deptId => {
        const count = r.newPatients[deptId] || 0;
        dayNew += count;
        if (count > 0) dayHasWork = true;
      });
    }

    // 計算其他新接人數
    const nO = r.newPatientsOther || 0;
    dayNew += nO;
    if (nO > 0) dayHasWork = true;

    totalNew += dayNew;
    if (dayHasWork) workdays++;
  });

  const effectiveWorkdays = workdays > 0 ? workdays : 1;

  let careScoreTotal = 0;
  Object.keys(totalCareByDept).forEach(deptId => {
    const cmi = cmiConfig[deptId] || 1.0; // 如果沒有設定 CMI 預設為 1.0
    careScoreTotal += (totalCareByDept[deptId] / effectiveWorkdays) * cmi;
  });

  const newScoreTotal = (totalNew / effectiveWorkdays) * weightNewPatient;
  const totalScore = careScoreTotal + newScoreTotal;

  let baseValue = 30;
  if (totalScore < 6) baseValue = 10;
  else if (totalScore <= 8) baseValue = 14;
  else if (totalScore <= 10) baseValue = 19;
  else if (totalScore <= 12) baseValue = 25;

  return {
    totalCare,
    totalCareByDept,
    totalNew,
    workdays,
    careScore: careScoreTotal.toFixed(2),
    newScore: newScoreTotal.toFixed(2),
    totalScore: parseFloat(totalScore.toFixed(2)),
    baseValue: baseValue,
  };
}
