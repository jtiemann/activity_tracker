/**
 * Model Repository Integration
 * This file provides integration between old model functions and new repositories
 */

// Import repositories
const ActivityRepository = require('./base/ActivityRepository');
const UserRepository = require('./base/UserRepository');
const LogRepository = require('./base/LogRepository');
const GoalRepository = require('./base/GoalRepository');
const AchievementRepository = require('./base/AchievementRepository');

// Activity integration
const Activity = {
  // Original functions
  getAllForUser: ActivityRepository.getAllForUser.bind(ActivityRepository),
  getById: ActivityRepository.findById.bind(ActivityRepository),
  create: ActivityRepository.create.bind(ActivityRepository),
  update: ActivityRepository.update.bind(ActivityRepository),
  delete: ActivityRepository.delete.bind(ActivityRepository),
  getCategories: ActivityRepository.getCategories.bind(ActivityRepository),
  
  // New functions
  getTrendingActivities: ActivityRepository.getTrendingActivities.bind(ActivityRepository)
};

// User integration
const User = {
  // Original functions
  getById: UserRepository.findById.bind(UserRepository),
  getByUsername: UserRepository.getByUsername.bind(UserRepository),
  create: UserRepository.create.bind(UserRepository),
  updateLastLogin: UserRepository.updateLastLogin.bind(UserRepository),
  verifyPassword: UserRepository.verifyPassword.bind(UserRepository),
  
  // New functions
  getByEmail: UserRepository.getByEmail.bind(UserRepository),
  changePassword: UserRepository.changePassword.bind(UserRepository),
  getUsersWithEmail: UserRepository.getUsersWithEmail.bind(UserRepository)
};

// Log integration
const Log = {
  // Original functions
  getForActivity: LogRepository.getForActivity.bind(LogRepository),
  getById: LogRepository.findById.bind(LogRepository),
  create: LogRepository.create.bind(LogRepository),
  update: LogRepository.update.bind(LogRepository),
  delete: LogRepository.delete.bind(LogRepository),
  getStats: LogRepository.getStats.bind(LogRepository),
  
  // New functions
  getWeeklyDistribution: LogRepository.getWeeklyDistribution.bind(LogRepository)
};

// Goal integration
const Goal = {
  // Original functions
  getAllForUser: GoalRepository.getAllForUser.bind(GoalRepository),
  getForActivity: GoalRepository.getForActivity.bind(GoalRepository),
  getById: GoalRepository.findById.bind(GoalRepository),
  create: GoalRepository.create.bind(GoalRepository),
  update: GoalRepository.update.bind(GoalRepository),
  delete: GoalRepository.delete.bind(GoalRepository),
  getProgress: GoalRepository.getProgress.bind(GoalRepository),
  
  // New functions
  getActiveGoals: GoalRepository.getActiveGoals.bind(GoalRepository)
};

// Achievement integration
const Achievement = {
  // Original functions
  getAllForUser: AchievementRepository.getAllForUser.bind(AchievementRepository),
  getAchievementTypes: AchievementRepository.getAchievementTypes.bind(AchievementRepository),
  awardAchievement: AchievementRepository.awardAchievement.bind(AchievementRepository),
  checkAchievements: AchievementRepository.checkAchievements.bind(AchievementRepository)
};

module.exports = {
  Activity,
  User,
  Log,
  Goal,
  Achievement
};
