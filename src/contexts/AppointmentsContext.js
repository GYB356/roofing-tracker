import React, { createContext, useContext, useReducer, useEffect } from 'react';
import appointmentService from '../services/appointmentService.js';

const AppointmentsContext = createContext();

const initialState = {
  appointments: [],
  loading: false,
  error: null,
  selectedAppointment: null,
  availability: []
};

const actions = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_APPOINTMENTS: 'SET_APPOINTMENTS',
  SET_AVAILABILITY: 'SET_AVAILABILITY',
  SELECT_APPOINTMENT: 'SELECT_APPOINTMENT'
};

function reducer(state, action) {
  switch (action.type) {
    case actions.SET_LOADING:
      return { ...state, loading: action.payload };
    case actions.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    case actions.SET_APPOINTMENTS:
      return { ...state, appointments: action.payload, error: null, loading: false };
    case actions.SET_AVAILABILITY:
      return { ...state, availability: action.payload, error: null, loading: false };
    case actions.SELECT_APPOINTMENT:
      return { ...state, selectedAppointment: action.payload };
    default:
      return state;
  }
}

export const AppointmentsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchAppointments = async (params) => {
    try {
      dispatch({ type: actions.SET_LOADING, payload: true });
      const data = await appointmentService.getAppointments(params);
      dispatch({ type: actions.SET_APPOINTMENTS, payload: data });
    } catch (error) {
      dispatch({ type: actions.SET_ERROR, payload: error.message });
    }
  };

  const createAppointment = async (appointmentData) => {
    try {
      dispatch({ type: actions.SET_LOADING, payload: true });
      const newAppointment = await appointmentService.createAppointment(appointmentData);
      dispatch({ type: actions.SET_APPOINTMENTS, payload: [...state.appointments, newAppointment] });
      return newAppointment;
    } catch (error) {
      dispatch({ type: actions.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  const updateAppointment = async (id, updateData) => {
    try {
      dispatch({ type: actions.SET_LOADING, payload: true });
      const updatedAppointment = await appointmentService.updateAppointment(id, updateData);
      dispatch({
        type: actions.SET_APPOINTMENTS,
        payload: state.appointments.map(appt =>
          appt.id === id ? updatedAppointment : appt
        )
      });
      return updatedAppointment;
    } catch (error) {
      dispatch({ type: actions.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  const checkAvailability = async (providerId, date) => {
    try {
      dispatch({ type: actions.SET_LOADING, payload: true });
      const availability = await appointmentService.getAvailability(providerId, date);
      dispatch({ type: actions.SET_AVAILABILITY, payload: availability });
      return availability;
    } catch (error) {
      dispatch({ type: actions.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  return (
    <AppointmentsContext.Provider
      value={{
        ...state,
        fetchAppointments,
        createAppointment,
        updateAppointment,
        checkAvailability,
        selectAppointment: (appt) => dispatch({ type: actions.SELECT_APPOINTMENT, payload: appt })
      }}
    >
      {children}
    </AppointmentsContext.Provider>
  );
};

export const useAppointments = () => {
  const context = useContext(AppointmentsContext);
  if (!context) {
    throw new Error('useAppointments must be used within an AppointmentsProvider');
  }
  return context;
};