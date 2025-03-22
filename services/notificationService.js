const emailService = require('./emailService');
const User = require('../models/user');
const Activity = require('../models/activity');
const Log = require('../models/log');
const Goal = require('../models/goal');
const Achievement = require('../models/achievement');
require('dotenv').config({ path: './config.env' });

class NotificationService {
  constructor() {
    this.weeklyReportScheduled = false;
    this.reminderScheduled = false;
  }

  /**
   * Initialize notification service
   * Start scheduled tasks
   */
  init() {
    // Schedule weekly reports (every Sunday at 8:00 AM)
    this.scheduleWeeklyReports();
    
    // Schedule daily reminders (every day at 8:00 AM)
    this.scheduleDailyReminders();
    
    console.log('Notification service initialized');
  }

  /**
   * Schedule weekly reports
   */
  scheduleWeeklyReports() {
    if (this.weeklyReportScheduled) return;
    
    // Calculate time until next Sunday at 8:00 AM
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + daysUntilSunday);
    nextSunday.setHours(8, 0, 0, 0);
    
    // If today is Sunday and it's past 8:00 AM, schedule for next Sunday
    if (dayOfWeek === 0 && now.getHours() >= 8) {
      nextSunday.setDate(nextSunday.getDate() + 7);
    }
    
    // Calculate milliseconds until next Sunday at 8:00 AM
    const msUntilSunday = nextSunday.getTime() - now.getTime();
    
    // Schedule weekly reports
    setTimeout(() => {
      this.sendWeeklyReports();
      
      // Schedule again for next week
      setInterval(() => {
        this.sendWeeklyReports();
      }, 7 * 24 * 60 * 60 * 1000); // 7 days
      
      this.weeklyReportScheduled = true;
    }, msUntilSunday);
    
