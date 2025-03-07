// src/components/common/FormComponents.js
import React from 'react';
import { Eye, EyeOff, AlertCircle, Check, Calendar, Clock, CreditCard } from 'lucide-react';

/**
 * FormInput component with built-in validation display
 * @param {Object} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
export const FormInput = ({
  id,
  name,
  type = 'text',
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  touched,
  required = false,
  disabled = false,
  className = '',
  icon = null,
  autoComplete,
  maxLength,
  minLength,
  pattern,
  helpText,
  ...rest
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const finalType = type === 'password' && showPassword ? 'text' : type;
  const hasError = error && touched;
  
  // Show character count for text inputs with maxLength
  const showCharCount = ['text', 'textarea', 'email', 'password'].includes(type) && maxLength;
  
  const inputClasses = `w-full py-3 pl-10 pr-3 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${
    hasError
      ? 'bg-red-900/20 border border-red-500 focus:ring-red-500'
      : 'bg-gray-700 border border-gray-600 focus:ring-blue-500'
  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${
    type === 'password' ? 'pr-10' : ''
  } ${className}`;
  
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={id || name} className="block text-sm font-medium text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {/* Input icon */}
        {icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        
        {/* Input element */}
        <input
          id={id || name}
          name={name}
          type={finalType}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          className={inputClasses}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? `${name}-error` : undefined}
          {...rest}
        />
        
        {/* Password toggle button */}
        {type === 'password' && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300 focus:outline-none"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
        
        {/* Error indicator */}
                  {hasError && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>
      
      {/* Error message */}
      {hasError && (
        <p id={`${name}-error`} className="mt-1 text-sm text-red-500">
          {error}
        </p>
      )}
      
      {/* Help text */}
      {helpText && !hasError && (
        <p className="mt-1 text-xs text-gray-400">
          {helpText}
        </p>
      )}
    </div>
  );
};

/**
 * FormTimePicker component
 * @param {Object} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
export const FormTimePicker = ({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  disabled = false,
  className = '',
  min,
  max,
  step = 900, // 15 minutes in seconds
  helpText,
  ...rest
}) => {
  const hasError = error && touched;
  
  const inputClasses = `w-full py-3 pl-10 pr-3 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${
    hasError
      ? 'bg-red-900/20 border border-red-500 focus:ring-red-500'
      : 'bg-gray-700 border border-gray-600 focus:ring-blue-500'
  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`;
  
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={id || name} className="block text-sm font-medium text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
          <Clock size={18} />
        </div>
        
        <input
          id={id || name}
          name={name}
          type="time"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          min={min}
          max={max}
          step={step}
          className={inputClasses}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? `${name}-error` : undefined}
          {...rest}
        />
        
        {/* Error indicator */}
        {hasError && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>
      
      {/* Error message */}
      {hasError && (
        <p id={`${name}-error`} className="mt-1 text-sm text-red-500">
          {error}
        </p>
      )}
      
      {/* Help text */}
      {helpText && !hasError && (
        <p className="mt-1 text-xs text-gray-400">
          {helpText}
        </p>
      )}
    </div>
  );
};

/**
 * FormCreditCardInput component
 * @param {Object} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
export const FormCreditCardInput = ({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  disabled = false,
  className = '',
  helpText,
  placeholder = 'Card number',
  ...rest
}) => {
  const hasError = error && touched;
  
  // Format card number with spaces
  const handleChange = (e) => {
    let { value } = e.target;
    
    // Remove non-digit characters
    value = value.replace(/\D/g, '');
    
    // Add spaces after every 4 digits
    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    
    // Limit to 19 characters (16 digits + 3 spaces)
    value = value.substring(0, 19);
    
    // Create a new event with formatted value
    const newEvent = {
      ...e,
      target: {
        ...e.target,
        name,
        value
      }
    };
    
    onChange(newEvent);
  };
  
  const inputClasses = `w-full py-3 pl-10 pr-3 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${
    hasError
      ? 'bg-red-900/20 border border-red-500 focus:ring-red-500'
      : 'bg-gray-700 border border-gray-600 focus:ring-blue-500'
  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`;
  
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={id || name} className="block text-sm font-medium text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
          <CreditCard size={18} />
        </div>
        
        <input
          id={id || name}
          name={name}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          maxLength={19} // 16 digits + 3 spaces
          className={inputClasses}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? `${name}-error` : undefined}
          autoComplete="cc-number"
          {...rest}
        />
        
        {/* Card type icon could be added here */}
        
        {/* Error indicator */}
        {hasError && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>
      
      {/* Error message */}
      {hasError && (
        <p id={`${name}-error`} className="mt-1 text-sm text-red-500">
          {error}
        </p>
      )}
      
      {/* Help text */}
      {helpText && !hasError && (
        <p className="mt-1 text-xs text-gray-400">
          {helpText}
        </p>
      )}
    </div>
  );
};

