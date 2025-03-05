/**
 * Dialogue Manager for Heart Strings
 * Handles character dialogue generation and responses
 */
class DialogueManager {
    constructor(memoryManager, relationshipManager) {
        this.memoryManager = memoryManager;
        this.relationshipManager = relationshipManager;
        this.currentCharacter = null;
        this.currentLocation = null;
        this.conversationHistory = [];
        this.maxHistoryLength = 10; // Keep last 10 messages for context
        this.isGenerating = false;
    }
    
    /**
     * Sets the current conversation context
     * @param {Object} character - Character object
     * @param {Object} location - Location object
     */
    setContext(character, location) {
        this.currentCharacter = character;
        this.currentLocation = location;
        
        // Reset conversation history for new context
        this.conversationHistory = [];
        
        // Add stored memories to history if they exist
        const memories = this.memoryManager.getMemories(character.id, location.id);
        if (memories && memories.length > 0) {
            // Add a system message reminding the LLM of previous conversations
            this.conversationHistory.push({
                role: "system",
                content: `Previous conversations between the player and ${character.name} at ${location.name}: ${memories.join(' ')}`
            });
        }
    }
    
    /**
     * Generates greeting dialogue for the current character and location
     * @returns {Promise<string>} The greeting dialogue
     */
    async generateGreeting() {
        if (!this.currentCharacter || !this.currentLocation) {
            throw new Error('Character or location not set');
        }
        
        const relationshipStage = this.relationshipManager.getRelationshipStage(this.currentCharacter.id);
        
        try {
            this.isGenerating = true;
            
            const systemPrompt = createCharacterSystemPrompt(
                this.currentCharacter, 
                relationshipStage.name, 
                this.currentLocation
            );
            
            // Create a prompt based on relationship stage
            let greetingPrompt;
            if (relationshipStage.name === 'Strangers') {
                greetingPrompt = `You see someone new approaching you at ${this.currentLocation.name}. Introduce yourself and make a comment about the location.`;
            } else {
                const memories = this.memoryManager.getMemories(this.currentCharacter.id, this.currentLocation.id);
                if (memories && memories.length > 0) {
                    greetingPrompt = `You see the player approaching you at ${this.currentLocation.name}. Greet them warmly, referring to your previous meeting if appropriate.`;
                } else {
                    greetingPrompt = `You see the player you know approaching you at ${this.currentLocation.name}. Greet them warmly and make a comment about seeing them in this new location.`;
                }
            }
            
            const completion = await websim.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: greetingPrompt }
                ]
            });
            
            const response = completion.content;
            
            // Save the greeting to conversation history
            this.conversationHistory.push({ role: "assistant", content: response });
            this.trimConversationHistory();
            
            return response;
        } catch (error) {
            console.error('Error generating greeting:', error);
            return `Hi there! It's nice to see you at ${this.currentLocation.name}.`;
        } finally {
            this.isGenerating = false;
        }
    }
    
    /**
     * Responds to player input
     * @param {string} playerMessage - The player's message
     * @returns {Promise<Object>} Response object with text and impact
     */
    async respondToPlayer(playerMessage) {
        if (!this.currentCharacter || !this.currentLocation) {
            throw new Error('Character or location not set');
        }
        
        if (this.isGenerating) {
            throw new Error('Already generating a response');
        }
        
        try {
            this.isGenerating = true;
            
            // Add player message to history
            this.conversationHistory.push({ role: "user", content: playerMessage });
            this.trimConversationHistory();
            
            const relationshipStage = this.relationshipManager.getRelationshipStage(this.currentCharacter.id);
            
            const systemPrompt = createCharacterSystemPrompt(
                this.currentCharacter, 
                relationshipStage.name, 
                this.currentLocation
            );
            
            // Include direction to analyze the impact in the system prompt
            const analysisPrompt = `${systemPrompt}

Additionally, after generating your in-character response, analyze how the player's message would affect your feelings toward them on a scale from Very Negative to Very Positive.

At the very end of your response, on a new line, add ONE of these exact tags:
[IMPACT: VERY_POSITIVE] - If the message was very flattering, thoughtful, or aligns perfectly with your interests/personality
[IMPACT: POSITIVE] - If the message was nice, engaging, or shows they're paying attention to you
[IMPACT: NEUTRAL] - If the message was basic, routine, or neither positive nor negative
[IMPACT: NEGATIVE] - If the message was rude, disinterested, or clearly misaligned with your character

This tag should be invisible to the player - it's just for the system to track relationship changes.`;
            
            const completion = await websim.chat.completions.create({
                messages: [
                    { role: "system", content: analysisPrompt },
                    ...this.conversationHistory
                ]
            });
            
            let response = completion.content;
            
            // Extract impact from response
            let impact = RESPONSE_IMPACT.NEUTRAL; // Default impact
            const impactMatch = response.match(/\[IMPACT: (VERY_POSITIVE|POSITIVE|NEUTRAL|NEGATIVE)\]/);
            
            if (impactMatch) {
                const impactType = impactMatch[1];
                impact = RESPONSE_IMPACT[impactType] || RESPONSE_IMPACT.NEUTRAL;
                
                // Remove the impact tag from the visible response
                response = response.replace(/\[IMPACT: (VERY_POSITIVE|POSITIVE|NEUTRAL|NEGATIVE)\]/, '').trim();
            }
            
            // Store clean response in conversation history
            this.conversationHistory.push({ role: "assistant", content: response });
            this.trimConversationHistory();
            
            // Store this exchange in memory
            this.memoryManager.addMemory(
                this.currentCharacter.id,
                this.currentLocation.id,
                `Player said: "${playerMessage}" ${this.currentCharacter.name} responded: "${response.substring(0, 100)}..."`
            );
            
            return {
                text: response,
                impact: impact
            };
        } catch (error) {
            console.error('Error generating response:', error);
            return {
                text: "I'm not sure how to respond to that. Could we talk about something else?",
                impact: RESPONSE_IMPACT.NEUTRAL
            };
        } finally {
            this.isGenerating = false;
        }
    }
    
    /**
     * Generates response options for player
     * @param {number} count - Number of options to generate
     * @returns {Promise<Array>} Array of response options
     */
    async generateResponseOptions(count = 4) {
        if (!this.currentCharacter || !this.currentLocation) {
            throw new Error('Character or location not set');
        }
        
        try {
            const relationshipStage = this.relationshipManager.getRelationshipStage(this.currentCharacter.id);
            
            const systemPrompt = `You are helping generate player response options for a dating simulator game.
The player is talking to ${this.currentCharacter.name}, who has the following traits:
- Personality: ${this.currentCharacter.personality}
- Interests: ${this.currentCharacter.interests.join(', ')}
- Current relationship: ${relationshipStage.name}
- Current location: ${this.currentLocation.name} (${this.currentLocation.atmosphere})

Based on the conversation history, generate ${count} different response options for the player.
Each option should be unique and realistic.
For each option, include:
1. The response text (1-2 sentences, conversational)
2. The expected impact (VERY_POSITIVE, POSITIVE, NEUTRAL, or NEGATIVE)

Respond directly with JSON in this exact format, and no other text:
[
  { "text": "Response option 1", "impact": "POSITIVE" },
  { "text": "Response option 2", "impact": "VERY_POSITIVE" },
  ...etc
]`;
            
            const completion = await websim.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    ...this.conversationHistory
                ],
                json: true
            });
            
            const responseOptions = JSON.parse(completion.content);
            
            // Ensure we have the requested number of options
            while (responseOptions.length > count) {
                responseOptions.pop();
            }
            
            // If we have fewer than requested, fill with defaults
            while (responseOptions.length < count) {
                responseOptions.push({
                    text: `Tell me more about yourself.`,
                    impact: "NEUTRAL"
                });
            }
            
            return responseOptions;
        } catch (error) {
            console.error('Error generating response options:', error);
            
            // Return default options on error
            return [
                { text: "That's interesting. Tell me more.", impact: "POSITIVE" },
                { text: "I'm really enjoying talking with you.", impact: "VERY_POSITIVE" },
                { text: "What do you think about this place?", impact: "NEUTRAL" },
                { text: "I should probably get going soon.", impact: "NEGATIVE" }
            ];
        }
    }
    
    /**
     * Generates farewell options for ending date
     * @returns {Promise<Array>} Array of farewell options
     */
    async generateFarewellOptions() {
        if (!this.currentCharacter) {
            throw new Error('Character not set');
        }
        
        try {
            const relationshipStage = this.relationshipManager.getRelationshipStage(this.currentCharacter.id);
            
            const systemPrompt = `You are helping generate farewell options for a dating simulator game.
The player is ending a date with ${this.currentCharacter.name}.
Current relationship: ${relationshipStage.name}

Generate 3 different farewell options for the player to say before leaving.
Each option should have a different tone or implication about future plans.
For each option, include:
1. The farewell text (1-2 sentences)
2. The expected impact (VERY_POSITIVE, POSITIVE, NEUTRAL, or NEGATIVE)

Respond directly with JSON in this exact format, and no other text:
[
  { "text": "Farewell option 1", "impact": "POSITIVE" },
  { "text": "Farewell option 2", "impact": "VERY_POSITIVE" },
  { "text": "Farewell option 3", "impact": "NEUTRAL" }
]`;
            
            const completion = await websim.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt }
                ],
                json: true
            });
            
            return JSON.parse(completion.content);
        } catch (error) {
            console.error('Error generating farewell options:', error);
            
            // Return default options on error
            return [
                { text: "I had a great time with you today. Let's do this again soon!", impact: "VERY_POSITIVE" },
                { text: "This was nice. Maybe I'll see you around sometime.", impact: "NEUTRAL" },
                { text: "Thanks for hanging out. I should get going now.", impact: "POSITIVE" }
            ];
        }
    }
    
    /**
     * Generates a date summary
     * @param {number} duration - Date duration in minutes
     * @param {number} relationshipChange - Relationship points changed
     * @returns {Promise<string>} Summary text
     */
    async generateDateSummary(duration, relationshipChange) {
        if (!this.currentCharacter || !this.currentLocation) {
            throw new Error('Character or location not set');
        }
        
        try {
            const relationshipStage = this.relationshipManager.getRelationshipStage(this.currentCharacter.id);
            
            const systemPrompt = `You are generating a summary for a just-completed date in a dating simulator game.
Characters: The player and ${this.currentCharacter.name} (${this.currentCharacter.personality})
Location: ${this.currentLocation.name} (${this.currentLocation.atmosphere})
Duration: ${duration} minutes
Relationship change: ${relationshipChange > 0 ? 'Improved' : relationshipChange < 0 ? 'Worsened' : 'Unchanged'}
Current relationship: ${relationshipStage.name}

Write a brief 2-3 sentence summary of how the date went, incorporating the above details.
Keep it concise, personal, and reflective of the relationship change.`;
            
            const completion = await websim.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt }
                ]
            });
            
            return completion.content;
        } catch (error) {
            console.error('Error generating date summary:', error);
            
            // Return default summary on error
            if (relationshipChange > 0) {
                return `You had a nice time with ${this.currentCharacter.name} at ${this.currentLocation.name}. The conversation went well, and you feel like you've grown closer.`;
            } else if (relationshipChange < 0) {
                return `Your time with ${this.currentCharacter.name} at ${this.currentLocation.name} was a bit awkward. There seemed to be some misunderstandings in your conversation.`;
            } else {
                return `You spent some time with ${this.currentCharacter.name} at ${this.currentLocation.name}. The date was pleasant, but neither particularly memorable nor disappointing.`;
            }
        }
    }
    
    /**
     * Trims conversation history to maximum length
     */
    trimConversationHistory() {
        // Preserve system messages, trim user and assistant messages
        const systemMessages = this.conversationHistory.filter(msg => msg.role === "system");
        const nonSystemMessages = this.conversationHistory.filter(msg => msg.role !== "system");
        
        // Keep only the most recent messages
        const trimmedNonSystemMessages = nonSystemMessages.slice(-this.maxHistoryLength);
        
        // Rebuild conversation history
        this.conversationHistory = [...systemMessages, ...trimmedNonSystemMessages];
    }
}

