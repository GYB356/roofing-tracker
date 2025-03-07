// src/utils/validation.js

/**
 * Form validation utility functions
 */

/**
 * Validate email address format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };
  
  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} - Validation result with isValid flag and feedback message
   */
  export const validatePassword = (password) => {
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
    
    const strength = [
      password.length >= minLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialChar
    ].filter(Boolean).length;
    
    let message = '';
    let isValid = false;
    
    switch (strength) {
      case 0:
      case 1:
        message = 'Password is very weak';
        isValid = false;
        break;
      case 2:
        message = 'Password is weak';
        isValid = false;
        break;
      case 3:
        message = 'Password is medium strength';
        isValid = true;
        break;
      case 4:
        message = 'Password is strong';
        isValid = true;
        break;
      case 5:
        message = 'Password is very strong';
        isValid = true;
        break;
      default:
        message = 'Password is invalid';
        isValid = false;
    }
    
    const requirements = [];
    
    if (password.length < minLength) {
      requirements.push(`At least ${minLength} characters`);
    }
    if (!hasUppercase) {
      requirements.push('At least one uppercase letter');
    }
    if (!hasLowercase) {
      requirements.push('At least one lowercase letter');
    }
    if (!hasNumber) {
      requirements.push('At least one number');
    }
    if (!hasSpecialChar) {
      requirements.push('At least one special character');
    }
    
    return {
      isValid,
      message,
      strength,
      requirements,
      checks: {
        minLength: password.length >= minLength,
        hasUppercase,
        hasLowercase,
        hasNumber,
        hasSpecialChar
      }
    };
  };
  
  /**
   * Validate that passwords match
   * @param {string} password - Password
   * @param {string} confirmPassword - Confirmation password
   * @returns {boolean} - True if matching, false otherwise
   */
  export const passwordsMatch = (password, confirmPassword) => {
    return password === confirmPassword;
  };
  
  /**
   * Validate phone number format
   * @param {string} phone - Phone number to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  export const isValidPhone = (phone) => {
    // Allows formats like: (123) 456-7890, 123-456-7890, 123.456.7890, 1234567890
    const phoneRegex = /^(\+\d{1,2}\s?)?(\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}$/;
    return phoneRegex.test(phone);
  };
  
  /**
   * Validate US ZIP code format
   * @param {string} zipCode - ZIP code to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  export const isValidZipCode = (zipCode) => {
    // Allows 5-digit or 5+4 digit formats like: 12345 or 12345-6789
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(zipCode);
  };
  
  /**
   * Validate date format and if it's a valid date
   * @param {string} dateStr - Date string to validate (YYYY-MM-DD)
   * @returns {boolean} - True if valid, false otherwise
   */
  export const isValidDate = (dateStr) => {
    // Check format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return false;
    }
    
    // Check if it's a valid date
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return false;
    }
    
    // Check if parts match (to handle cases like 2023-02-31)
    const parts = dateStr.split('-');
    return (
      parseInt(parts[0], 10) === date.getFullYear() &&
      parseInt(parts[1], 10) === date.getMonth() + 1 &&
      parseInt(parts[2], 10) === date.getDate()
    );
  };
  
  /**
   * Check if a date is in the future
   * @param {string} dateStr - Date string (YYYY-MM-DD)
   * @returns {boolean} - True if in future, false otherwise
   */
  export const isDateInFuture = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const date = new Date(dateStr);
    
    return date > today;
  };
  
  /**
   * Check if a date is in the past
   * @param {string} dateStr - Date string (YYYY-MM-DD)
   * @returns {boolean} - True if in past, false otherwise
   */
  export const isDateInPast = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const date = new Date(dateStr);
    
    return date < today;
  };
  
  /**
   * Validate time format (HH:MM)
   * @param {string} timeStr - Time string to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  export const isValidTime = (timeStr) => {
    // Check format
    if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr)) {
      return false;
    }
    
    return true;
  };
  
  /**
   * Validate credit card number using Luhn algorithm
   * @param {string} cardNumber - Credit card number to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  export const isValidCreditCard = (cardNumber) => {
    // Remove spaces and dashes
    const number = cardNumber.replace(/[\s-]/g, '');
    
    // Check if contains only digits
    if (!/^\d+$/.test(number)) {
      return false;
    }
    
    // Check length (13-19 digits for most cards)
    if (number.length < 13 || number.length > 19) {
      return false;
    }
    
    // Luhn algorithm
    let sum = 0;
    let shouldDouble = false;
    
    // Start from the right
    for (let i = number.length - 1; i >= 0; i--) {
      let digit = parseInt(number.charAt(i), 10);
      
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    
    return sum % 10 === 0;
  };
  
  /**
   * Validate credit card expiration date
   * @param {string} month - Month (MM)
   * @param {string} year - Year (YY or YYYY)
   * @returns {boolean} - True if valid and not expired, false otherwise
   */
  export const isValidCardExpiration = (month, year) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const currentYear = currentDate.getFullYear();
    
    // Convert to numbers
    let expMonth = parseInt(month, 10);
    let expYear = parseInt(year, 10);
    
    // Handle 2-digit year
    if (expYear < 100) {
      expYear += 2000;
    }
    
    // Check if already expired
    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      return false;
    }
    
    // Check if month is valid
    if (expMonth < 1 || expMonth > 12) {
      return false;
    }
    
    return true;
  };
  
  /**
   * Validate credit card CVV 
   * @param {string} cvv - CVV code to validate
   * @param {string} cardType - Card type (optional)
   * @returns {boolean} - True if valid, false otherwise
   */
  export const isValidCVV = (cvv, cardType = null) => {
    // Amex requires 4 digits, others require 3
    const requiredLength = cardType?.toLowerCase() === 'amex' ? 4 : 3;
    
    // Check if contains only digits and has correct length
    return /^\d+$/.test(cvv) && cvv.length === requiredLength;
  };
  
  /**
   * Validate name (prevents numbers and special characters)
   * @param {string} name - Name to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  export const isValidName = (name) => {
    // Allow letters, spaces, hyphens and apostrophes
    const nameRegex = /^[a-zA-Z\s'-]+$/;
    return nameRegex.test(name);
  };
  
  /**
   * Validate required field (not empty)
   * @param {string} value - Field value
   * @returns {boolean} - True if not empty, false otherwise
   */
  export const isRequired = (value) => {
    return value !== undefined && value !== null && value.trim() !== '';
  };
  
  /**
   * Validate minimum length
   * @param {string} value - Field value
   * @param {number} minLength - Minimum required length
   * @returns {boolean} - True if valid, false otherwise
   */
  export const hasMinLength = (value, minLength) => {
    return value.length >= minLength;
  };
  
  /**
   * Validate maximum length
   * @param {string} value - Field value
   * @param {number} maxLength - Maximum allowed length
   * @returns {boolean} - True if valid, false otherwise
   */
  export const hasMaxLength = (value, maxLength) => {
    return value.length <= maxLength;
  };
  
  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  export const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };
  
  /**
   * Validate numeric value
   * @param {string} value - Value to validate
   * @returns {boolean} - True if numeric, false otherwise
   */
  export const isNumeric = (value) => {
    return /^[0-9]+$/.test(value);
  };
  
  /**
   * Validate decimal value
   * @param {string} value - Value to validate
   * @returns {boolean} - True if decimal, false otherwise
   */
  export const isDecimal = (value) => {
    return /^[0-9]+(\.[0-9]+)?$/.test(value);
  };
  
  /**
   * Validate value is within range
   * @param {number} value - Value to validate
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {boolean} - True if within range, false otherwise
   */
  export const isWithinRange = (value, min, max) => {
    const numValue = parseFloat(value);
    return numValue >= min && numValue <= max;
  };