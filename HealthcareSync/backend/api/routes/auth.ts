
import express from 'express';
import { AuthService } from '../../services/auth-service';
import { validateRegistration, validateLogin } from '../../utils/validators';

const router = express.Router();

// Register new user
router.post('/register', validateRegistration, async (req, res, next) => {
  try {
    const { email, password, fullName, role } = req.body;
    const result = await AuthService.registerUser({ email, password, fullName, role });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// Login user
router.post('/login', validateLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.loginUser(email, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Logout user
router.post('/logout', async (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// Get current user
router.get('/me', async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    res.json(req.user);
  } catch (error) {
    next(error);
  }
});

export default router;
import express from 'express';
import { AuthService } from '../../services/auth-service';
import { requireAuth } from '../../middleware/auth';

const router = express.Router();

// Register
router.post('/register', async (req, res, next) => {
  try {
    const result = await AuthService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    
    // Set cookie
    res.cookie('jwt', result.token, {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.cookie('jwt', '', {
    expires: new Date(Date.now() - 1000),
    httpOnly: true
  });
  
  res.json({ message: 'Logged out successfully' });
});

// Get current user
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await AuthService.getProfile(req.user.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

export default router;
