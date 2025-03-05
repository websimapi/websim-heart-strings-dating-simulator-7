/**
 * Main Application for Heart Strings
 * Coordinates all components and initializes the app
 */
class HeartStringsApp {
    constructor() {
        // Initialize managers
        this.memoryManager = new MemoryManager();
        this.relationshipManager = new RelationshipManager();
        this.dialogueManager = new DialogueManager(this.memoryManager, this.relationshipManager);
        this.uiManager = new UIManager(this.dialogueManager, this.memoryManager, this.relationshipManager);
    }
    
    /**
     * Initializes the application
     */
    async initialize() {
        console.log('Initializing Heart Strings...');
        
        // Initialize UI components
        this.uiManager.initialize();
        
        try {
            // Preload essential images
            await imageGenerator.preloadEssentialImages(characterData, locationData);
        } catch (error) {
            console.warn('Error preloading images:', error);
        }
        
        // Hide loading screen and show main menu
        setTimeout(() => {
            this.uiManager.showMainMenu();
        }, 1500);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new HeartStringsApp();
    
    // Handle service availability
    if (typeof websim === 'undefined') {
        alert('Error: Required services are not available. The application cannot start.');
        return;
    }
    
    app.initialize();
});

