import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': enUS
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

function AttendanceCalendar({ data }) {
  const events = data.map(attendance => ({
    title: `${attendance.status} - ${attendance.shift}`,
    start: new Date(attendance.date),
    end: new Date(attendance.date),
    status: attendance.status,
    shift: attendance.shift,
    allDay: true
  }));

  const eventStyleGetter = (event) => {
    let style = {
      backgroundColor: '#E5E7EB',
      color: '#374151'
    };

    switch (event.status) {
      case 'Present':
        style.backgroundColor = '#DEF7EC';
        style.color = '#03543F';
        break;
      case 'Absent':
        style.backgroundColor = '#FDE8E8';
        style.color = '#9B1C1C';
        break;
      case 'Weekend':
        style.backgroundColor = '#FEF3C7';
        style.color = '#92400E';
        break;
    }

    return {
      style
    };
  };

  return (
    <div className="h-[600px] bg-white rounded-lg border border-gray-200 p-4">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        eventPropGetter={eventStyleGetter}
        views={['month', 'week']}
        defaultView="month"
      />
    </div>
  );
}

export default AttendanceCalendar;