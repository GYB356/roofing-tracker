// src/tests/components/auth/Login.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../../contexts/AuthContext';
import Login from '../../../components/auth/Login';

// Mock the navigation hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ state: { from: { pathname: '/' } } })
}));

// Mock AuthContext functions
const mockLogin = jest.fn();
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin
  }),
  AuthProvider: ({ children }) => <div>{children}</div>
}));

describe('Login Component', () => {
  beforeEach(() => {
    mockLogin.mockClear();
  });

  test('renders login form correctly', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByText(/Sign in to your account/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/Don't have an account?/i)).toBeInTheDocument();
    expect(screen.getByText(/Create a new account/i)).toBeInTheDocument();
  });

  test('shows validation errors for empty fields', async () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));

    expect(await screen.findByText(/Please enter both email and password/i)).toBeInTheDocument();
  });

  test('calls login function with correct credentials', async () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Email address/i), {
      target: { value: 'test@example.com' }
    });

    fireEvent.change(screen.getByPlaceholderText(/Password/i), {
      target: { value: 'password123' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        false, // rememberMe
        'patient' // default role
      );
    });
  });

  test('toggles between login and register views', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Initially on login view
    expect(screen.getByText(/Sign in to your account/i)).toBeInTheDocument();

    // Click to switch to register view
    fireEvent.click(screen.getByText(/Create a new account/i));

    // Now should be on register view
    expect(screen.getByText(/Create a new account/i, { selector: 'h2' })).toBeInTheDocument();

    // Click to switch back to login view
    fireEvent.click(screen.getByText(/Sign in/i, { selector: 'button span' }));

    // Back on login view
    expect(screen.getByText(/Sign in to your account/i)).toBeInTheDocument();
  });

  test('changes selected role correctly', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Default role should be 'patient'
    const patientButton = screen.getByRole('button', { name: /Patient/i });
    expect(patientButton).toHaveClass('bg-blue-600');

    // Click provider role
    fireEvent.click(screen.getByRole('button', { name: /Provider/i }));
    expect(screen.getByRole('button', { name: /Provider/i })).toHaveClass('bg-blue-600');
    expect(patientButton).not.toHaveClass('bg-blue-600');

    // Click admin role
    fireEvent.click(screen.getByRole('button', { name: /Admin/i }));
    expect(screen.getByRole('button', { name: /Admin/i })).toHaveClass('bg-blue-600');
    expect(screen.getByRole('button', { name: /Provider/i })).not.toHaveClass('bg-blue-600');
  });

  test('handles remember me checkbox correctly', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const rememberMeCheckbox = screen.getByLabelText(/Remember me/i);
    expect(rememberMeCheckbox).not.toBeChecked();

    fireEvent.click(rememberMeCheckbox);
    expect(rememberMeCheckbox).toBeChecked();
  });
});

// src/tests/components/auth/ForgotPassword.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ForgotPassword from '../../../components/auth/ForgotPassword';

// Mock the AuthContext
const mockResetPassword = jest.fn();
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    resetPassword: mockResetPassword
  })
}));

describe('ForgotPassword Component', () => {
  beforeEach(() => {
    mockResetPassword.mockClear();
  });

  test('renders forgot password form correctly', () => {
    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );

    expect(screen.getByText(/Reset Password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Reset Link/i })).toBeInTheDocument();
    expect(screen.getByText(/Back to login/i)).toBeInTheDocument();
  });

  test('shows validation error for empty email', async () => {
    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Send Reset Link/i }));

    expect(await screen.findByText(/Please enter your email address/i)).toBeInTheDocument();
  });

  test('calls resetPassword with correct email', async () => {
    mockResetPassword.mockResolvedValueOnce({ success: true });

    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Email address/i), {
      target: { value: 'test@example.com' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Send Reset Link/i }));

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('test@example.com');
    });
  });

  test('shows success message after sending reset link', async () => {
    mockResetPassword.mockResolvedValueOnce({ success: true });

    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Email address/i), {
      target: { value: 'test@example.com' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Send Reset Link/i }));

    expect(await screen.findByText(/Reset link sent!/i)).toBeInTheDocument();
    expect(screen.getByText(/Didn't receive an email?/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Resend Email/i })).toBeInTheDocument();
  });

  test('handles reset password error correctly', async () => {
    const errorMessage = 'Email not found';
    mockResetPassword.mockRejectedValueOnce(new Error(errorMessage));

    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Email address/i), {
      target: { value: 'test@example.com' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Send Reset Link/i }));

    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
  });
});

