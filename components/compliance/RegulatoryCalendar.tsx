import React, { useState } from 'react';

interface ComplianceDeadline {
  id: string;
  reportType: string;
  dueDate: string;
  status: 'completed' | 'in_progress' | 'pending' | 'not_started';
  assignedTo: string;
  progress: number;
  regulatoryBody: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'assessment' | 'training' | 'regulatory' | 'review' | 'deadline';
  priority: 'high' | 'medium' | 'low';
}

interface RegulatoryCalendarProps {
  complianceDeadlines: ComplianceDeadline[];
  upcomingEvents: CalendarEvent[];
  className?: string;
}

export const RegulatoryCalendar: React.FC<RegulatoryCalendarProps> = ({
  complianceDeadlines,
  upcomingEvents,
  className = ''
}) => {
  const [selectedView, setSelectedView] = useState<'calendar' | 'list'>('calendar');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-sov-red/20 text-sov-red border-sov-red/30';
      case 'medium': return 'bg-sov-gold/20 text-sov-gold border-sov-gold/30';
      case 'low': return 'bg-sov-green/20 text-sov-green border-sov-green/30';
      default: return 'bg-gray-700 text-gray-300 border-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-sov-green/20 text-sov-green';
      case 'in_progress': return 'bg-sov-accent/20 text-sov-accent';
      case 'pending': return 'bg-sov-gold/20 text-sov-gold';
      case 'not_started': return 'bg-gray-700 text-gray-300';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'assessment': return '📋';
      case 'training': return '🎓';
      case 'regulatory': return '⚖️';
      case 'review': return '👁️';
      case 'deadline': return '⏰';
      default: return '📅';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `Overdue by ${Math.abs(diffDays)} days`, color: 'text-sov-red' };
    } else if (diffDays === 0) {
      return { text: 'Due today', color: 'text-sov-gold' };
    } else if (diffDays === 1) {
      return { text: 'Due tomorrow', color: 'text-sov-gold' };
    } else if (diffDays <= 7) {
      return { text: `Due in ${diffDays} days`, color: 'text-sov-gold' };
    } else {
      return { text: date.toLocaleDateString(), color: 'text-sov-light-alt' };
    }
  };

  const isEventUpcoming = (eventDate: string) => {
    const event = new Date(eventDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    
    return event >= now && event <= thirtyDaysFromNow;
  };

  const upcomingEventsSorted = upcomingEvents
    .filter(event => isEventUpcoming(event.date))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className={`bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-sov-light">Regulatory Calendar</h3>
        <div className="flex gap-2">
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="bg-sov-dark border border-gray-600 text-sov-light px-3 py-2 rounded-lg text-sm"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                {new Date(2024, i).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="bg-sov-dark border border-gray-600 text-sov-light px-3 py-2 rounded-lg text-sm"
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
          <div className="flex bg-sov-dark border border-gray-600 rounded-lg overflow-hidden">
            <button
              onClick={() => setSelectedView('calendar')}
              className={`px-3 py-2 text-sm font-semibold ${
                selectedView === 'calendar' ? 'bg-sov-accent text-sov-dark' : 'text-sov-light hover:bg-gray-700'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setSelectedView('list')}
              className={`px-3 py-2 text-sm font-semibold ${
                selectedView === 'list' ? 'bg-sov-accent text-sov-dark' : 'text-sov-light hover:bg-gray-700'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {selectedView === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar View */}
          <div className="lg:col-span-2">
            <div className="bg-sov-dark p-4 rounded-lg border border-gray-700">
              <h4 className="text-lg font-semibold mb-4 text-sov-light">
                {new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h4>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-semibold text-sov-light-alt p-2">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }, (_, i) => {
                  const dayOfMonth = i - new Date(selectedYear, selectedMonth, 1).getDay() + 1;
                  const currentDate = new Date(selectedYear, selectedMonth, dayOfMonth);
                  const isCurrentMonth = dayOfMonth > 0 && dayOfMonth <= new Date(selectedYear, selectedMonth + 1, 0).getDate();
                  const isToday = currentDate.toDateString() === new Date().toDateString();
                  
                  const dayEvents = upcomingEvents.filter(event => {
                    const eventDate = new Date(event.date);
                    return eventDate.getDate() === dayOfMonth && 
                           eventDate.getMonth() === selectedMonth && 
                           eventDate.getFullYear() === selectedYear;
                  });

                  return (
                    <div 
                      key={i}
                      className={`
                        p-2 min-h-[80px] border rounded-lg
                        ${isCurrentMonth ? 'bg-sov-dark border-gray-600' : 'bg-gray-800 border-gray-700 opacity-50'}
                        ${isToday ? 'ring-2 ring-sov-accent' : ''}
                      `}
                    >
                      <div className={`text-sm font-semibold mb-1 ${
                        isCurrentMonth ? 'text-sov-light' : 'text-gray-500'
                      } ${isToday ? 'text-sov-accent' : ''}`}>
                        {isCurrentMonth ? dayOfMonth : ''}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.map(event => (
                          <div 
                            key={event.id}
                            className={`text-xs p-1 rounded border ${getPriorityColor(event.priority)}`}
                            title={event.title}
                          >
                            {getEventTypeIcon(event.type)} {event.title.substring(0, 15)}...
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-sov-light">Upcoming Events (30 days)</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {upcomingEventsSorted.length === 0 ? (
                <div className="text-center text-sov-light-alt py-8">
                  No upcoming events in the next 30 days
                </div>
              ) : (
                upcomingEventsSorted.map(event => {
                  const dateInfo = formatDate(event.date);
                  return (
                    <div key={event.id} className="p-3 bg-sov-dark rounded-lg border border-gray-700">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span>{getEventTypeIcon(event.type)}</span>
                          <h5 className="font-semibold text-sov-light text-sm">{event.title}</h5>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(event.priority)}`}>
                          {event.priority}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className={`font-semibold ${dateInfo.color}`}>
                          {dateInfo.text}
                        </span>
                        <span className="text-sov-light-alt">
                          {new Date(event.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Compliance Deadlines */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-sov-light">Compliance Deadlines</h4>
            <div className="space-y-3">
              {complianceDeadlines.map(deadline => {
                const dateInfo = formatDate(deadline.dueDate);
                return (
                  <div key={deadline.id} className="p-4 bg-sov-dark rounded-lg border border-gray-700">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h5 className="font-semibold text-sov-light">{deadline.reportType}</h5>
                        <p className="text-sm text-sov-light-alt">{deadline.regulatoryBody}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(deadline.status)}`}>
                        {deadline.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-sov-light-alt">Due Date:</span>
                        <span className={`font-semibold ${dateInfo.color}`}>
                          {dateInfo.text}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-sov-light-alt">Assigned to:</span>
                        <span className="text-sov-light font-semibold">{deadline.assignedTo}</span>
                      </div>
                    </div>

                    {deadline.status === 'in_progress' && (
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-sov-light-alt">Progress</span>
                          <span className="text-sov-light font-semibold">{deadline.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-sov-accent h-2 rounded-full transition-all duration-500"
                            style={{ width: `${deadline.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button className="flex-1 bg-sov-accent/10 text-sov-accent font-semibold py-2 px-3 rounded-lg hover:bg-sov-accent/20 transition-colors text-sm">
                        View Details
                      </button>
                      <button className="bg-sov-dark-alt border border-gray-600 text-sov-light font-semibold py-2 px-3 rounded-lg hover:bg-gray-700 transition-colors text-sm">
                        Update
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* All Events */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-sov-light">All Upcoming Events</h4>
            <div className="space-y-3">
              {upcomingEventsSorted.map(event => {
                const dateInfo = formatDate(event.date);
                return (
                  <div key={event.id} className="p-3 bg-sov-dark rounded-lg border border-gray-700">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span>{getEventTypeIcon(event.type)}</span>
                        <h5 className="font-semibold text-sov-light text-sm">{event.title}</h5>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(event.priority)}`}>
                        {event.priority}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className={`font-semibold ${dateInfo.color}`}>
                        {dateInfo.text}
                      </span>
                      <span className="text-sov-light-alt">
                        {new Date(event.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="mt-6 p-4 bg-sov-dark rounded-lg border border-gray-700">
        <h4 className="text-lg font-semibold mb-3 text-sov-light">Calendar Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-sov-red mb-1">
              {upcomingEvents.filter(e => e.priority === 'high').length}
            </div>
            <div className="text-sov-light-alt text-sm">High Priority Events</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-sov-gold mb-1">
              {upcomingEvents.filter(e => e.priority === 'medium').length}
            </div>
            <div className="text-sov-light-alt text-sm">Medium Priority Events</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-sov-green mb-1">
              {complianceDeadlines.filter(d => d.status === 'completed').length}
            </div>
            <div className="text-sov-light-alt text-sm">Completed Deadlines</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-sov-accent mb-1">
              {complianceDeadlines.filter(d => d.status === 'in_progress').length}
            </div>
            <div className="text-sov-light-alt text-sm">In Progress</div>
          </div>
        </div>
      </div>
    </div>
  );
};
