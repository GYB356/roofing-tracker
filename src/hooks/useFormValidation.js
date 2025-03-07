// src/hooks/useFormValidation.js
import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for form validation
 * @param {Object} initialValues - Initial form values
 * @param {Function} validate - Validation function returning errors
 * @param {Function} onSubmit - Function to call on valid submission
 * @returns {Object} - Form state and handlers
 */
const useFormValidation = (initialValues, validate, onSubmit) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Run validation whenever values or touched fields change
  useEffect(() => {
    const validationErrors = validate(values);
    setErrors(validationErrors);
    setIsValid(Object.keys(validationErrors).length === 0);
  }, [values, validate]);

  // Submit form if validation passes
  useEffect(() => {
    if (isSubmitting && isValid) {
      const submitForm = async () => {
        try {
          await onSubmit(values);
        } catch (error) {
          // Add any submission errors to the form errors
          if (error.fieldErrors) {
            setErrors(prev => ({ ...prev, ...error.fieldErrors }));
          }
        } finally {
          setIsSubmitting(false);
        }
      };
      
      submitForm();
    } else if (isSubmitting) {
      setIsSubmitting(false);
    }
  }, [isSubmitting, isValid, values, onSubmit]);

  // Handle field change
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    
    setValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }, []);

  // Handle custom field change (for components that don't use standard events)
  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Mark as touched to trigger validation
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  }, []);

  // Handle field blur
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  }, []);

  // Mark all fields as touched (useful for showing all errors on submit)
  const touchAll = useCallback(() => {
    const touchedFields = {};
    Object.keys(values).forEach(key => {
      touchedFields[key] = true;
    });
    setTouched(touchedFields);
  }, [values]);

  // Handle form submission
  const handleSubmit = useCallback((e) => {
    if (e) e.preventDefault();
    touchAll();
    setIsSubmitting(true);
  }, [touchAll]);

  // Reset form to initial values
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Determine if a field has an error that should be displayed
  const shouldShowError = useCallback((fieldName) => {
    return errors[fieldName] && touched[fieldName];
  }, [errors, touched]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    shouldShowError,
    touchAll
  };
};

export default useFormValidation;