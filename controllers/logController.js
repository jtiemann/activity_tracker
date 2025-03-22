const Log = require('../models/log');
const Activity = require('../models/activity');
const Achievement = require('../models/achievement');
const { clearUserCache, clearEndpointCache } = require('../middleware/cache');

/**
 * Get logs for a specific activity
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.getActivityLogs = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    const activityTypeId = parseInt(req.params.activityTypeId);
    
    // Check if user has permission to access logs for this user
    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to access logs for this user' });
    }
    
    // Get page and limit parameters for pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;
    
    // Get logs from database
    const logs = await Log.getForActivity(userId, activityTypeId, limit, offset);
    
    res.json(logs);
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new log entry
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.createLog = async (req, res, next) => {
  try {
    const { activityTypeId, userId, count, loggedAt, notes } = req.body;
    
    // Check if user has permission to create log for this user
    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to create logs for this user' });
    }
    
    // Check if activity exists and belongs to user
    const activity = await Activity.getById(activityTypeId);
    
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    
    if (activity.user_id !== userId) {
      return res.status(403).json({ error: 'You do not have permission to log for this activity' });
    }
    
    // Create log in database
    const log = await Log.create(activityTypeId, userId, count, loggedAt, notes);
    
    // Check for new achievements
    const newAchievements = await Achievement.checkAchievements(userId, activityTypeId);
    
    // Clear cache
    clearUserCache(userId);
    clearEndpointCache(`/api/logs/${userId}/${activityTypeId}`);
    clearEndpointCache(`/api/stats/${userId}/${activityTypeId}`);
    
    res.status(201).json({ 
      log,
      newAchievements: newAchievements.length > 0 ? newAchievements : undefined
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update a log entry
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.updateLog = async (req, res, next) => {
  try {
    const logId = parseInt(req.params.logId);
    const { count, loggedAt, notes } = req.body;
    
    // Get existing log
    const existingLog = await Log.getById(logId);
    
    if (!existingLog) {
      return res.status(404).json({ error: 'Log not found' });
    }
    
    // Check if user has permission to update this log
    if (existingLog.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to update this log' });
    }
    
    // Update log in database
    const log = await Log.update(logId, count, loggedAt, notes);
    
    // Check for new achievements
    const newAchievements = await Achievement.checkAchievements(
      existingLog.user_id, 
      existingLog.activity_type_id
    );
    
    // Clear cache
    clearUserCache(existingLog.user_id);
    clearEndpointCache(`/api/logs/${existingLog.user_id}/${existingLog.activity_type_id}`);
    clearEndpointCache(`/api/stats/${existingLog.user_id}/${existingLog.activity_type_id}`);
    
    res.json({ 
      log,
      newAchievements: newAchievements.length > 0 ? newAchievements : undefined
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a log entry
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.deleteLog = async (req, res, next) => {
  try {
    const logId = parseInt(req.params.logId);
    
    // Get existing log
    const existingLog = await Log.getById(logId);
    
    if (!existingLog) {
      return res.status(404).json({ error: 'Log not found' });
    }
    
    // Check if user has permission to delete this log
    if (existingLog.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to delete this log' });
    }
    
    // Delete log from database
    await Log.delete(logId);
    
    // Clear cache
    clearUserCache(existingLog.user_id);
    clearEndpointCache(`/api/logs/${existingLog.user_id}/${existingLog.activity_type_id}`);
    clearEndpointCache(`/api/stats/${existingLog.user_id}/${existingLog.activity_type_id}`);
    
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

/**
 * Get activity stats
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.getStats = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    const activityTypeId = parseInt(req.params.activityTypeId);
    
    // Check if user has permission to access stats for this user
    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to access stats for this user' });
    }
    
    // Get stats from database
    const stats = await Log.getStats(userId, activityTypeId);
    
    res.json(stats);
  } catch (err) {
    next(err);
  }
};

/**
 * Export activity logs to CSV
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.exportLogs = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    const activityTypeId = req.params.activityTypeId ? parseInt(req.params.activityTypeId) : null;
    
    // Check if user has permission to export logs for this user
    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to export logs for this user' });
    }
    
    // Get all activities for the user
    const activities = await Activity.getAllForUser(userId);
    const activitiesMap = activities.reduce((map, activity) => {
      map[activity.activity_type_id] = activity;
      return map;
    }, {});
    
    // Get logs from database
    let logs = [];
    if (activityTypeId) {
      // Get logs for specific activity
      logs = await Log.getForActivity(userId, activityTypeId, 1000, 0);
    } else {
      // Get logs for all activities
      const allLogs = await Promise.all(
        activities.map(activity => Log.getForActivity(userId, activity.activity_type_id, 1000, 0))
      );
      logs = allLogs.flat();
      
      // Sort by date (newest first)
      logs.sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at));
    }
    
    // Generate CSV content
    let csvContent = 'Activity,Count,Unit,Date,Notes\n';
    
    logs.forEach(log => {
      const activity = activitiesMap[log.activity_type_id];
      const activityName = activity ? activity.name : 'Unknown';
      const unit = activity ? activity.unit : 'units';
      const date = new Date(log.logged_at).toLocaleString();
      const notes = log.notes ? `"${log.notes.replace(/"/g, '""')}"` : '';
      
      csvContent += `"${activityName}",${log.count},"${unit}","${date}",${notes}\n`;
    });
    
    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=activity_logs.csv');
    
    // Send CSV content
    res.send(csvContent);
  } catch (err) {
    next(err);
  }
};

/**
 * Export activity logs to PDF
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.exportLogsPDF = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    const activityTypeId = req.params.activityTypeId ? parseInt(req.params.activityTypeId) : null;
    
    // Check if user has permission to export logs for this user
    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to export logs for this user' });
    }
    
    // Get user info
    const user = await User.getById(userId);
    
    // Get all activities for the user
    const activities = await Activity.getAllForUser(userId);
    const activitiesMap = activities.reduce((map, activity) => {
      map[activity.activity_type_id] = activity;
      return map;
    }, {});
    
    // Get logs from database
    let logs = [];
    let activityName = 'All Activities';
    
    if (activityTypeId) {
      // Get logs for specific activity
      logs = await Log.getForActivity(userId, activityTypeId, 1000, 0);
      activityName = activitiesMap[activityTypeId] ? activitiesMap[activityTypeId].name : 'Unknown Activity';
    } else {
      // Get logs for all activities
      const allLogs = await Promise.all(
        activities.map(activity => Log.getForActivity(userId, activity.activity_type_id, 1000, 0))
      );
      logs = allLogs.flat();
      
      // Sort by date (newest first)
      logs.sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at));
    }
    
    // Format data for PDF
    const logsData = logs.map(log => {
      const activity = activitiesMap[log.activity_type_id];
      return {
        activity: activity ? activity.name : 'Unknown',
        count: log.count,
        unit: activity ? activity.unit : 'units',
        date: new Date(log.logged_at).toLocaleString(),
        notes: log.notes || ''
      };
    });
    
    // Create PDF document
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=activity_logs.pdf');
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // Add title
    doc.fontSize(20).text(`Activity Logs - ${activityName}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated for: ${user.username}`, { align: 'center' });
    doc.moveDown();
    doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);
    
    // Create table
    const tableTop = 150;
    const rowHeight = 20;
    const colWidths = [150, 60, 60, 120, 150];
    const colPositions = colWidths.reduce((positions, width, i) => {
      const pos = i === 0 ? 50 : positions[i - 1] + colWidths[i - 1];
      positions.push(pos);
      return positions;
    }, []);
    
    // Table headers
    doc.font('Helvetica-Bold');
    doc.text('Activity', colPositions[0], tableTop);
    doc.text('Count', colPositions[1], tableTop);
    doc.text('Unit', colPositions[2], tableTop);
    doc.text('Date', colPositions[3], tableTop);
    doc.text('Notes', colPositions[4], tableTop);
    
    // Table rows
    doc.font('Helvetica');
    let rowPosition = tableTop + rowHeight;
    
    logsData.forEach((log, i) => {
      // Add a new page if needed
      if (rowPosition > 700) {
        doc.addPage();
        rowPosition = 50;
      }
      
      // Background color for alternating rows
      if (i % 2 === 1) {
        doc.rect(50, rowPosition - 15, doc.page.width - 100, rowHeight)
          .fill('#f5f5f5');
      }
      
      doc.fillColor('black');
      doc.text(log.activity, colPositions[0], rowPosition);
      doc.text(log.count.toString(), colPositions[1], rowPosition);
      doc.text(log.unit, colPositions[2], rowPosition);
      doc.text(log.date, colPositions[3], rowPosition);
      doc.text(log.notes, colPositions[4], rowPosition, { width: 150 });
      
      rowPosition += rowHeight + 5;
    });
    
    // Finalize PDF
    doc.end();
  } catch (err) {
    next(err);
  }
};
