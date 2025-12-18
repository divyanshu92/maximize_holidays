import { isWeekend, isHoliday } from '../services/holidayService';

const Calendar = ({ 
  year, 
  takenLeaves = [], 
  publicHolidays = [], 
  optionalHolidays = [],
  requiredHolidays = [],
  highlightedDays = [],
  onDateClick, 
  selectionMode,
  colors
}) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDayStyle = (date) => {
    let style = {};

    if (isHoliday(date, highlightedDays)) {
      style.backgroundColor = colors.holidayBlock;
    }

    // Specific day types override the general block color
    if (isHoliday(date, requiredHolidays)) {
      style.backgroundColor = colors.requiredHoliday;
    } 
    if (isHoliday(date, publicHolidays)) {
      style.backgroundColor = colors.publicHoliday;
    } 
    if (isHoliday(date, optionalHolidays)) {
      style.backgroundColor = colors.optionalHoliday;
    } 
    if (isWeekend(date) && !style.backgroundColor) { // Only apply if no other holiday color is set
        style.backgroundColor = colors.weekend;
    }
    if (isHoliday(date, takenLeaves)) { 
      style.backgroundColor = colors.takenLeave;
    }

    return style;
  };

  const handleDayClick = (date) => {
    if (selectionMode) {
      onDateClick(date);
    }
  };

  const renderMonth = (month) => {
    const startDate = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let currentDay = 1;
    let weeks = [];
    while (currentDay <= daysInMonth) {
      let week = [];
      for (let i = 0; i < 7; i++) {
        if (weeks.length === 0 && i < startDate.getDay()) {
          week.push(<td key={`empty-${i}`}></td>);
        } else if (currentDay <= daysInMonth) {
          const date = new Date(year, month, currentDay);
          week.push(
            <td 
              key={currentDay} 
              className={selectionMode ? 'selectable' : ''}
              style={getDayStyle(date)}
              onClick={() => handleDayClick(date)}
            >
              {currentDay}
            </td>
          );
          currentDay++;
        } else {
          week.push(<td key={`empty-end-${i}`}></td>);
        }
      }
      weeks.push(<tr key={`week-${weeks.length}`}>{week}</tr>);
    }
    
    return (
      <div className="col-md-4 mb-4" key={month}>
        <div className="card h-100">
          <div className="card-header text-center"><h5>{months[month]}</h5></div>
          <div className="card-body p-2">
            <table className="table table-bordered text-center">
              <thead>
                <tr>
                  <th>S</th><th>M</th><th>T</th><th>W</th><th>T</th><th>F</th><th>S</th>
                </tr>
              </thead>
              <tbody>
                {weeks}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="row">
        {months.map((_, index) => renderMonth(index))}
      </div>
      <div className="d-flex justify-content-center flex-wrap mt-4">
        {Object.entries(colors).map(([key, value]) => (
            <span key={key} className="badge m-1 p-2" style={{backgroundColor: value, color: '#212529'}}>
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </span>
        ))}
      </div>
    </div>
  );
};

export default Calendar;