// src/tests/components/auth/ResetPassword.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ResetPassword from '../../../components/auth/ResetPassword';

// Mock the useParams hook to provide a token
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ token: 'test-token' }),
  useNavigate: () => jest.fn()
}));

// Mock the AuthContext
const mockConfirmPasswordReset = jest.fn();
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    confirmPasswordReset: mockConfirmPasswordReset
  })
}));

describe('ResetPassword Component', () => {
  beforeEach(() => {
    mockConfirmPasswordReset.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders reset password form correctly', () => {
    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    expect(screen.getByText(/Create New Password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/New password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Confirm new password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reset Password/i })).toBeInTheDocument();
    expect(screen.getByText(/Back to login/i)).toBeInTheDocument();
  });

  test('validates password and confirmation must match', async () => {
    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/New password/i), {
      target: { value: 'Password123!' }
    });

    fireEvent.change(screen.getByPlaceholderText(/Confirm new password/i), {
      target: { value: 'DifferentPassword!' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Reset Password/i }));

    expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
  });

  test('validates password minimum length', async () => {
    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/New password/i), {
      target: { value: 'short' }
    });

    fireEvent.change(screen.getByPlaceholderText(/Confirm new password/i), {
      target: { value: 'short' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Reset Password/i }));

    expect(await screen.findByText(/Password must be at least 8 characters long/i)).toBeInTheDocument();
  });

  test('calls confirmPasswordReset with correct data', async () => {
    mockConfirmPasswordReset.mockResolvedValueOnce({ success: true });

    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/New password/i), {
      target: { value: 'NewSecurePassword123!' }
    });

    fireEvent.change(screen.getByPlaceholderText(/Confirm new password/i), {
      target: { value: 'NewSecurePassword123!' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Reset Password/i }));

    await waitFor(() => {
      expect(mockConfirmPasswordReset).toHaveBeenCalledWith(
        'test-token',
        'NewSecurePassword123!'
      );
    });
  });

  test('shows success message after password reset', async () => {
    mockConfirmPasswordReset.mockResolvedValueOnce({ success: true });

    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/New password/i), {
      target: { value: 'NewSecurePassword123!' }
    });

    fireEvent.change(screen.getByPlaceholderText(/Confirm new password/i), {
      target: { value: 'NewSecurePassword123!' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Reset Password/i }));

    expect(await screen.findByText(/Password successfully reset/i)).toBeInTheDocument();
  });

  test('handles password reset error correctly', async () => {
    const errorMessage = 'Invalid or expired token';
    mockConfirmPasswordReset.mockRejectedValueOnce(new Error(errorMessage));

    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/New password/i), {
      target: { value: 'NewSecurePassword123!' }
    });

    fireEvent.change(screen.getByPlaceholderText(/Confirm new password/i), {
      target: { value: 'NewSecurePassword123!' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Reset Password/i }));

    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
  });
});

// src/tests/hooks/useFormValidation.test.js
import { renderHook, act } from '@testing-library/react-hooks';
import useFormValidation from '../../../hooks/useFormValidation';

