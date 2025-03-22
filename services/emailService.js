const nodemailer = require('nodemailer');
require('dotenv').config({ path: './config.env' });

class EmailService {
  constructor() {
    // Create reusable transporter object with SMTP configuration
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.example.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER || 'user@example.com',
        pass: process.env.EMAIL_PASSWORD || 'password'
      }
    });
  }

  /**
   * Send an email
   * @param {string} to - Recipient email address
   * @param {string} subject - Email subject
   * @param {string} text - Plain text email body
   * @param {string} html - HTML email body
   * @returns {Promise<Object>} Email send result
   */
  async sendEmail(to, subject, text, html) {
    try {
      // Define email options
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"Activity Tracker" <noreply@activitytracker.app>',
        to,
        subject,
        text,
        html
      };
      
      // Send email
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Send a welcome email
   * @param {string} to - Recipient email address
   * @param {string} username - User's username
   * @returns {Promise<Object>} Email send result
   */
  async sendWelcomeEmail(to, username) {
    const subject = 'Welcome to Activity Tracker!';
    
    const text = `
      Hello ${username},
      
      Welcome to Activity Tracker! We're excited to have you on board.
      
      With Activity Tracker, you can:
      - Track multiple activities with custom units
      - Set goals and earn achievements
      - View statistics and visualize your progress
      - Export your data to CSV or PDF
      
      Let us know if you have any questions or feedback.
      
      Best regards,
      The Activity Tracker Team
    `;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4361ee;">Welcome to Activity Tracker!</h1>
        <p>Hello ${username},</p>
        <p>Welcome to Activity Tracker! We're excited to have you on board.</p>
        <p>With Activity Tracker, you can:</p>
        <ul>
          <li>Track multiple activities with custom units</li>
          <li>Set goals and earn achievements</li>
          <li>View statistics and visualize your progress</li>
          <li>Export your data to CSV or PDF</li>
        </ul>
        <p>Let us know if you have any questions or feedback.</p>
        <p>Best regards,<br>The Activity Tracker Team</p>
      </div>
    `;
    
    return await this.sendEmail(to, subject, text, html);
  }

  /**
   * Send a weekly progress report
   * @param {string} to - Recipient email address
   * @param {string} username - User's username
   * @param {Array} activities - User's activities with stats
   * @param {Array} goals - User's goals with progress
   * @returns {Promise<Object>} Email send result
   */
  async sendWeeklyReport(to, username, activities, goals) {
    const subject = 'Your Weekly Activity Tracker Report';
    
    // Generate plain text version
    let text = `
      Hello ${username},
      
      Here's your weekly Activity Tracker report:
      
      ACTIVITY SUMMARY:
    `;
    
    activities.forEach(activity => {
      text += `
      ${activity.name}:
      - This week: ${activity.week} ${activity.unit}
      - Last week: ${activity.lastWeek} ${activity.unit}
      - Change: ${activity.change > 0 ? '+' : ''}${activity.change} ${activity.unit} (${activity.percentChange}%)
      `;
    });
    
    text += `
      GOAL PROGRESS:
    `;
    
    goals.forEach(goal => {
      text += `
      ${goal.name} (${goal.target} ${goal.unit} ${goal.periodType}):
      - Current: ${goal.current} ${goal.unit}
      - Progress: ${goal.progress}%
      - Remaining: ${goal.remaining} ${goal.unit}
      `;
    });
    
    text += `
      Keep up the good work!
      
      Best regards,
      The Activity Tracker Team
    `;
    
    // Generate HTML version
    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4361ee;">Your Weekly Activity Tracker Report</h1>
        <p>Hello ${username},</p>
        <p>Here's your weekly Activity Tracker report:</p>
        
        <h2 style="color: #4361ee; margin-top: 30px;">Activity Summary</h2>
        <div style="margin-bottom: 20px;">
    `;
    
    activities.forEach(activity => {
      const changeColor = activity.change >= 0 ? '#2ec4b6' : '#e63946';
      
      html += `
        <div style="margin-bottom: 15px; padding: 15px; border-radius: 5px; background-color: #f5f7fa;">
          <h3 style="margin-top: 0;">${activity.name}</h3>
          <div style="display: flex; justify-content: space-between;">
            <div>
              <p style="margin: 5px 0;"><strong>This week:</strong> ${activity.week} ${activity.unit}</p>
              <p style="margin: 5px 0;"><strong>Last week:</strong> ${activity.lastWeek} ${activity.unit}</p>
            </div>
            <div>
              <p style="margin: 5px 0; color: ${changeColor};">
                <strong>Change:</strong> ${activity.change > 0 ? '+' : ''}${activity.change} ${activity.unit} (${activity.percentChange}%)
              </p>
            </div>
          </div>
        </div>
      `;
    });
    
    html += `
        </div>
        
        <h2 style="color: #4361ee; margin-top: 30px;">Goal Progress</h2>
        <div style="margin-bottom: 20px;">
    `;
    
    goals.forEach(goal => {
      const progressColor = goal.progress >= 100 ? '#2ec4b6' : '#4361ee';
      
      html += `
        <div style="margin-bottom: 15px; padding: 15px; border-radius: 5px; background-color: #f5f7fa;">
          <h3 style="margin-top: 0;">${goal.name}</h3>
          <p style="margin: 5px 0;"><strong>Target:</strong> ${goal.target} ${goal.unit} (${goal.periodType})</p>
          <p style="margin: 5px 0;"><strong>Current:</strong> ${goal.current} ${goal.unit}</p>
          <div style="margin: 10px 0;">
            <div style="background-color: #dee2e6; height: 10px; border-radius: 5px; overflow: hidden;">
              <div style="background-color: ${progressColor}; height: 100%; width: ${Math.min(100, goal.progress)}%;"></div>
            </div>
            <p style="margin: 5px 0; text-align: right;">
              <strong>${goal.progress}%</strong> (${goal.remaining} ${goal.unit} remaining)
            </p>
          </div>
        </div>
      `;
    });
    
    html += `
        </div>
        
        <p style="margin-top: 30px;">Keep up the good work!</p>
        <p>Best regards,<br>The Activity Tracker Team</p>
      </div>
    `;
    
    return await this.sendEmail(to, subject, text, html);
  }

  /**
   * Send an activity reminder
   * @param {string} to - Recipient email address
   * @param {string} username - User's username
   * @param {Array} activities - User's activities to remind about
   * @returns {Promise<Object>} Email send result
   */
  async sendActivityReminder(to, username, activities) {
    const subject = 'Activity Tracker Reminder';
    
    // Generate plain text version
    let text = `
      Hello ${username},
      
      This is a friendly reminder about your scheduled activities:
    `;
    
    activities.forEach(activity => {
      text += `
      - ${activity.name}: ${activity.goal} ${activity.unit} planned for today
      `;
    });
    
    text += `
      Don't forget to log your activities in the tracker!
      
      Best regards,
      The Activity Tracker Team
    `;
    
    // Generate HTML version
    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4361ee;">Activity Reminder</h1>
        <p>Hello ${username},</p>
        <p>This is a friendly reminder about your scheduled activities:</p>
        
        <ul style="margin: 20px 0; padding-left: 20px;">
    `;
    
    activities.forEach(activity => {
      html += `
        <li style="margin-bottom: 10px;">
          <strong>${activity.name}:</strong> ${activity.goal} ${activity.unit} planned for today
        </li>
      `;
    });
    
    html += `
        </ul>
        
        <p>Don't forget to log your activities in the tracker!</p>
        <p>Best regards,<br>The Activity Tracker Team</p>
      </div>
    `;
    
    return await this.sendEmail(to, subject, text, html);
  }

  /**
   * Send a goal achievement notification
   * @param {string} to - Recipient email address
   * @param {string} username - User's username
   * @param {Object} goal - Completed goal
   * @returns {Promise<Object>} Email send result
   */
  async sendGoalAchievedEmail(to, username, goal) {
    const subject = 'Goal Achieved! 🏆';
    
    const text = `
      Hello ${username},
      
      Congratulations! You've achieved your goal:
      
      ${goal.name}: ${goal.target} ${goal.unit} (${goal.periodType})
      
      Keep up the excellent work!
      
      Best regards,
      The Activity Tracker Team
    `;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4361ee;">Goal Achieved! 🏆</h1>
        <p>Hello ${username},</p>
        <div style="background-color: #f5f7fa; border-radius: 5px; padding: 20px; margin: 20px 0; text-align: center;">
          <h2 style="color: #2ec4b6; margin-top: 0;">Congratulations!</h2>
          <p style="font-size: 18px;">You've achieved your goal:</p>
          <div style="background-color: #2ec4b6; color: white; border-radius: 5px; padding: 15px; margin: 15px 0;">
            <h3 style="margin: 0;">${goal.name}</h3>
            <p style="margin: 5px 0; font-size: 20px; font-weight: bold;">${goal.target} ${goal.unit}</p>
            <p style="margin: 5px 0;">${goal.periodType}</p>
          </div>
        </div>
        <p>Keep up the excellent work!</p>
        <p>Best regards,<br>The Activity Tracker Team</p>
      </div>
    `;
    
    return await this.sendEmail(to, subject, text, html);
  }

  /**
   * Send a new achievement notification
   * @param {string} to - Recipient email address
   * @param {string} username - User's username
   * @param {Object} achievement - Earned achievement
   * @returns {Promise<Object>} Email send result
   */
  async sendAchievementEmail(to, username, achievement) {
    const subject = 'New Achievement Unlocked! 🏅';
    
    const text = `
      Hello ${username},
      
      Congratulations! You've earned a new achievement:
      
      ${achievement.name}
      ${achievement.description}
      
      Keep up the excellent work!
      
      Best regards,
      The Activity Tracker Team
    `;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4361ee;">New Achievement Unlocked! 🏅</h1>
        <p>Hello ${username},</p>
        <div style="background-color: #f5f7fa; border-radius: 5px; padding: 20px; margin: 20px 0; text-align: center;">
          <h2 style="color: #e63946; margin-top: 0;">Congratulations!</h2>
          <p style="font-size: 18px;">You've earned a new achievement:</p>
          <div style="background-color: #4361ee; color: white; border-radius: 5px; padding: 15px; margin: 15px 0;">
            <h3 style="margin: 0;">${achievement.name}</h3>
            <p style="margin: 10px 0;">${achievement.description}</p>
            <p style="margin: 5px 0; font-style: italic;">Earned on ${new Date(achievement.earned_at).toLocaleDateString()}</p>
          </div>
          ${achievement.custom_message ? `<p style="font-style: italic;">${achievement.custom_message}</p>` : ''}
        </div>
        <p>Keep up the excellent work!</p>
        <p>Best regards,<br>The Activity Tracker Team</p>
      </div>
    `;
    
    return await this.sendEmail(to, subject, text, html);
  }
}

// Create and export a singleton instance
const emailService = new EmailService();
module.exports = emailService;
