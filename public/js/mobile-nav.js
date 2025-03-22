// Mobile navigation handling
class MobileNavigation {
    constructor() {
        this.mobileMenuOpen = false;
        this.init();
    }

    // Initialize mobile navigation
    init() {
        this.createMobileMenu();
        this.setupEventListeners();
    }
    
    // Create mobile menu elements
    createMobileMenu() {
        // Create mobile menu toggle button
        const userInfo = document.querySelector('.user-info');
        if (!userInfo) return;
        
        const mobileMenuToggle = document.createElement('button');
        mobileMenuToggle.id = 'mobile-menu-toggle';
        mobileMenuToggle.className = 'mobile-menu-toggle';
        mobileMenuToggle.setAttribute('aria-label', 'Open menu');
        mobileMenuToggle.innerHTML = '<i class="fas fa-bars" aria-hidden="true"></i>';
        
        // Create mobile menu container
        const mobileMenu = document.createElement('div');
        mobileMenu.id = 'mobile-menu';
        mobileMenu.className = 'mobile-menu';
        mobileMenu.innerHTML = `
            <button id="mobile-menu-close" class="mobile-menu-close" aria-label="Close menu">
                <i class="fas fa-times" aria-hidden="true"></i>
            </button>
            <div class="nav-item">
                <span class="user-name">${userInfo.querySelector('.user-name').textContent}</span>
            </div>
            <div class="nav-item">
                <a href="#" class="nav-link" id="menu-dashboard">Dashboard</a>
            </div>
            <div class="nav-item">
                <a href="#" class="nav-link" id="menu-activities">My Activities</a>
            </div>
            <div class="nav-item">
                <a href="#" class="nav-link" id="menu-new-activity">Create New Activity</a>
            </div>
            <div class="nav-item">
                <a href="#" class="nav-link" id="menu-logout">Logout</a>
            </div>
        `;
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'mobile-overlay';
        overlay.className = 'mobile-overlay';
        
        // Add elements to DOM
        const actionButtons = document.createElement('div');
        actionButtons.className = 'action-buttons';
        
        // Add theme toggle button
        const themeToggle = document.createElement('button');
        themeToggle.id = 'theme-toggle';
        themeToggle.className = 'theme-toggle';
        themeToggle.setAttribute('aria-label', 'Switch theme');
        themeToggle.innerHTML = '<i class="fas fa-moon" aria-hidden="true"></i>';
        
        actionButtons.appendChild(themeToggle);
        actionButtons.appendChild(mobileMenuToggle);
        
        userInfo.appendChild(actionButtons);
        document.body.appendChild(mobileMenu);
        document.body.appendChild(overlay);
    }
    
    // Set up event listeners for mobile navigation
    setupEventListeners() {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mobileMenuClose = document.getElementById('mobile-menu-close');
        const mobileMenu = document.getElementById('mobile-menu');
        const overlay = document.getElementById('mobile-overlay');
        const menuLogout = document.getElementById('menu-logout');
        const logoutBtn = document.getElementById('logout-btn');
        const menuNewActivity = document.getElementById('menu-new-activity');
        const newActivityBtn = document.getElementById('new-activity-btn');
        
        if (!mobileMenuToggle || !mobileMenuClose || !mobileMenu || !overlay) return;
        
        // Toggle mobile menu
        mobileMenuToggle.addEventListener('click', () => {
            this.toggleMobileMenu();
        });
        
        // Close mobile menu
        mobileMenuClose.addEventListener('click', () => {
            this.closeMobileMenu();
        });
        
        // Close mobile menu when clicking overlay
        overlay.addEventListener('click', () => {
            this.closeMobileMenu();
        });
        
        // Handle menu item clicks
        if (menuLogout && logoutBtn) {
            menuLogout.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeMobileMenu();
                logoutBtn.click();
            });
        }
        
        if (menuNewActivity && newActivityBtn) {
            menuNewActivity.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeMobileMenu();
                newActivityBtn.click();
            });
        }
    }
    
    // Toggle mobile menu open/closed
    toggleMobileMenu() {
        const mobileMenu = document.getElementById('mobile-menu');
        const overlay = document.getElementById('mobile-overlay');
        
        if (this.mobileMenuOpen) {
            mobileMenu.classList.remove('open');
            overlay.classList.remove('open');
            this.mobileMenuOpen = false;
        } else {
            mobileMenu.classList.add('open');
            overlay.classList.add('open');
            this.mobileMenuOpen = true;
        }
    }
    
    // Close mobile menu
    closeMobileMenu() {
        const mobileMenu = document.getElementById('mobile-menu');
        const overlay = document.getElementById('mobile-overlay');
        
        mobileMenu.classList.remove('open');
        overlay.classList.remove('open');
        this.mobileMenuOpen = false;
    }
}
