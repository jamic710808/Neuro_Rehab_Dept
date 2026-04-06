import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const weightNewPatient = 1.2;

export function recalculateStaffTotals(
  records: any[],
  currentCmiNeuro: number,
  currentCmiRehab: number
) {
  let totalCareNeuro = 0,
    totalCareRehab = 0;
  let totalNew = 0,
    workdays = 0;

  records.forEach((r) => {
    const cN = parseInt(r.careCountNeuro) || 0;
    const cR = parseInt(r.careCountRehab) || 0;
    const nN = parseInt(r.newPatientsNeuro) || 0;
    const nR = parseInt(r.newPatientsRehab) || 0;
    const nO = parseInt(r.newPatientsOther) || 0;

    totalCareNeuro += cN;
    totalCareRehab += cR;
    totalNew += nN + nR + nO;

    if (cN > 0 || cR > 0 || nN > 0 || nR > 0 || nO > 0) workdays++;
  });

  const effectiveWorkdays = workdays > 0 ? workdays : 1;
  const careScoreTotal =
    (totalCareNeuro / effectiveWorkdays) * currentCmiNeuro +
    (totalCareRehab / effectiveWorkdays) * currentCmiRehab;
  const newScoreTotal = (totalNew / effectiveWorkdays) * weightNewPatient;
  const totalScore = careScoreTotal + newScoreTotal;

  let baseValue = 30;
  if (totalScore < 6) baseValue = 10;
  else if (totalScore <= 8) baseValue = 14;
  else if (totalScore <= 10) baseValue = 19;
  else if (totalScore <= 12) baseValue = 25;

  return {
    totalCare: totalCareNeuro + totalCareRehab,
    totalCareNeuro,
    totalCareRehab,
    totalNew,
    workdays,
    careScore: careScoreTotal.toFixed(2),
    newScore: newScoreTotal.toFixed(2),
    totalScore: parseFloat(totalScore.toFixed(2)),
    baseValue: baseValue,
  };
}

export function generateDatabaseTemplate(
  year: number,
  month: number,
  staffList: { id: number; name: string }[],
  currentCmiNeuro: number,
  currentCmiRehab: number
) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const isMockMonth = year === 2026 && month === 1;

  return staffList.map((staff) => {
    let records = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayOfWeek = new Date(year, month - 1, d).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      let careCountNeuro = 0,
        careCountRehab = 0;
      let newPatientsNeuro = 0,
        newPatientsRehab = 0,
        newPatientsOther = 0;
      let newBeds: string[] = [];

      if (isMockMonth) {
        careCountNeuro = isWeekend
          ? Math.floor(Math.random() * 2)
          : Math.floor(Math.random() * 5) + 2;
        careCountRehab = isWeekend
          ? Math.floor(Math.random() * 2)
          : Math.floor(Math.random() * 4) + 1;

        newPatientsNeuro = Math.floor(Math.random() * 2);
        newPatientsRehab = Math.floor(Math.random() * 2);
        newPatientsOther = Math.floor(Math.random() * 1);

        let totalNew = newPatientsNeuro + newPatientsRehab + newPatientsOther;
        for (let i = 0; i < totalNew; i++) {
          const wards = ["5A", "6B", "7C"];
          newBeds.push(
            `${wards[Math.floor(Math.random() * wards.length)]}-${
              Math.floor(Math.random() * 20) + 1
            }`
          );
        }
      }

      records.push({
        date: `${month.toString().padStart(2, "0")}/${d
          .toString()
          .padStart(2, "0")}`,
        day: d,
        dayOfWeek,
        careCountNeuro,
        careCountRehab,
        newPatientsNeuro,
        newPatientsRehab,
        newPatientsOther,
        newBeds,
      });
    }
    return {
      id: staff.id,
      name: staff.name,
      records: records,
      ...recalculateStaffTotals(records, currentCmiNeuro, currentCmiRehab),
    };
  });
}