describe('useFormValidation Hook', () => {
  const initialValues = {
    email: '',
    password: ''
  };

  const validate = (values) => {
    const errors = {};
    
    if (!values.email) {
      errors.email = 'Email is required';
    }
    
    if (!values.password) {
      errors.password = 'Password is required';
    }
    
    return errors;
  };

  const onSubmit = jest.fn();

  test('initializes with correct values and state', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validate, onSubmit)
    );

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({ email: 'Email is required', password: 'Password is required' });
    expect(result.current.touched).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isValid).toBe(false);
  });

  test('updates values correctly on change', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validate, onSubmit)
    );

    act(() => {
      result.current.handleChange({
        target: { name: 'email', value: 'test@example.com' }
      });
    });

    expect(result.current.values.email).toBe('test@example.com');
    expect(result.current.errors).toEqual({ password: 'Password is required' });
  });

  test('marks all fields as touched and submits when valid', async () => {
    const validInitialValues = {
      email: 'test@example.com',
      password: 'password123'
    };

    const { result, waitForNextUpdate } = renderHook(() => 
      useFormValidation(validInitialValues, validate, onSubmit)
    );

    act(() => {
      result.current.handleSubmit();
    });

    await waitForNextUpdate();

    expect(result.current.touched).toEqual({
      email: true,
      password: true
    });
    expect(result.current.isValid).toBe(true);
    expect(onSubmit).toHaveBeenCalledWith(validInitialValues);
  });

  test('does not submit when invalid', async () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validate, onSubmit)
    );

    act(() => {
      result.current.handleSubmit();
    });

    // No need to wait for next update as it won't happen

    expect(result.current.touched).toEqual({
      email: true,
      password: true
    });
    expect(result.current.isValid).toBe(false);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('resets form correctly', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validate, onSubmit)
    );

    act(() => {
      result.current.handleChange({
        target: { name: 'email', value: 'test@example.com' }
      });
      
      result.current.handleBlur({
        target: { name: 'email' }
      });
    });

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.touched).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
  });

  test('sets field value directly', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validate, onSubmit)
    );

    act(() => {
      result.current.setFieldValue('email', 'test@example.com');
    });

    expect(result.current.values.email).toBe('test@example.com');
    expect(result.current.touched.email).toBe(true);
  });

  test('correctly determines if error should be shown', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validate, onSubmit)
    );

    expect(result.current.shouldShowError('email')).toBe(false);

    act(() => {
      result.current.handleBlur({
        target: { name: 'email' }
      });
    });

    expect(result.current.shouldShowError('email')).toBe(true);
  });
});

// src/tests/services/authService.test.js
import authService from '../../../services/authService';
import api from '../../../services/api';

