import { useState, useEffect } from 'react';
import { findHolidayOpportunities, getDefaultHolidays, isWeekend, isHoliday } from './services/holidayService';
import Calendar from './components/Calendar';

// Helper to get data from localStorage
const getFromStorage = (key, defaultValue, isDateArray = false) => {
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (isDateArray) return parsed.map(d => new Date(d));
      // For objects, merge with default to ensure all keys exist
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) && defaultValue) {
        return { ...defaultValue, ...parsed };
      }
      return parsed;
    } catch (e) { return defaultValue; }
  }
  return defaultValue;
};

const defaultColors = {
  holidayBlock: '#e0e0ff',
  takenLeave: '#cce5ff',
  requiredHoliday: '#fce8e6',
  publicHoliday: '#f8d7da',
  optionalHoliday: '#fff3cd',
  weekend: '#f8f9fa',
};

const storageKeys = ['year', 'casualLeaves', 'publicHolidays', 'optionalHolidays', 'requiredHolidays', 'numOptionalToTake', 'workingDaysPerEarnedLeave', 'maxBridgeCost', 'colors'];

function App() {
  const [year, setYear] = useState(() => getFromStorage('year', new Date().getFullYear()));
  const [casualLeaves, setCasualLeaves] = useState(() => getFromStorage('casualLeaves', 8));
  const [publicHolidays, setPublicHolidays] = useState(() => getFromStorage('publicHolidays', [], true));
  const [optionalHolidays, setOptionalHolidays] = useState(() => getFromStorage('optionalHolidays', [], true));
  const [requiredHolidays, setRequiredHolidays] = useState(() => getFromStorage('requiredHolidays', [], true));
  const [numOptionalToTake, setNumOptionalToTake] = useState(() => getFromStorage('numOptionalToTake', 0));
  const [workingDaysPerEarnedLeave, setWorkingDaysPerEarnedLeave] = useState(() => getFromStorage('workingDaysPerEarnedLeave', 23));
  const [maxBridgeCost, setMaxBridgeCost] = useState(() => getFromStorage('maxBridgeCost', 4));
  const [colors, setColors] = useState(() => getFromStorage('colors', defaultColors));

  const [opportunities, setOpportunities] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [selectionMode, setSelectionMode] = useState(null);
  const [selectedOpportunityIndexes, setSelectedOpportunityIndexes] = useState([]);

  // Effects to save state to localStorage
  storageKeys.forEach(key => {
    const value = eval(key);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => { localStorage.setItem(key, JSON.stringify(value)); }, [value, key]);
  });
  
  useEffect(() => {
    if (localStorage.getItem('publicHolidays') === null) {
      setPublicHolidays(getDefaultHolidays(year).map(h => h.date));
    }
  }, [year]);

  const handleDateClick = (date) => {
    const updateDates = (currentDates, setDates) => {
      const existingIndex = currentDates.findIndex(d => d.toDateString() === date.toDateString());
      if (existingIndex > -1) setDates(currentDates.filter((_, i) => i !== existingIndex));
      else setDates([...currentDates, date].sort((a, b) => a - b));
    };
    if (selectionMode === 'holiday') updateDates(publicHolidays, setPublicHolidays);
    if (selectionMode === 'optional') updateDates(optionalHolidays, setOptionalHolidays);
    if (selectionMode === 'required') updateDates(requiredHolidays, setRequiredHolidays);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const ops = findHolidayOpportunities(year, publicHolidays, optionalHolidays, requiredHolidays, maxBridgeCost);
    setOpportunities(ops);
    setSelectedOpportunityIndexes([]);
    setSubmitted(true);
    setSelectionMode(null);
  };

  const handleReset = () => {
    storageKeys.forEach(key => localStorage.removeItem(key));
    window.location.reload();
  };

  const handleOpportunitySelect = (index) => {
    const isSelected = selectedOpportunityIndexes.includes(index);
    if (isSelected) setSelectedOpportunityIndexes(selectedOpportunityIndexes.filter(i => i !== index));
    else setSelectedOpportunityIndexes([...selectedOpportunityIndexes, index]);
  };

  const getYearDays = (year) => {
    const days = []; const d = new Date(year, 0, 1);
    while (d.getFullYear() === year) { days.push(new Date(d)); d.setDate(d.getDate() + 1); }
    return days;
  };

  const getLeaveBalances = () => {
    const chosenBridgeAndOptionalLeaves = selectedOpportunityIndexes.flatMap(index => opportunities[index].dates);
    const requiredLeaveDays = requiredHolidays.filter(d => !isWeekend(d));
    const allTakenForAccrual = [...publicHolidays, ...requiredHolidays, ...chosenBridgeAndOptionalLeaves];
    const workingDaysForAccrual = getYearDays(year).filter(d => !isWeekend(d) && !isHoliday(d, allTakenForAccrual));
    const totalEarnedLeaves = Math.floor(workingDaysForAccrual.length / (parseInt(workingDaysPerEarnedLeave, 10) || 23));

    let remainingCasual = parseInt(casualLeaves, 10) - requiredLeaveDays.length;
    let remainingEarned = totalEarnedLeaves;
    let remainingOptional = parseInt(numOptionalToTake, 10);

    selectedOpportunityIndexes.forEach(index => {
      const op = opportunities[index];
      if (op.type === 'optional') remainingOptional -= op.cost;
      else {
        const cost = op.cost;
        const usedCasual = Math.min(remainingCasual, cost);
        remainingCasual -= usedCasual;
        remainingEarned -= (cost - usedCasual);
      }
    });
    const allTakenLeaves = [...requiredHolidays, ...chosenBridgeAndOptionalLeaves];
    return { remainingCasual, remainingEarned, remainingOptional, totalEarnedLeaves, allTakenLeaves };
  };

  const groupOpportunitiesByMonth = (opportunities) => {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const grouped = {};
    opportunities.forEach((op, index) => {
      const month = monthNames[op.dates[0].getMonth()];
      if (!grouped[month]) grouped[month] = [];
      grouped[month].push({ ...op, originalIndex: index });
    });
    const sortedGrouped = {};
    monthNames.forEach(m => { if (grouped[m]) sortedGrouped[m] = grouped[m]; });
    return sortedGrouped;
  };

  const { remainingCasual, remainingEarned, remainingOptional, totalEarnedLeaves, allTakenLeaves } = getLeaveBalances();
  const highlightedBlockDays = selectedOpportunityIndexes.flatMap(index => opportunities[index].allDates);

  return (
    <div className="container my-5">
      <h1 className="text-center mb-4">Maximize Holidays</h1>
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card p-4 mb-4">
            <form onSubmit={handleSubmit}>
              <div className="row g-3 align-items-end">
                <div className="col-lg-3 col-md-6"><label htmlFor="casual-leaves" className="form-label">Casual Leaves:</label><input id="casual-leaves" type="number" className="form-control" value={casualLeaves} onChange={(e) => setCasualLeaves(e.target.value)} /></div>
                <div className="col-lg-3 col-md-6"><label htmlFor="working-days" className="form-label">Days / Earned Leave:</label><input id="working-days" type="number" className="form-control" value={workingDaysPerEarnedLeave} onChange={(e) => setWorkingDaysPerEarnedLeave(e.target.value)} /></div>
                <div className="col-lg-3 col-md-6"><label htmlFor="num-optional" className="form-label">Optional Leaves to Take:</label><input id="num-optional" type="number" className="form-control" value={numOptionalToTake} onChange={(e) => setNumOptionalToTake(e.target.value)} /></div>
                <div className="col-lg-3 col-md-6"><label htmlFor="max-bridge" className="form-label">Max Bridge Length:</label><input id="max-bridge" type="number" className="form-control" value={maxBridgeCost} onChange={(e) => setMaxBridgeCost(e.target.value)} /></div>
                <div className="col-lg-3 col-md-6"><label htmlFor="year" className="form-label">Year:</label><input id="year" type="number" className="form-control" value={year} onChange={(e) => setYear(e.target.value)} /></div>
                <div className="col-lg-3 col-md-6"><label className="form-label">Total Earned (dynamic):</label><input type="number" className="form-control" value={totalEarnedLeaves} disabled readOnly /></div>
              </div>
              <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-3">
                <button type="button" className="btn btn-secondary" onClick={handleReset}>Reset</button>
                <button type="submit" className="btn btn-primary">Find Opportunities</button>
              </div>
            </form>
            <div className="form-text text-center mt-2">Note: Saturday and Sunday are considered weekends.</div>
          </div>

          {submitted && (
            <div className="card p-4 mb-4">
              <h3>Holiday Opportunities</h3>
              <div className="d-flex gap-3 mb-3 p-2 bg-light border rounded flex-wrap">
                <span className="text-nowrap"><strong>Remaining:</strong></span>
                <span className="text-nowrap">Casual: {remainingCasual}</span>
                <span className="text-nowrap">Earned: {remainingEarned}</span>
                <span className="text-nowrap">Optional: {remainingOptional}</span>
              </div>
              {opportunities.length > 0 ? (
                <div className="accordion" id="opportunitiesAccordion">{Object.entries(groupOpportunitiesByMonth(opportunities)).map(([month, ops]) => (
                    <div className="accordion-item" key={month}>
                      <h2 className="accordion-header"><button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target={`#collapse${month}`}>{month} ({ops.length} {ops.length > 1 ? 'opportunities' : 'opportunity'})</button></h2>
                      <div id={`collapse${month}`} className="accordion-collapse collapse"><div className="accordion-body p-0"><ul className="list-group">
                        {ops.map((op) => {
                          const isSelected = selectedOpportunityIndexes.includes(op.originalIndex);
                          const canAfford = op.type === 'optional' ? remainingOptional >= op.cost : (remainingCasual + remainingEarned) >= op.cost;
                          const isDisabled = !isSelected && !canAfford;
                          return (
                            <li className={`list-group-item d-flex justify-content-between align-items-center ${isSelected ? 'list-group-item-success' : ''}`} key={op.originalIndex}>
                              <div>Take <strong>{op.cost}</strong> day(s) off ({op.dates.map(d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })).join(', ')}) to get a <strong>{op.gain}</strong>-day holiday. {op.type === 'optional' && <span className="badge bg-warning ms-2">Uses Optional Holiday</span>}</div>
                              <button className={`btn btn-sm ${isSelected ? 'btn-outline-danger' : 'btn-primary'}`} onClick={() => handleOpportunitySelect(op.originalIndex)} disabled={isDisabled}>{isSelected ? 'Remove' : 'Select'}</button>
                            </li>);
                        })}
                      </ul></div></div>
                    </div>))}
                </div>
              ) : (<p>No special opportunities found.</p>)}
            </div>
          )}
          
          <div className="card p-4 mb-4">
            <div className="btn-group mb-3">
              <button className={`btn ${selectionMode === 'required' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setSelectionMode(selectionMode === 'required' ? null : 'required')}>Select Required</button>
              <button className={`btn ${selectionMode === 'holiday' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setSelectionMode(selectionMode === 'holiday' ? null : 'holiday')}>Edit Public</button>
              <button className={`btn ${selectionMode === 'optional' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setSelectionMode(selectionMode === 'optional' ? null : 'optional')}>Select Optional</button>
            </div>
            {selectionMode && <p className="alert alert-info">You are in '{selectionMode}' selection mode.</p>}
            <div className="row">
              <div className="col-md-4"> {requiredHolidays.length > 0 && (<div><h6>Required:</h6><div>{requiredHolidays.map(d => (<span key={d.toISOString()} className="badge bg-secondary me-1">{d.toLocaleDateString()}</span>))}</div></div>)} </div>
              <div className="col-md-4"> {publicHolidays.length > 0 && (<div><h6>Public:</h6><div>{publicHolidays.map(d => (<span key={d.toISOString()} className="badge bg-danger me-1">{d.toLocaleDateString()}</span>))}</div></div>)} </div>
              <div className="col-md-4"> {optionalHolidays.length > 0 && (<div><h6>Optional:</h6><div>{optionalHolidays.map(d => (<span key={d.toISOString()} className="badge bg-warning me-1">{d.toLocaleDateString()}</span>))}</div></div>)} </div>
            </div>
          </div>

           <div className="card p-4 mb-4">
             <h5 className="card-title">Color Settings</h5>
            <div className="row">
              {Object.entries(colors).map(([key, value]) => (
                <div className="col-md-4 mb-2" key={key}>
                  <label htmlFor={`color-${key}`} className="form-label text-capitalize">{key.replace(/([A-Z])/g, ' $1')}:</label>
                  <input type="color" id={`color-${key}`} className="form-control form-control-color" value={value} onChange={(e) => setColors({...colors, [key]: e.target.value})} />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <Calendar year={year} requiredHolidays={requiredHolidays} publicHolidays={publicHolidays} optionalHolidays={optionalHolidays} takenLeaves={allTakenLeaves} highlightedDays={highlightedBlockDays} onDateClick={handleDateClick} selectionMode={selectionMode} colors={colors} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;