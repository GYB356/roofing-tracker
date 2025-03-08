import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useAuth } from '../../contexts/AuthContext';
import { checkConflict, generateShiftCoverageReport, generateStaffingReport } from '../../utils/schedulingUtils';

const StaffScheduling = ({ department }) => {
  const [scheduleTemplates, setScheduleTemplates] = useState([]);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const { currentUser } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [timeOffRequests, setTimeOffRequests] = useState([]);
  const [selectedShift, setSelectedShift] = useState(null);
  const [selectedSwapShift, setSelectedSwapShift] = useState(null);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [viewMode, setViewMode] = useState('department');
  const [showTimeOffModal, setShowTimeOffModal] = useState(false);

  // Load initial schedule data
  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const response = await fetch(`/api/schedules?department=${department.id}`);
        const data = await response.json();
        setShifts(data.shifts);
        setTimeOffRequests(data.timeOffRequests);
      } catch (error) {
        console.error('Error loading schedule:', error);
      }
    };
    
    if (department) loadSchedule();
  }, [department]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const newShifts = Array.from(shifts);
    const [movedShift] = newShifts.splice(result.source.index, 1);
    newShifts.splice(result.destination.index, 0, movedShift);

    const conflictCheck = checkConflict(movedShift, newShifts, {
  departmentRoles: department.required_roles,
  staffSkills: currentUser?.certifications,
  availabilityPreferences: department.availability_preferences
});
    if (conflictCheck.hasConflict) {
      setConflicts([...conflicts, conflictCheck]);
      return;
    }

    setShifts(newShifts);
    updateBackendSchedule(newShifts);
  };

  const updateBackendSchedule = async (updatedShifts) => {
    try {
      await fetch('/api/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          department: department.id,
          shifts: updatedShifts
        })
      });
    } catch (error) {
      console.error('Error updating schedule:', error);
    }
  };

  const handleCreateShift = (selectInfo) => {
    setSelectedShift({
      start: selectInfo.start,
      end: selectInfo.end,
      title: 'New Shift',
      staff: [],
      requirements: {
        roles: [],
        skills: [],
        minStaff: 1
      }
    });
  };

  const handleResolveConflict = (conflictId) => {
    setConflicts(conflicts.filter(c => c.id !== conflictId));
  };

  return (
    <div className="scheduling-container bg-white rounded-lg shadow p-4">
      <div className="view-controls mb-4">
        <button
          className={`mr-2 ${viewMode === 'department' ? 'font-bold' : ''}`}
          onClick={() => setViewMode('department')}
        >
          Department View
        </button>
        <button
          className={`${viewMode === 'individual' ? 'font-bold' : ''}`}
          onClick={() => setViewMode('individual')}
        >
          Staff Availability
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="calendar-container">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin]}
            initialView="timeGridWeek"
            editable={true}
            selectable={true}
            select={handleCreateShift}
            events={[...shifts, ...timeOffRequests.map(req => ({
    title: 'Time Off: ' + req.type,
    start: req.startDate,
    end: req.endDate,
    color: '#ff9f89',
    extendedProps: { isTimeOff: true }
  }))]}
            headerToolbar={{
              left: 'prev,next today templateButton',
              center: 'title',
              right: 'timeGridWeek,timeGridDay'
            }}
            customButtons={{
              templateButton: {
                text: 'Templates',
                click: () => setShowTemplateModal(true)
              }
            }}
            eventContent={(eventInfo) => (
              <div className="fc-event-content p-1">
                <div>{eventInfo.event.title}</div>
                <div className="staff-list">
                  {eventInfo.event.extendedProps.staff.map(staff => (
                    <div key={staff.id} className="staff-item">
                      {staff.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          />
        </div>

        {selectedShift && (
          <ShiftDetailModal
            shift={selectedShift}
            onClose={() => setSelectedShift(null)}
            onSave={(updatedShift) => {
              setShifts([...shifts, updatedShift]);
              setSelectedShift(null);
              updateBackendSchedule([...shifts, updatedShift]);
            }}
          />
        )}

        {conflicts.length > 0 && (
          <ConflictResolutionModal
            conflicts={conflicts}
            onResolve={handleResolveConflict}
          />
        )}

        {showSwapModal && (
          <ShiftSwapModal
            shift={selectedSwapShift}
            onClose={() => setShowSwapModal(false)}
            onComplete={() => {
              loadSchedule();
              setShowSwapModal(false);
            }}
          />
        )}
        {showSwapModal && (
          <ShiftSwapModal
            shift={selectedSwapShift}
            onClose={() => setShowSwapModal(false)}
            onComplete={() => {
              loadSchedule();
              setShowSwapModal(false);
            }}
          />
        )}
      </DragDropContext>

      <div className="reporting-tools mt-4">
        <button
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mr-2"
          onClick={() => setShowTimeOffModal(true)}
        >
          Request Time Off
        </button>
        <button
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 mr-2"
          onClick={() => generateStaffingReport(shifts, department)}
        >
          Generate Staffing Report
        </button>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => generateShiftCoverageReport(shifts, department)}
        >
          Generate Coverage Report
        </button>
      </div>
    </div>
  );
};

{showTimeOffModal && (
        <TimeOffRequestModal
          onClose={() => setShowTimeOffModal(false)}
          onSubmit={(newRequest) => {
            setTimeOffRequests([...timeOffRequests, newRequest]);
            setShifts(shifts.filter(shift => 
              !checkConflict(shift, [newRequest]).hasConflict
            ));
          }}
        />
      )}

      export default StaffScheduling;