    console.log(`Weekly reports scheduled to start in ${Math.round(msUntilSunday / (60 * 60 * 1000))} hours`);
  }

  /**
   * Schedule daily reminders
   */
  scheduleDailyReminders() {
    if (this.reminderScheduled) return;
    
    // Calculate time until next 8:00 AM
    const now = new Date();
    const next8AM = new Date(now);
    next8AM.setHours(8, 0, 0, 0);
    
    // If it's past 8:00 AM, schedule for tomorrow
    if (now.getHours() >= 8) {
      next8AM.setDate(next8AM.getDate() + 1);
    }
    
    // Calculate milliseconds until next 8:00 AM
    const msUntil8AM = next8AM.getTime() - now.getTime();
    
    // Schedule daily reminders
    setTimeout(() => {
      this.sendDailyReminders();
      
      // Schedule again for next day
      setInterval(() => {
        this.sendDailyReminders();
      }, 24 * 60 * 60 * 1000); // 24 hours
      
      this.reminderScheduled = true;
    }, msUntil8AM);
    
    console.log(`Daily reminders scheduled to start in ${Math.round(msUntil8AM / (60 * 60 * 1000))} hours`);
  }

  /**
   * Send weekly reports to all users
   */
  async sendWeeklyReports() {
    try {
      console.log('Sending weekly reports...');
      
      // Get all users with an email address
      const users = await this.getUsersWithEmail();
      
      for (const user of users) {
        await this.sendWeeklyReportToUser(user);
      }
      
      console.log(`Weekly reports sent to ${users.length} users`);
    } catch (error) {
      console.error('Error sending weekly reports:', error);
    }
  }

  /**
   * Send daily reminders to users with scheduled activities
   */
  async sendDailyReminders() {
    try {
      console.log('Sending daily reminders...');
      
      // Get all users with an email address
      const users = await this.getUsersWithEmail();
      
      let remindersSent = 0;
      
      for (const user of users) {
        const reminded = await this.sendReminderToUser(user);
        if (reminded) remindersSent++;
      }
      
      console.log(`Daily reminders sent to ${remindersSent} users`);
    } catch (error) {
      console.error('Error sending daily reminders:', error);
    }
  }

  /**
   * Send welcome email to a new user
   * @param {Object} user - User object
   * @returns {Promise<boolean>} True if email was sent
   */
  async sendWelcomeEmail(user) {
    try {
      if (!user.email) return false;
      
      await emailService.sendWelcomeEmail(user.email, user.username);
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  }

  /**
   * Send goal achievement notification
   * @param {Object} user - User object
   * @param {Object} goal - Goal object
   * @param {Object} progress - Goal progress object
   * @returns {Promise<boolean>} True if email was sent
   */
  async sendGoalAchievedNotification(user, goal, progress) {
    try {
      if (!user.email) return false;
      
      // Skip if goal is not completed
      if (!progress.completed) return false;
      
      // Get activity details
      const activity = await Activity.getById(goal.activity_type_id);
      
      // Format goal data
      const goalData = {
        name: activity.name,
        target: goal.target_count,
        unit: activity.unit,
        periodType: this.formatPeriodType(goal.period_type)
      };
      
      await emailService.sendGoalAchievedEmail(user.email, user.username, goalData);
      return true;
    } catch (error) {
      console.error('Error sending goal achieved notification:', error);
      return false;
    }
  }

  /**
   * Send achievement notification
   * @param {Object} user - User object
   * @param {Object} achievement - Achievement object with type info
   * @returns {Promise<boolean>} True if email was sent
   */
  async sendAchievementNotification(user, achievement) {
    try {
      if (!user.email) return false;
      
      await emailService.sendAchievementEmail(user.email, user.username, achievement);
      return true;
    } catch (error) {
      console.error('Error sending achievement notification:', error);
      return false;
    }
  }

  /**
   * Send weekly report to a specific user
   * @param {Object} user - User object
   * @returns {Promise<boolean>} True if email was sent
   */
  async sendWeeklyReportToUser(user) {
    try {
      if (!user.email) return false;
      
      // Get user's activities
      const activities = await Activity.getAllForUser(user.user_id);
      
      // Get activity stats
      const activityStats = await Promise.all(
        activities.map(async (activity) => {
          // Get this week's total
          const weekResult = await this.getWeeklyTotal(user.user_id, activity.activity_type_id);
          
          // Get last week's total
          const lastWeekResult = await this.getLastWeekTotal(user.user_id, activity.activity_type_id);
          
          // Calculate change
          const change = weekResult - lastWeekResult;
          const percentChange = lastWeekResult > 0 ? 
            Math.round((change / lastWeekResult) * 100) : 0;
          
          return {
            name: activity.name,
            unit: activity.unit,
            week: weekResult,
            lastWeek: lastWeekResult,
            change,
            percentChange
          };
        })
      );
      
      // Filter out activities with no data
      const activeActivities = activityStats.filter(a => a.week > 0 || a.lastWeek > 0);
      
      if (activeActivities.length === 0) {
        console.log(`No active activities for user ${user.username}, skipping weekly report`);
        return false;
      }
      
      // Get user's goals
      const userGoals = await Goal.getAllForUser(user.user_id);
      
      // Get goal progress
      const goalProgress = await Promise.all(
        userGoals.map(async (goal) => {
          const progress = await Goal.getProgress(goal.goal_id);
          const activity = await Activity.getById(goal.activity_type_id);
          
          return {
            name: activity.name,
            target: goal.target_count,
            unit: activity.unit,
            periodType: this.formatPeriodType(goal.period_type),
            current: progress.currentCount,
            progress: progress.progressPercent,
            remaining: progress.remaining
          };
        })
      );
      
      // Send the email
      await emailService.sendWeeklyReport(
        user.email, 
        user.username, 
        activeActivities, 
        goalProgress
      );
      
      return true;
    } catch (error) {
      console.error(`Error sending weekly report to ${user.username}:`, error);
      return false;
    }
  }

  /**
   * Send daily reminder to a specific user if they have scheduled activities
   * @param {Object} user - User object
   * @returns {Promise<boolean>} True if email was sent
   */
  async sendReminderToUser(user) {
    try {
      if (!user.email) return false;
      
      // Get user's active goals
      const userGoals = await Goal.getAllForUser(user.user_id);
      const activeGoals = userGoals.filter(goal => {
        const now = new Date();
        const startDate = new Date(goal.start_date);
        const endDate = new Date(goal.end_date);
        
        return startDate <= now && now <= endDate;
      });
      
      if (activeGoals.length === 0) {
        return false;
      }
      
      // Get activities with daily goals
      const activitiesWithGoals = await Promise.all(
        activeGoals.map(async (goal) => {
          // Only remind about daily goals
          if (goal.period_type !== 'daily') return null;
          
          const activity = await Activity.getById(goal.activity_type_id);
          
          // Check if user has already logged this activity today
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const todayLogs = await Log.getForActivity(user.user_id, activity.activity_type_id);
          const loggedToday = todayLogs.some(log => {
            const logDate = new Date(log.logged_at);
            return logDate >= today;
          });
          
          // Skip if already logged today
          if (loggedToday) return null;
          
          return {
            name: activity.name,
            goal: goal.target_count,
            unit: activity.unit
          };
        })
      );
      
      // Filter out null values and activities already logged
      const activitiesToRemind = activitiesWithGoals.filter(a => a !== null);
      
      if (activitiesToRemind.length === 0) {
        return false;
      }
      
      // Send the reminder
      await emailService.sendActivityReminder(
        user.email,
        user.username,
        activitiesToRemind
      );
      
      return true;
    } catch (error) {
      console.error(`Error sending reminder to ${user.username}:`, error);
      return false;
    }
  }

  /**
   * Get all users with an email address
   * @returns {Promise<Array>} Array of user objects
   */
  async getUsersWithEmail() {
    try {
      // Query to get all users with email addresses
      const query = `
        SELECT user_id, username, email 
        FROM users 
        WHERE email IS NOT NULL AND email <> ''
      `;
      
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting users with email:', error);
      return [];
    }
  }

  /**
   * Get weekly total for an activity
   * @param {number} userId - User ID
   * @param {number} activityTypeId - Activity Type ID
   * @returns {Promise<number>} Weekly total
   */
  async getWeeklyTotal(userId, activityTypeId) {
    try {
      // Get this week's total (Sunday to Saturday)
      const query = `
        SELECT COALESCE(SUM(count), 0) as total
        FROM activity_logs 
        WHERE user_id = $1 
          AND activity_type_id = $2 
          AND logged_at >= DATE_TRUNC('week', CURRENT_DATE) 
          AND logged_at < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'
      `;
      
      const result = await pool.query(query, [userId, activityTypeId]);
      return parseFloat(result.rows[0].total);
    } catch (error) {
      console.error('Error getting weekly total:', error);
      return 0;
    }
  }

  /**
   * Get last week's total for an activity
   * @param {number} userId - User ID
   * @param {number} activityTypeId - Activity Type ID
   * @returns {Promise<number>} Last week's total
   */
  async getLastWeekTotal(userId, activityTypeId) {
    try {
      // Get last week's total (previous Sunday to Saturday)
      const query = `
        SELECT COALESCE(SUM(count), 0) as total
        FROM activity_logs 
        WHERE user_id = $1 
          AND activity_type_id = $2 
          AND logged_at >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '7 days'
          AND logged_at < DATE_TRUNC('week', CURRENT_DATE)
      `;
      
      const result = await pool.query(query, [userId, activityTypeId]);
      return parseFloat(result.rows[0].total);
    } catch (error) {
      console.error('Error getting last week total:', error);
      return 0;
    }
  }

  /**
   * Format period type for display
   * @param {string} periodType - Period type
   * @returns {string} Formatted period type
   */
  formatPeriodType(periodType) {
    switch (periodType) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      case 'yearly':
        return 'Yearly';
      default:
        return periodType;
    }
  }
}

// Create and export a singleton instance
const notificationService = new NotificationService();
module.exports = notificationService;