/**
 * FormSubmitButton component
 * @param {Object} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
export const FormSubmitButton = ({
  children,
  loading = false,
  disabled = false,
  icon,
  className = '',
  loadingText = 'Processing...',
  type = 'submit',
  ...rest
}) => {
  return (
    <button
      type={type}
      disabled={loading || disabled}
      className={`w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...rest}
    >
      {loading ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {loadingText}
        </span>
      ) : (
        <span className="flex items-center">
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </span>
      )}
    </button>
  );
};

/**
 * FormCard component to wrap form sections
 * @param {Object} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
export const FormCard = ({
  title,
  description,
  children,
  className = '',
  icon,
  ...rest
}) => {
  return (
    <div className={`bg-gray-800 rounded-lg shadow-md p-6 mb-6 ${className}`} {...rest}>
      {(title || icon) && (
        <div className="flex items-center mb-4">
          {icon && <div className="mr-3 text-blue-400">{icon}</div>}
          <div>
            {title && <h3 className="text-lg font-medium text-white">{title}</h3>}
            {description && <p className="mt-1 text-sm text-gray-400">{description}</p>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

/**
 * FormDivider component
 * @param {Object} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
export const FormDivider = ({
  label,
  className = '',
  ...rest
}) => {
  return (
    <div className={`relative my-6 ${className}`} {...rest}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-700"></div>
      </div>
      {label && (
        <div className="relative flex justify-center">
          <span className="px-2 bg-gray-800 text-sm text-gray-400">
            {label}
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * FormValidationSummary component to display multiple errors
 * @param {Object} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
export const FormValidationSummary = ({
  errors,
  title = 'Please correct the following errors:',
  className = '',
  ...rest
}) => {
  // Convert errors object to array
  const errorList = Object.entries(errors).map(([field, message]) => ({
    field,
    message
  }));
  
  if (errorList.length === 0) {
    return null;
  }
  
  return (
    <div 
      className={`p-4 mb-6 bg-red-900/20 border border-red-500 rounded-md ${className}`} 
      role="alert"
      aria-labelledby="error-summary-title"
      {...rest}
    >
      <div className="flex">
        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          <h3 id="error-summary-title" className="text-sm font-medium text-red-500">
            {title}
          </h3>
          <ul className="mt-2 text-sm text-red-400 list-disc pl-5 space-y-1">
            {errorList.map((error) => (
              <li key={error.field}>{error.message}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

/**
 * FormSuccess component to display success message
 * @param {Object} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
export const FormSuccess = ({
  message,
  className = '',
  ...rest
}) => {
  if (!message) {
    return null;
  }
  
  return (
    <div 
      className={`p-4 mb-6 bg-green-900/20 border border-green-500 rounded-md ${className}`} 
      role="alert"
      {...rest}
    >
      <div className="flex">
        <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
        <p className="text-sm text-green-400">{message}</p>
      </div>
    </div>
  );
};-none">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>
      
      {/* Character counter */}
      {showCharCount && (
        <div className="mt-1 text-xs text-gray-400 text-right">
          {value.length}/{maxLength}
        </div>
      )}
      
      {/* Error message */}
      {hasError && (
        <p id={`${name}-error`} className="mt-1 text-sm text-red-500">
          {error}
        </p>
      )}
      
      {/* Help text */}
      {helpText && !hasError && (
        <p className="mt-1 text-xs text-gray-400">
          {helpText}
        </p>
      )}
    </div>
  );
};

