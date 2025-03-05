/**
 * Memory Manager for Heart Strings
 * Handles storing and retrieving character memories
 */
class MemoryManager {
    constructor() {
        this.memories = this.loadMemories();
        this.maxMemoriesPerLocation = 5;
    }
    
    /**
     * Loads memories from localStorage
     * @returns {Object} Memory object
     */
    loadMemories() {
        return getFromStorage('heartStrings_memories', {});
    }
    
    /**
     * Saves memories to localStorage
     */
    saveMemories() {
        setInStorage('heartStrings_memories', this.memories);
    }
    
    /**
     * Adds a memory for a character at a location
     * @param {string} characterId - Character ID
     * @param {string} locationId - Location ID
     * @param {string} memoryText - Memory content
     */
    addMemory(characterId, locationId, memoryText) {
        // Initialize objects if they don't exist
        if (!this.memories[characterId]) {
            this.memories[characterId] = {};
        }
        
        if (!this.memories[characterId][locationId]) {
            this.memories[characterId][locationId] = [];
        }
        
        // Add new memory at the beginning
        this.memories[characterId][locationId].unshift(memoryText);
        
        // Trim to max memories per location
        if (this.memories[characterId][locationId].length > this.maxMemoriesPerLocation) {
            this.memories[characterId][locationId] = 
                this.memories[characterId][locationId].slice(0, this.maxMemoriesPerLocation);
        }
        
        this.saveMemories();
    }
    
    /**
     * Gets memories for a character at a location
     * @param {string} characterId - Character ID
     * @param {string} locationId - Location ID
     * @returns {Array} Array of memories
     */
    getMemories(characterId, locationId) {
        if (!this.memories[characterId] || !this.memories[characterId][locationId]) {
            return [];
        }
        
        return this.memories[characterId][locationId];
    }
    
    /**
     * Gets all memories for a character
     * @param {string} characterId - Character ID
     * @returns {Object} Object with location IDs as keys and memory arrays as values
     */
    getAllCharacterMemories(characterId) {
        return this.memories[characterId] || {};
    }
    
    /**
     * Clears all memories
     */
    clearAllMemories() {
        this.memories = {};
        this.saveMemories();
    }
    
    /**
     * Clears memories for a specific character
     * @param {string} characterId - Character ID
     */
    clearCharacterMemories(characterId) {
        if (this.memories[characterId]) {
            delete this.memories[characterId];
            this.saveMemories();
        }
    }
    
    /**
     * Gets a summary of memories across all locations for a character
     * @param {string} characterId - Character ID
     * @returns {string} Memory summary
     */
    getCharacterMemorySummary(characterId) {
        if (!this.memories[characterId]) {
            return "You don't have any memories with this character yet.";
        }
        
        const locations = Object.keys(this.memories[characterId]);
        
        if (locations.length === 0) {
            return "You don't have any memories with this character yet.";
        }
        
        // Get location names instead of IDs
        const locationSummaries = locations.map(locId => {
            const location = locationData.find(loc => loc.id === locId);
            const locationName = location ? location.name : "Unknown location";
            const memoryCount = this.memories[characterId][locId].length;
            
            return `${locationName} (${memoryCount} ${memoryCount === 1 ? 'memory' : 'memories'})`;
        });
        
        return `You have memories with this character at: ${locationSummaries.join(', ')}.`;
    }
}