// Mock the api module
jest.mock('../../../services/api');

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    test('successfully logs in a user', async () => {
      const mockResponse = { 
        data: { 
          user: { id: '123', email: 'test@example.com' },
          token: 'fake-token'
        } 
      };
      
      api.post.mockResolvedValueOnce(mockResponse);

      const result = await authService.login('test@example.com', 'password123', 'patient');
      
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
        role: 'patient'
      });
      
      expect(result).toEqual(mockResponse.data);
    });

    test('handles login error correctly', async () => {
      const errorResponse = {
        response: {
          status: 401,
          data: { message: 'Invalid credentials' }
        }
      };
      
      api.post.mockRejectedValueOnce(errorResponse);

      await expect(authService.login('test@example.com', 'wrong-password', 'patient'))
        .rejects
        .toThrow('Invalid credentials. Please check your email and password.');
    });
  });

  describe('register', () => {
    test('successfully registers a new user', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'patient'
      };
      
      const mockResponse = { 
        data: { 
          success: true,
          message: 'Registration successful'
        } 
      };
      
      api.post.mockResolvedValueOnce(mockResponse);

      const result = await authService.register(userData);
      
      expect(api.post).toHaveBeenCalledWith('/auth/register', userData);
      expect(result).toEqual(mockResponse.data);
    });

    test('handles registration error correctly', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@example.com',
        password: 'password123',
        role: 'patient'
      };
      
      const errorResponse = {
        response: {
          status: 409,
          data: { message: 'Email already exists' }
        }
      };
      
      api.post.mockRejectedValueOnce(errorResponse);

      await expect(authService.register(userData))
        .rejects
        .toThrow('Account already exists with this email address.');
    });
  });

  describe('resetPassword', () => {
    test('successfully requests password reset', async () => {
      const mockResponse = { 
        data: { 
          success: true,
          message: 'Reset link sent to your email'
        } 
      };
      
      api.post.mockResolvedValueOnce(mockResponse);

      const result = await authService.resetPassword('test@example.com');
      
      expect(api.post).toHaveBeenCalledWith('/auth/reset-password', { email: 'test@example.com' });
      expect(result).toEqual(mockResponse.data);
    });

    test('handles reset password error correctly', async () => {
      const errorResponse = {
        response: {
          status: 404,
          data: { message: 'Email not found' }
        }
      };
      
      api.post.mockRejectedValueOnce(errorResponse);

      await expect(authService.resetPassword('nonexistent@example.com'))
        .rejects
        .toThrow('Account not found. Please check your details or register.');
    });
  });

  describe('confirmPasswordReset', () => {
    test('successfully resets password', async () => {
      const mockResponse = { 
        data: { 
          success: true,
          message: 'Password reset successful'
        } 
      };
      
      api.post.mockResolvedValueOnce(mockResponse);

      const result = await authService.confirmPasswordReset('valid-token', 'newPassword123');
      
      expect(api.post).toHaveBeenCalledWith('/auth/reset-password/confirm', {
        token: 'valid-token',
        newPassword: 'newPassword123'
      });
      
      expect(result).toEqual(mockResponse.data);
    });

    test('handles invalid token error correctly', async () => {
      const errorResponse = {
        response: {
          status: 400,
          data: { message: 'Invalid or expired token' }
        }
      };
      
      api.post.mockRejectedValueOnce(errorResponse);

      await expect(authService.confirmPasswordReset('invalid-token', 'newPassword123'))
        .rejects
        .toThrow('Invalid or expired token');
    });
  });

  describe('logout', () => {
    test('successfully logs out user', async () => {
      const mockResponse = { 
        data: { 
          success: true,
          message: 'Logged out successfully'
        } 
      };
      
      api.post.mockResolvedValueOnce(mockResponse);

      const result = await authService.logout();
      
      expect(api.post).toHaveBeenCalledWith('/auth/logout');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getCurrentUser', () => {
    test('successfully retrieves current user', async () => {
      const mockResponse = { 
        data: { 
          id: '123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'patient'
        } 
      };
      
      api.get.mockResolvedValueOnce(mockResponse);

      const result = await authService.getCurrentUser();
      
      expect(api.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockResponse.data);
    });

    test('handles unauthenticated error correctly', async () => {
      const errorResponse = {
        response: {
          status: 401,
          data: { message: 'Unauthenticated' }
        }
      };
      
      api.get.mockRejectedValueOnce(errorResponse);

      await expect(authService.getCurrentUser())
        .rejects
        .toThrow('Invalid credentials. Please check your email and password.');
    });
  });
});

// src/tests/utils/validation.test.js
import * as validation from '../../../utils/validation';