/**
 * FormTextarea component for multi-line text input
 * @param {Object} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
export const FormTextarea = ({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  touched,
  required = false,
  disabled = false,
  className = '',
  rows = 4,
  maxLength,
  helpText,
  ...rest
}) => {
  const hasError = error && touched;
  
  const textareaClasses = `w-full p-3 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${
    hasError
      ? 'bg-red-900/20 border border-red-500 focus:ring-red-500'
      : 'bg-gray-700 border border-gray-600 focus:ring-blue-500'
  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`;
  
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={id || name} className="block text-sm font-medium text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <textarea
          id={id || name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          rows={rows}
          maxLength={maxLength}
          className={textareaClasses}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? `${name}-error` : undefined}
          {...rest}
        />
        
        {/* Error indicator */}
        {hasError && (
          <div className="absolute top-3 right-3 pointer-events-none">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>
      
      {/* Character counter */}
      {maxLength && (
        <div className="mt-1 text-xs text-gray-400 text-right">
          {value.length}/{maxLength}
        </div>
      )}
      
      {/* Error message */}
      {hasError && (
        <p id={`${name}-error`} className="mt-1 text-sm text-red-500">
          {error}
        </p>
      )}
      
      {/* Help text */}
      {helpText && !hasError && (
        <p className="mt-1 text-xs text-gray-400">
          {helpText}
        </p>
      )}
    </div>
  );
};

/**
 * FormSelect component for dropdown selection
 * @param {Object} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
export const FormSelect = ({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  options,
  error,
  touched,
  required = false,
  disabled = false,
  className = '',
  icon = null,
  helpText,
  placeholder = 'Select an option',
  ...rest
}) => {
  const hasError = error && touched;
  
  const selectClasses = `w-full py-3 ${icon ? 'pl-10' : 'pl-3'} pr-10 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent appearance-none bg-no-repeat ${
    hasError
      ? 'bg-red-900/20 border border-red-500 focus:ring-red-500'
      : 'bg-gray-700 border border-gray-600 focus:ring-blue-500'
  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`;
  
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={id || name} className="block text-sm font-medium text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {/* Select icon */}
        {icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        
        <select
          id={id || name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          className={selectClasses}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? `${name}-error` : undefined}
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundPosition: `right 0.5rem center`,
            backgroundSize: `1.5em 1.5em`
          }}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        {/* Error indicator */}
        {hasError && (
          <div className="absolute inset-y-0 right-8 flex items-center pointer-events-none">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>
      
      {/* Error message */}
      {hasError && (
        <p id={`${name}-error`} className="mt-1 text-sm text-red-500">
          {error}
        </p>
      )}
      
      {/* Help text */}
      {helpText && !hasError && (
        <p className="mt-1 text-xs text-gray-400">
          {helpText}
        </p>
      )}
    </div>
  );
};

