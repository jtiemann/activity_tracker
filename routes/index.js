const express = require('express');
const authRoutes = require('./authRoutes');
const activityRoutes = require('./activityRoutes');
const logRoutes = require('./logRoutes');
const goalRoutes = require('./goalRoutes');
const achievementRoutes = require('./achievementRoutes');
const authController = require('../controllers/authController');

const router = express.Router();

// API Routes
router.use('/api/auth', authRoutes);
router.use('/api/activities', activityRoutes);
router.use('/api/logs', logRoutes);
router.use('/api/goals', goalRoutes);
router.use('/api/achievements', achievementRoutes);

// Add a legacy route for backward compatibility
router.post('/api/login', authController.login);

// Health check endpoint
router.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Debug endpoint to check routes
router.get('/api/routes', (req, res) => {
  try {
    const routes = {
      auth: Object.keys(authRoutes.stack).map(k => authRoutes.stack[k].route?.path).filter(Boolean),
      activities: Object.keys(activityRoutes.stack).map(k => activityRoutes.stack[k].route?.path).filter(Boolean),
      logs: Object.keys(logRoutes.stack).map(k => logRoutes.stack[k].route?.path).filter(Boolean),
      goals: Object.keys(goalRoutes.stack).map(k => goalRoutes.stack[k].route?.path).filter(Boolean),
      achievements: Object.keys(achievementRoutes.stack).map(k => achievementRoutes.stack[k].route?.path).filter(Boolean)
    };
    res.json(routes);
  } catch (err) {
    res.status(500).json({ error: 'Could not retrieve routes', details: err.message });
  }
});

module.exports = router;