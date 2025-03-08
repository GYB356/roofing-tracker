export const checkConflict = (shift, allShifts, { departmentRoles, staffSkills, availabilityPreferences }) => {
  const conflicts = [];
  const staffShifts = new Map();

  // Check for overlapping shifts
  allShifts.forEach(existingShift => {
    if (existingShift.id !== shift.id && 
        existingShift.start < shift.end && 
        existingShift.end > shift.start) {
      existingShift.staff.forEach(staffMember => {
        if (shift.staff.some(s => s.id === staffMember.id)) {
          conflicts.push({
            type: 'overlap',
            staff: staffMember,
            existingShift,
            newShift: shift
          });
        }
      });
    }
  });

  // Check role requirements
  const roleCounts = new Map();
  // Check availability preferences
  shift.staff.forEach(staffMember => {
    const availability = availabilityPreferences.find(ap => ap.staffId === staffMember.id);
    if (availability && !availability.timeSlots.some(slot => 
      new Date(slot.start) <= new Date(shift.start) &&
      new Date(slot.end) >= new Date(shift.end)
    )) {
      conflicts.push({
        type: 'availability',
        staff: staffMember,
        shift: shift
      });
    }
    staffMember.roles.forEach(role => {
      roleCounts.set(role, (roleCounts.get(role) || 0) + 1);
    });
  });

  shift.requirements.roles.forEach(requirement => {
    const current = roleCounts.get(requirement.role) || 0;
    if (current < requirement.min) {
      conflicts.push({
        type: 'role_shortage',
        role: requirement.role,
        required: requirement.min,
        actual: current
      });
    }
  });

  return {
    hasConflict: conflicts.length > 0,
    conflicts
  };
};

export const generateShiftCoverageReport = (shifts, department) => {
  const report = {
    department: department.name,
    dateRange: {},
    roleCoverage: {},
    totalHours: 0,
    conflicts: 0,
    warnings: []
  };

  const dates = shifts.map(s => new Date(s.start));
  report.dateRange.start = new Date(Math.min(...dates)).toISOString();
  report.dateRange.end = new Date(Math.max(...dates)).toISOString();

  // Calculate role coverage
  department.roles.forEach(role => {
    report.roleCoverage[role.name] = {
      requiredHours: 0,
      scheduledHours: 0,
      coveragePercentage: 0
    };
  });

  shifts.forEach(shift => {
    const duration = (new Date(shift.end) - new Date(shift.start)) / 3600000;
    report.totalHours += duration * shift.staff.length;

    // Check availability preferences
  shift.staff.forEach(staffMember => {
    const availability = availabilityPreferences.find(ap => ap.staffId === staffMember.id);
    if (availability && !availability.timeSlots.some(slot => 
      new Date(slot.start) <= new Date(shift.start) &&
      new Date(slot.end) >= new Date(shift.end)
    )) {
      conflicts.push({
        type: 'availability',
        staff: staffMember,
        shift: shift
      });
    }
      staffMember.roles.forEach(role => {
        if (report.roleCoverage[role.name]) {
          report.roleCoverage[role.name].scheduledHours += duration;
        }
      });
    });

    const conflictCheck = checkConflict(shift, shifts);
    if (conflictCheck.hasConflict) {
      report.conflicts += conflictCheck.conflicts.length;
    }
  });

  // Calculate coverage percentages
  Object.keys(report.roleCoverage).forEach(role => {
    const required = department.roles.find(r => r.name === role).minDailyHours;
    report.roleCoverage[role].requiredHours = required;
    report.roleCoverage[role].coveragePercentage = 
      (report.roleCoverage[role].scheduledHours / required) * 100;
  });

  return report;
};