describe('Validation Utilities', () => {
  describe('isValidEmail', () => {
    test('validates correct email formats', () => {
      expect(validation.isValidEmail('test@example.com')).toBe(true);
      expect(validation.isValidEmail('user.name+tag@example.co.uk')).toBe(true);
      expect(validation.isValidEmail('user-name@domain.org')).toBe(true);
    });

    test('rejects invalid email formats', () => {
      expect(validation.isValidEmail('test')).toBe(false);
      expect(validation.isValidEmail('test@')).toBe(false);
      expect(validation.isValidEmail('test@domain')).toBe(false);
      expect(validation.isValidEmail('@domain.com')).toBe(false);
      expect(validation.isValidEmail('test@domain.')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    test('validates strong passwords', () => {
      const result = validation.validatePassword('StrongP@ss123');
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe(5);
    });

    test('identifies weak passwords', () => {
      const result = validation.validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.strength).toBeLessThan(3);
    });

    test('provides correct feedback for missing requirements', () => {
      const result = validation.validatePassword('onlyletters');
      expect(result.requirements).toContain('At least one uppercase letter');
      expect(result.requirements).toContain('At least one number');
      expect(result.requirements).toContain('At least one special character');
    });

    test('checks specific password characteristics', () => {
      const result = validation.validatePassword('Abc123');
      expect(result.checks.minLength).toBe(false);
      expect(result.checks.hasUppercase).toBe(true);
      expect(result.checks.hasLowercase).toBe(true);
      expect(result.checks.hasNumber).toBe(true);
      expect(result.checks.hasSpecialChar).toBe(false);
    });
  });

  describe('passwordsMatch', () => {
    test('confirms matching passwords', () => {
      expect(validation.passwordsMatch('password123', 'password123')).toBe(true);
    });

    test('detects non-matching passwords', () => {
      expect(validation.passwordsMatch('password123', 'Password123')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    test('validates correct phone number formats', () => {
      expect(validation.isValidPhone('(123) 456-7890')).toBe(true);
      expect(validation.isValidPhone('123-456-7890')).toBe(true);
      expect(validation.isValidPhone('123.456.7890')).toBe(true);
      expect(validation.isValidPhone('1234567890')).toBe(true);
    });

    test('rejects invalid phone number formats', () => {
      expect(validation.isValidPhone('123-456-789')).toBe(false);
      expect(validation.isValidPhone('12345678901')).toBe(false);
      expect(validation.isValidPhone('abc-def-ghij')).toBe(false);
      expect(validation.isValidPhone('123 456 789')).toBe(false);
    });
  });

  describe('isValidDate', () => {
    test('validates correct date formats', () => {
      expect(validation.isValidDate('2023-01-31')).toBe(true);
      expect(validation.isValidDate('2020-02-29')).toBe(true); // Leap year
      expect(validation.isValidDate('2023-12-31')).toBe(true);
    });

    test('rejects invalid date formats', () => {
      expect(validation.isValidDate('01/31/2023')).toBe(false);
      expect(validation.isValidDate('2023-13-01')).toBe(false); // Invalid month
      expect(validation.isValidDate('2023-02-31')).toBe(false); // Invalid day
      expect(validation.isValidDate('2023-04-31')).toBe(false); // April has 30 days
      expect(validation.isValidDate('2023-02-29')).toBe(false); // Not a leap year
    });
  });

  describe('isValidCreditCard', () => {
    test('validates correct credit card formats', () => {
      // Valid test numbers (these are test numbers, not real cards)
      expect(validation.isValidCreditCard('4111 1111 1111 1111')).toBe(true); // Visa
      expect(validation.isValidCreditCard('5555555555554444')).toBe(true); // Mastercard
      expect(validation.isValidCreditCard('378282246310005')).toBe(true); // Amex
    });

    test('rejects invalid credit card formats', () => {
      expect(validation.isValidCreditCard('1234 5678 9012 3456')).toBe(false); // Invalid checksum
      expect(validation.isValidCreditCard('123456789012')).toBe(false); // Too short
      expect(validation.isValidCreditCard('12345678901234567890')).toBe(false); // Too long
      expect(validation.isValidCreditCard('abcd efgh ijkl mnop')).toBe(false); // Not numeric
    });
  });

  describe('isRequired', () => {
    test('validates non-empty values', () => {
      expect(validation.isRequired('test')).toBe(true);
      expect(validation.isRequired('0')).toBe(true);
    });

    test('rejects empty values', () => {
      expect(validation.isRequired('')).toBe(false);
      expect(validation.isRequired('  ')).toBe(false);
      expect(validation.isRequired(undefined)).toBe(false);
      expect(validation.isRequired(null)).toBe(false);
    });
  });
});'Password is required' });
  });

  test('marks fields as touched on blur', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validate, onSubmit)
    );

    act(() => {
      result.current.handleBlur({
        target: { name: 'email' }
      });
    });

    expect(result.current.touched).toEqual({ email: true });
  });

  test('validates when values change', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validate, onSubmit)
    );

    act(() => {
      result.current.handleChange({
        target: { name: 'email', value: 'test@example.com' }
      });
    });

    expect(result.current.errors).toEqual({ password: