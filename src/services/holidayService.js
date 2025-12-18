// Mock data for public holidays in India for 2024
const defaultHolidayData = [
  { date: '2024-01-26', name: 'Republic Day' },
  { date: '2024-03-25', name: 'Holi' },
  // ... (rest of the default holidays)
];

export const getDefaultHolidays = (year) => {
  if (year === 2024) {
    return defaultHolidayData.map(holiday => ({ ...holiday, date: new Date(holiday.date) }));
  }
  return [];
};

export const isWeekend = (date) => date.getDay() === 0 || date.getDay() === 6;

export const isHoliday = (date, dateArray) => dateArray.some(d => d.toDateString() === date.toDateString());

const getYearDays = (year) => {
  const days = [];
  const d = new Date(year, 0, 1);
  while (d.getFullYear() === year) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
};

export const findHolidayOpportunities = (year, publicHolidays, optionalHolidays, requiredHolidays, maxBridgeCost = 4) => {
  const yearDays = getYearDays(year);
  const opportunities = [];

  // Define all fixed non-working days
  const nonWorkingDays = yearDays.filter(d => isWeekend(d) || isHoliday(d, publicHolidays) || isHoliday(d, requiredHolidays));

  // 1. Find bridge opportunities
  const blocks = [];
  if (yearDays.length > 0) {
    let currentBlock = { isNonWorking: isHoliday(yearDays[0], nonWorkingDays), days: [yearDays[0]] };
    for (let i = 1; i < yearDays.length; i++) {
      const day = yearDays[i];
      const isNonWorking = isHoliday(day, nonWorkingDays);
      if (isNonWorking === currentBlock.isNonWorking) {
        currentBlock.days.push(day);
      } else {
        blocks.push(currentBlock);
        currentBlock = { isNonWorking, days: [day] };
      }
    }
    blocks.push(currentBlock);
  }

  blocks.forEach((block, index) => {
    if (!block.isNonWorking) {
      const prevBlock = index > 0 ? blocks[index - 1] : null;
      const nextBlock = index < blocks.length - 1 ? blocks[index + 1] : null;

      const isAdjacentToPrev = prevBlock && prevBlock.isNonWorking;
      const isAdjacentToNext = nextBlock && nextBlock.isNonWorking;

      if (isAdjacentToPrev || isAdjacentToNext) {
        const cost = block.days.length;
        if (cost <= maxBridgeCost) {
          let gain = cost;
          let allDates = [...block.days];
          if (isAdjacentToPrev) {
            gain += prevBlock.days.length;
            allDates = [...prevBlock.days, ...allDates];
          }
          if (isAdjacentToNext) {
            gain += nextBlock.days.length;
            allDates = [...allDates, ...nextBlock.days];
          }
          
          opportunities.push({
            dates: block.days,
            cost,
            gain,
            type: 'bridge',
            allDates,
          });
        }
      }
    }
  });

  // 2. Find optional holiday opportunities
  optionalHolidays
    .filter(d => !isHoliday(d, nonWorkingDays)) // Must be a working day
    .forEach(d => {
      const allDates = [d];
      let prevDay = new Date(d);
      prevDay.setDate(prevDay.getDate() - 1);
      while (isHoliday(prevDay, nonWorkingDays)) {
        allDates.unshift(new Date(prevDay));
        prevDay.setDate(prevDay.getDate() - 1);
      }
      let nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);
      while (isHoliday(nextDay, nonWorkingDays)) {
        allDates.push(new Date(nextDay));
        nextDay.setDate(nextDay.getDate() + 1);
      }
      
      const gain = allDates.length;
      if (gain > 1) {
        opportunities.push({
          dates: [d],
          cost: 1,
          gain,
          type: 'optional',
          allDates,
        });
      }
    });

  // 3. Sort all opportunities by gain
  opportunities.sort((a, b) => b.gain - a.gain || a.cost - b.cost);

  return opportunities;
};
