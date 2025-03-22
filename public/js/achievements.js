// Achievements handling
class AchievementsManager {
  constructor() {
    this.achievements = [];
    this.achievementTypes = [];
  }

  // Initialize achievements
  async init() {
    await Promise.all([
      this.loadAchievements(),
      this.loadAchievementTypes()
    ]);
    this.renderAchievements();
  }

  // Load achievements for current user
  async loadAchievements() {
    try {
      this.achievements = await window.apiClient.getAchievements();
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  }

  // Load achievement types
  async loadAchievementTypes() {
    try {
      this.achievementTypes = await window.apiClient.getAchievementTypes();
    } catch (error) {
      console.error('Error loading achievement types:', error);
    }
  }

  // Check for new achievements after activity
  async checkForNewAchievements(activityTypeId) {
    try {
      const result = await window.apiClient.checkAchievements(activityTypeId);
      
      if (result.newAchievements && result.newAchievements.length > 0) {
        // Reload achievements
        await this.loadAchievements();
        this.renderAchievements();
        
        // Show achievements popup
        this.showNewAchievementsPopup(result.newAchievements);
      }
    } catch (error) {
      console.error('Error checking for achievements:', error);
    }
  }

  // Show new achievements popup
  showNewAchievementsPopup(newAchievements) {
    // Create popup element if it doesn't exist
    let popupElement = document.getElementById('achievements-popup');
    if (!popupElement) {
      popupElement = document.createElement('div');
      popupElement.id = 'achievements-popup';
      document.body.appendChild(popupElement);
    }
    
    // Clear popup content
    popupElement.innerHTML = '';
    
    // Create popup content
    const popupContent = document.createElement('div');
    popupContent.className = 'achievements-popup-content';
    
    // Add header
    const header = document.createElement('div');
    header.className = 'achievements-popup-header';
    header.innerHTML = `
      <h3><i class="fas fa-trophy"></i> Achievement Unlocked!</h3>
      <button class="close-btn" aria-label="Close popup">
        <i class="fas fa-times"></i>
      </button>
    `;
    popupContent.appendChild(header);
    
    // Add achievements list
    const list = document.createElement('div');
    list.className = 'achievements-popup-list';
    
    newAchievements.forEach(achievement => {
      // Get achievement type info
      const achievementType = this.achievementTypes.find(t => 
        t.achievement_type_id === achievement.achievement_type_id
      ) || {};
      
      // Add achievement item
      const item = document.createElement('div');
      item.className = 'achievement-item';
      item.innerHTML = `
        <div class="achievement-icon">
          <i class="fas fa-${achievementType.icon || 'award'}"></i>
        </div>
        <div class="achievement-info">
          <h4>${achievementType.name || 'Achievement'}</h4>
          <p>${achievementType.description || ''}</p>
          ${achievement.custom_message ? `<p class="custom-message">${achievement.custom_message}</p>` : ''}
        </div>
      `;
      list.appendChild(item);
    });
    
    popupContent.appendChild(list);
    
    // Add share buttons
    const shareButtons = document.createElement('div');
    shareButtons.className = 'share-buttons';
    shareButtons.innerHTML = `
      <p>Share your achievement:</p>
      <div class="buttons">
        <button class="share-btn twitter" data-platform="twitter">
          <i class="fab fa-twitter"></i> Twitter
        </button>
        <button class="share-btn facebook" data-platform="facebook">
          <i class="fab fa-facebook"></i> Facebook
        </button>
      </div>
    `;
    popupContent.appendChild(shareButtons);
    
    // Add popup content to popup element
    popupElement.appendChild(popupContent);
    
    // Show popup
    popupElement.classList.add('show');
    
    // Add event listeners
    const closeBtn = popupElement.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        popupElement.classList.remove('show');
      });
    }
    
    // Share buttons
    const twitterBtn = popupElement.querySelector('.share-btn.twitter');
    const facebookBtn = popupElement.querySelector('.share-btn.facebook');
    
    if (twitterBtn && newAchievements.length > 0) {
      twitterBtn.addEventListener('click', () => {
        this.shareAchievement(newAchievements[0].user_achievement_id, 'twitter');
      });
    }
    
    if (facebookBtn && newAchievements.length > 0) {
      facebookBtn.addEventListener('click', () => {
        this.shareAchievement(newAchievements[0].user_achievement_id, 'facebook');
      });
    }
  }

  // Share an achievement
  async shareAchievement(achievementId, platform) {
    try {
      const result = await window.apiClient.shareAchievement(achievementId, platform);
      
      // Open share URL in new window
      if (result.shareUrl) {
        window.open(result.shareUrl, '_blank');
      }
    } catch (error) {
      console.error('Error sharing achievement:', error);
      alert('Error sharing achievement. Please try again.');
    }
  }

  // Render achievements in the UI
  renderAchievements() {
    const achievementsContainer = document.getElementById('achievements-container');
    if (!achievementsContainer) return;
    
    // Clear container
    achievementsContainer.innerHTML = '';
    
    // Check if we have achievements
    if (this.achievements.length === 0) {
      achievementsContainer.innerHTML = `
        <div class="empty-state">
          <p>No achievements earned yet. Keep tracking your activities to earn badges!</p>
        </div>
      `;
      return;
    }
    
    // Group achievements by category
    const groupedAchievements = this.groupAchievementsByCategory();
    
    // Render each category
    Object.entries(groupedAchievements).forEach(([category, achievements]) => {
      // Create category element
      const categoryElement = document.createElement('div');
      categoryElement.className = 'achievements-category';
      categoryElement.innerHTML = `
        <h3 class="category-title">${this.formatCategory(category)}</h3>
        <div class="achievements-grid"></div>
      `;
      
      // Get grid element
      const gridElement = categoryElement.querySelector('.achievements-grid');
      
      // Render each achievement
      achievements.forEach(achievement => {
        this.renderAchievement(achievement, gridElement);
      });
      
      // Add to container
      achievementsContainer.appendChild(categoryElement);
    });
  }

  // Render a single achievement
  renderAchievement(achievement, container) {
    if (!container) return;
    
    // Get achievement type info
    const achievementType = this.achievementTypes.find(t => 
      t.achievement_type_id === achievement.achievement_type_id
    ) || {};
    
    // Format earned date
    const earnedDate = new Date(achievement.earned_at);
    const formattedDate = earnedDate.toLocaleDateString();
    
    // Create achievement element
    const achievementElement = document.createElement('div');
    achievementElement.className = 'achievement-card';
    achievementElement.innerHTML = `
      <div class="achievement-icon">
        <i class="fas fa-${achievementType.icon || 'award'}"></i>
      </div>
      <div class="achievement-info">
        <h4>${achievementType.name || 'Achievement'}</h4>
        <p>${achievementType.description || ''}</p>
        <p class="earned-date">Earned on ${formattedDate}</p>
        ${achievement.custom_message ? `<p class="custom-message">${achievement.custom_message}</p>` : ''}
      </div>
      <div class="achievement-share">
        <button class="btn-sm share-twitter" data-id="${achievement.user_achievement_id}" aria-label="Share on Twitter">
          <i class="fab fa-twitter"></i>
        </button>
        <button class="btn-sm share-facebook" data-id="${achievement.user_achievement_id}" aria-label="Share on Facebook">
          <i class="fab fa-facebook"></i>
        </button>
      </div>
    `;
    
    // Add event listeners
    const twitterBtn = achievementElement.querySelector('.share-twitter');
    if (twitterBtn) {
      twitterBtn.addEventListener('click', () => {
        this.shareAchievement(achievement.user_achievement_id, 'twitter');
      });
    }
    
    const facebookBtn = achievementElement.querySelector('.share-facebook');
    if (facebookBtn) {
      facebookBtn.addEventListener('click', () => {
        this.shareAchievement(achievement.user_achievement_id, 'facebook');
      });
    }
    
    // Add to container
    container.appendChild(achievementElement);
  }

  // Group achievements by category
  groupAchievementsByCategory() {
    // If no achievements, return empty object
    if (!this.achievements.length) return {};
    
    // Create mapping of achievement types by ID
    const typeMap = this.achievementTypes.reduce((map, type) => {
      map[type.achievement_type_id] = type;
      return map;
    }, {});
    
    // Group achievements by category
    return this.achievements.reduce((groups, achievement) => {
      // Get achievement type
      const type = typeMap[achievement.achievement_type_id];
      
      // If type not found, add to 'Other' category
      const category = type ? type.category : 'other';
      
      // If category doesn't exist in groups, create it
      if (!groups[category]) {
        groups[category] = [];
      }
      
      // Add achievement to category
      groups[category].push(achievement);
      
      return groups;
    }, {});
  }

  // Format category name for display
  formatCategory(category) {
    switch (category) {
      case 'total_count':
        return 'Total Activity';
      case 'activity_specific':
        return 'Activity Specific';
      case 'streak':
        return 'Consistency Streaks';
      case 'activity_variety':
        return 'Activity Variety';
      case 'other':
        return 'Other Achievements';
      default:
        return category.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
    }
  }
}

// Initialize achievements manager
window.achievementsManager = new AchievementsManager();
