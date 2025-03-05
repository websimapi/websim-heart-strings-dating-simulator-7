/**
 * Relationship Manager for Heart Strings
 * Handles relationship scores and progression
 */
class RelationshipManager {
    constructor() {
        this.relationships = this.loadRelationships();
    }
    
    /**
     * Loads relationship data from localStorage
     * @returns {Object} Relationship data
     */
    loadRelationships() {
        return getFromStorage('heartStrings_relationships', {});
    }
    
    /**
     * Saves relationship data to localStorage
     */
    saveRelationships() {
        setInStorage('heartStrings_relationships', this.relationships);
    }
    
    /**
     * Gets relationship score for a character
     * @param {string} characterId - Character ID
     * @returns {number} Relationship score (0-100)
     */
    getRelationshipScore(characterId) {
        if (!this.relationships[characterId]) {
            this.relationships[characterId] = 0;
            this.saveRelationships();
        }
        
        return this.relationships[characterId];
    }
    
    /**
     * Gets current relationship stage for a character
     * @param {string} characterId - Character ID
     * @returns {Object} Relationship stage object
     */
    getRelationshipStage(characterId) {
        const score = this.getRelationshipScore(characterId);
        
        // Find the highest threshold that the score meets
        for (let i = relationshipStages.length - 1; i >= 0; i--) {
            if (score >= relationshipStages[i].threshold) {
                return relationshipStages[i];
            }
        }
        
        // Default to first stage
        return relationshipStages[0];
    }
    
    /**
     * Updates relationship score for a character
     * @param {string} characterId - Character ID
     * @param {number} change - Amount to change the score
     * @returns {Object} Object with new score and stage info
     */
    updateRelationship(characterId, change) {
        const oldScore = this.getRelationshipScore(characterId);
        const oldStage = this.getRelationshipStage(characterId);
        
        // Calculate new score, clamped to 0-100
        let newScore = Math.max(0, Math.min(100, oldScore + change));
        
        this.relationships[characterId] = newScore;
        this.saveRelationships();
        
        const newStage = this.getRelationshipStage(characterId);
        
        return {
            oldScore,
            newScore,
            change,
            oldStage,
            newStage,
            stageChanged: oldStage.name !== newStage.name
        };
    }
    
    /**
     * Checks if the relationship stage has changed
     * @param {string} characterId - Character ID
     * @param {number} oldScore - Previous relationship score
     * @returns {boolean} Whether the stage changed
     */
    hasStageChanged(characterId, oldScore) {
        const oldStage = relationshipStages.find(stage => 
            oldScore >= stage.threshold && oldScore < (stage.threshold + 20));
        const newStage = this.getRelationshipStage(characterId);
        
        return oldStage?.name !== newStage.name;
    }
    
    /**
     * Resets all relationships
     */
    resetAllRelationships() {
        this.relationships = {};
        this.saveRelationships();
    }
    
    /**
     * Resets relationship for a specific character
     * @param {string} characterId - Character ID
     */
    resetRelationship(characterId) {
        if (this.relationships[characterId] !== undefined) {
            this.relationships[characterId] = 0;
            this.saveRelationships();
        }
    }
    
    /**
     * Gets relationship summary for all characters
     * @returns {Array} Array of character relationship summaries
     */
    getAllRelationshipSummaries() {
        return characterData.map(character => {
            const score = this.getRelationshipScore(character.id);
            const stage = this.getRelationshipStage(character.id);
            
            return {
                id: character.id,
                name: character.name,
                score,
                stage: stage.name,
                description: stage.description
            };
        });
    }
}