/**
 * FormCheckbox component
 * @param {Object} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
export const FormCheckbox = ({
  id,
  name,
  label,
  checked,
  onChange,
  onBlur,
  error,
  touched,
  disabled = false,
  className = '',
  helpText,
  ...rest
}) => {
  const hasError = error && touched;
  
  return (
    <div className={`flex items-start mb-4 ${className}`}>
      <div className="flex items-center h-5">
        <input
          id={id || name}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? `${name}-error` : undefined}
          className={`w-4 h-4 rounded focus:ring-blue-500 focus:ring-offset-gray-800 ${
            hasError ? 'border-red-500 text-red-600' : 'border-gray-600 text-blue-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          {...rest}
        />
      </div>
      
      <div className="ml-3 text-sm">
        {label && (
          <label htmlFor={id || name} className={`font-medium ${disabled ? 'text-gray-500' : 'text-gray-300'}`}>
            {label}
          </label>
        )}
        
        {/* Error message */}
        {hasError && (
          <p id={`${name}-error`} className="mt-1 text-sm text-red-500">
            {error}
          </p>
        )}
        
        {/* Help text */}
        {helpText && !hasError && (
          <p className="mt-1 text-xs text-gray-400">
            {helpText}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * FormRadioGroup component
 * @param {Object} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
export const FormRadioGroup = ({
  id,
  name,
  label,
  options,
  value,
  onChange,
  onBlur,
  error,
  touched,
  disabled = false,
  className = '',
  inline = false,
  helpText,
  ...rest
}) => {
  const hasError = error && touched;
  
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <div className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </div>
      )}
      
      <div className={`space-y-2 ${inline ? 'flex flex-wrap gap-x-6 space-y-0' : ''}`}>
        {options.map((option) => (
          <div key={option.value} className={`flex items-center ${inline ? 'mr-4' : ''}`}>
            <input
              id={`${id || name}-${option.value}`}
              name={name}
              type="radio"
              value={option.value}
              checked={value === option.value}
              onChange={onChange}
              onBlur={onBlur}
              disabled={disabled || option.disabled}
              className={`w-4 h-4 focus:ring-blue-500 focus:ring-offset-gray-800 ${
                hasError ? 'border-red-500 text-red-600' : 'border-gray-600 text-blue-600'
              } ${(disabled || option.disabled) ? 'opacity-50 cursor-not-allowed' : ''}`}
              {...rest}
            />
            <label
              htmlFor={`${id || name}-${option.value}`}
              className={`ml-2 text-sm ${(disabled || option.disabled) ? 'text-gray-500' : 'text-gray-300'}`}
            >
              {option.label}
            </label>
          </div>
        ))}
      </div>
      
      {/* Error message */}
      {hasError && (
        <p id={`${name}-error`} className="mt-1 text-sm text-red-500">
          {error}
        </p>
      )}
      
      {/* Help text */}
      {helpText && !hasError && (
        <p className="mt-1 text-xs text-gray-400">
          {helpText}
        </p>
      )}
    </div>
  );
};

/**
 * FormSwitch component (toggle)
 * @param {Object} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
export const FormSwitch = ({
  id,
  name,
  label,
  checked,
  onChange,
  onBlur,
  error,
  touched,
  disabled = false,
  className = '',
  helpText,
  ...rest
}) => {
  const hasError = error && touched;
  
  return (
    <div className={`flex items-start mb-4 ${className}`}>
      <div className="flex items-center h-5">
        <button
          id={id || name}
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => !disabled && onChange({ target: { name, checked: !checked } })}
          onBlur={onBlur}
          disabled={disabled}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? `${name}-error` : undefined}
          className={`relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${
            hasError 
              ? 'focus:ring-red-500'
              : 'focus:ring-blue-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          style={{ backgroundColor: checked ? '#3B82F6' : '#374151' }}
          {...rest}
        >
          <span className="sr-only">{label}</span>
          <span
            className={`${
              checked ? 'translate-x-6' : 'translate-x-1'
            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
          />
        </button>
      </div>
      
      <div className="ml-3 text-sm">
        {label && (
          <label htmlFor={id || name} className={`font-medium ${disabled ? 'text-gray-500' : 'text-gray-300'}`}>
            {label}
          </label>
        )}
        
        {/* Error message */}
        {hasError && (
          <p id={`${name}-error`} className="mt-1 text-sm text-red-500">
            {error}
          </p>
        )}
        
        {/* Help text */}
        {helpText && !hasError && (
          <p className="mt-1 text-xs text-gray-400">
            {helpText}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * FormDatePicker component
 * @param {Object} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
export const FormDatePicker = ({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  disabled = false,
  className = '',
  min,
  max,
  helpText,
  ...rest
}) => {
  const hasError = error && touched;
  
  const inputClasses = `w-full py-3 pl-10 pr-3 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${
    hasError
      ? 'bg-red-900/20 border border-red-500 focus:ring-red-500'
      : 'bg-gray-700 border border-gray-600 focus:ring-blue-500'
  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`;
  
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={id || name} className="block text-sm font-medium text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
          <Calendar size={18} />
        </div>
        
        <input
          id={id || name}
          name={name}
          type="date"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          min={min}
          max={max}
          className={inputClasses}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? `${name}-error` : undefined}
          {...rest}
        />
        
        {/* Error indicator */}
        {hasError && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events