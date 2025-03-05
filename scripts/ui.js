/**
 * UI Manager for Heart Strings
 * Handles screen transitions and UI updates
 */
class UIManager {
    constructor(dialogueManager, memoryManager, relationshipManager) {
        this.dialogueManager = dialogueManager;
        this.memoryManager = memoryManager;
        this.relationshipManager = relationshipManager;
        
        this.currentScreen = 'loadingScreen';
        this.selectedCharacter = null;
        this.selectedLocation = null;
        this.responseOptions = [];
        this.dateTimer = null;
        this.dateStartTime = null;
        this.dateDuration = 0; // in seconds
        this.relationshipChange = 0;
        this.farewellOptions = [];
        
        // Text display options
        this.textSpeed = 50; // 1-100, higher is faster
        
        // State for typing animation
        this.isTyping = false;
        this.typingTimeout = null;
    }
    
    /**
     * Initializes UI components and event listeners
     */
    initialize() {
        // Set up settings UI
        this.initializeSettings();
        
        // Set up main menu
        document.getElementById('startButton').addEventListener('click', () => this.showCharacterSelect());
        document.getElementById('continueButton').addEventListener('click', () => this.showCharacterSelect());
        document.getElementById('resetButton').addEventListener('click', () => this.confirmReset());
        
        // Set up navigation buttons
        document.getElementById('backToMainButton').addEventListener('click', () => this.showMainMenu());
        document.getElementById('backToCharactersButton').addEventListener('click', () => this.showCharacterSelect());
        document.getElementById('backToLocationsButton').addEventListener('click', () => this.confirmEndDate());
        document.getElementById('returnToLocationSelect').addEventListener('click', () => this.showLocationSelect());
        
        // Set up custom response
        document.getElementById('sendCustomResponse').addEventListener('click', () => this.sendCustomResponse());
        document.getElementById('customResponseInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendCustomResponse();
            }
        });
        
        // Check for saved data to enable/disable continue button
        this.updateContinueButton();
    }
    
    /**
     * Initializes settings UI and event listeners
     */
    initializeSettings() {
        const settingsButton = document.getElementById('settingsButton');
        const closeSettings = document.getElementById('closeSettings');
        const settingsModal = document.getElementById('settingsModal');
        
        // Speech settings
        const ttsEnabled = document.getElementById('ttsEnabled');
        const speechRate = document.getElementById('speechRate');
        const speechRateValue = document.getElementById('speechRateValue');
        const speechVolume = document.getElementById('speechVolume');
        const speechVolumeValue = document.getElementById('speechVolumeValue');
        const textSpeed = document.getElementById('textSpeed');
        const textSpeedValue = document.getElementById('textSpeedValue');
        
        // Load saved settings
        ttsEnabled.checked = getFromStorage('heartStrings_ttsEnabled', true);
        speechRate.value = getFromStorage('heartStrings_speechRate', 1.0);
        speechRateValue.textContent = speechRate.value;
        speechVolume.value = getFromStorage('heartStrings_speechVolume', 1.0);
        speechVolumeValue.textContent = speechVolume.value;
        textSpeed.value = getFromStorage('heartStrings_textSpeed', 50);
        textSpeedValue.textContent = textSpeed.value;
        
        // Apply saved settings
        ttsManager.setEnabled(ttsEnabled.checked);
        ttsManager.setSpeechRate(parseFloat(speechRate.value));
        ttsManager.setSpeechVolume(parseFloat(speechVolume.value));
        this.textSpeed = parseInt(textSpeed.value);
        
        // Settings button handlers
        settingsButton.addEventListener('click', () => {
            settingsModal.classList.remove('hidden');
        });
        
        closeSettings.addEventListener('click', () => {
            settingsModal.classList.add('hidden');
        });
        
        // TTS toggle
        ttsEnabled.addEventListener('change', () => {
            ttsManager.setEnabled(ttsEnabled.checked);
            setInStorage('heartStrings_ttsEnabled', ttsEnabled.checked);
        });
        
        // Speech rate slider
        speechRate.addEventListener('input', () => {
            speechRateValue.textContent = speechRate.value;
            ttsManager.setSpeechRate(parseFloat(speechRate.value));
            setInStorage('heartStrings_speechRate', speechRate.value);
        });
        
        // Speech volume slider
        speechVolume.addEventListener('input', () => {
            speechVolumeValue.textContent = speechVolume.value;
            ttsManager.setSpeechVolume(parseFloat(speechVolume.value));
            setInStorage('heartStrings_speechVolume', speechVolume.value);
        });
        
        // Text speed slider
        textSpeed.addEventListener('input', () => {
            textSpeedValue.textContent = textSpeed.value;
            this.textSpeed = parseInt(textSpeed.value);
            setInStorage('heartStrings_textSpeed', textSpeed.value);
        });
    }
    
    /**
     * Shows the main menu
     */
    showMainMenu() {
        showScreen('mainMenuScreen');
        this.currentScreen = 'mainMenuScreen';
        this.updateContinueButton();
    }
    
    /**
     * Updates the continue button based on saved data
     */
    updateContinueButton() {
        const continueButton = document.getElementById('continueButton');
        const relationships = this.relationshipManager.getAllRelationshipSummaries();
        
        // Check if any character has a relationship score > 0
        const hasProgress = relationships.some(rel => rel.score > 0);
        
        if (hasProgress) {
            continueButton.disabled = false;
            continueButton.style.opacity = '1';
        } else {
            continueButton.disabled = true;
            continueButton.style.opacity = '0.5';
        }
    }
    
    /**
     * Shows the character selection screen
     */
    async showCharacterSelect() {
        showScreen('characterSelectScreen');
        this.currentScreen = 'characterSelectScreen';
        
        const charactersContainer = document.getElementById('charactersContainer');
        charactersContainer.innerHTML = '';
        
        // Get relationship data for all characters
        const relationships = this.relationshipManager.getAllRelationshipSummaries();
        
        // Create character cards
        for (const character of characterData) {
            const relationship = relationships.find(rel => rel.id === character.id) || 
                                { score: 0, stage: 'Strangers' };
            
            const card = document.createElement('div');
            card.className = 'character-card';
            card.dataset.id = character.id;
            
            const imageContainer = document.createElement('div');
            imageContainer.className = 'character-image';
            
            // Start with placeholder while image loads
            const placeholder = document.createElement('div');
            placeholder.className = 'character-placeholder';
            placeholder.textContent = 'Loading...';
            imageContainer.appendChild(placeholder);
            
            // Generate character image
            try {
                const prompt = createCharacterImagePrompt(character);
                const imageUrl = await imageGenerator.getImage(prompt, '1:1', character.imageSeed);
                
                const img = document.createElement('img');
                img.src = imageUrl;
                img.alt = character.name;
                img.onload = () => {
                    imageContainer.innerHTML = '';
                    imageContainer.appendChild(img);
                };
            } catch (error) {
                console.error(`Error loading image for ${character.name}:`, error);
                placeholder.textContent = 'Image unavailable';
            }
            
            const info = document.createElement('div');
            info.className = 'character-info';
            info.innerHTML = `
                <h3>${character.name}</h3>
                <div class="relationship-indicator">${relationship.stage}</div>
            `;
            
            card.appendChild(imageContainer);
            card.appendChild(info);
            
            // Add click handler
            card.addEventListener('click', () => {
                this.selectCharacter(character);
            });
            
            charactersContainer.appendChild(card);
        }
    }
    
    /**
     * Handles character selection
     * @param {Object} character - Selected character
     */
    selectCharacter(character) {
        this.selectedCharacter = character;
        this.showLocationSelect();
    }
    
    /**
     * Shows the location selection screen
     */
    async showLocationSelect() {
        if (!this.selectedCharacter) {
            this.showCharacterSelect();
            return;
        }
        
        showScreen('locationSelectScreen');
        this.currentScreen = 'locationSelectScreen';
        
        // Update selected character preview
        document.getElementById('selectedCharacterName').textContent = this.selectedCharacter.name;
        
        const relationshipStage = this.relationshipManager.getRelationshipStage(this.selectedCharacter.id);
        document.getElementById('relationshipStatus').textContent = `${relationshipStage.name}: ${relationshipStage.description}`;
        
        const characterImgContainer = document.getElementById('selectedCharacterImage');
        characterImgContainer.innerHTML = '';
        
        // Load character image
        try {
            const prompt = createCharacterImagePrompt(this.selectedCharacter);
            const imageUrl = await imageGenerator.getImage(prompt, '1:1', this.selectedCharacter.imageSeed);
            
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = this.selectedCharacter.name;
            characterImgContainer.appendChild(img);
        } catch (error) {
            console.error(`Error loading character preview image:`, error);
            characterImgContainer.textContent = 'Image unavailable';
        }
        
        // Populate locations
        const locationsContainer = document.getElementById('locationsContainer');
        locationsContainer.innerHTML = '';
        
        for (const location of locationData) {
            const card = document.createElement('div');
            card.className = 'location-card';
            card.dataset.id = location.id;
            
            const imageContainer = document.createElement('div');
            imageContainer.className = 'location-image';
            
            // Start with placeholder while image loads
            const placeholder = document.createElement('div');
            placeholder.className = 'character-placeholder';
            placeholder.textContent = 'Loading...';
            imageContainer.appendChild(placeholder);
            
            // Generate location image
            try {
                const imageUrl = await imageGenerator.getImage(location.promptTemplate, '16:9', location.imageSeed);
                
                const img = document.createElement('img');
                img.src = imageUrl;
                img.alt = location.name;
                img.onload = () => {
                    imageContainer.innerHTML = '';
                    imageContainer.appendChild(img);
                };
            } catch (error) {
                console.error(`Error loading image for ${location.name}:`, error);
                placeholder.textContent = 'Image unavailable';
            }
            
            const info = document.createElement('div');
            info.className = 'location-info';
            info.innerHTML = `
                <h3>${location.name}</h3>
                <div class="location-description">${location.description}</div>
            `;
            
            card.appendChild(imageContainer);
            card.appendChild(info);
            
            // Add click handler
            card.addEventListener('click', () => {
                this.selectLocation(location);
            });
            
            locationsContainer.appendChild(card);
        }
    }
    
    /**
     * Handles location selection
     * @param {Object} location - Selected location
     */
    selectLocation(location) {
        this.selectedLocation = location;
        this.startDate();
    }
    
    /**
     * Starts a date with selected character at selected location
     */
    async startDate() {
        if (!this.selectedCharacter || !this.selectedLocation) {
            return;
        }
        
        showScreen('dateScreen');
        this.currentScreen = 'dateScreen';
        
        // Reset date state
        this.relationshipChange = 0;
        this.dateDuration = 0;
        this.responseOptions = [];
        
        // Set dialogue context
        this.dialogueManager.setContext(this.selectedCharacter, this.selectedLocation);
        
        // Update UI elements
        document.getElementById('characterName').textContent = this.selectedCharacter.name;
        document.getElementById('dialogueText').textContent = '';
        document.getElementById('responseOptions').innerHTML = '';
        document.getElementById('customResponseInput').value = '';
        
        // Load character and location images
        const characterImgContainer = document.getElementById('dateCharacterImage');
        const locationImgContainer = document.getElementById('dateLocationImage');
        
        characterImgContainer.innerHTML = '';
        locationImgContainer.innerHTML = '';
        
        try {
            // Load location image
            const locationUrl = await imageGenerator.getImage(this.selectedLocation.promptTemplate, '16:9', this.selectedLocation.imageSeed);
            const locationImg = document.createElement('img');
            locationImg.src = locationUrl;
            locationImg.alt = this.selectedLocation.name;
            locationImgContainer.appendChild(locationImg);
            
            // Load character image
            const characterPrompt = createCharacterImagePrompt(this.selectedCharacter);
            const characterUrl = await imageGenerator.getImage(characterPrompt, '1:1', this.selectedCharacter.imageSeed);
            const characterImg = document.createElement('img');
            characterImg.src = characterUrl;
            characterImg.alt = this.selectedCharacter.name;
            characterImgContainer.appendChild(characterImg);
        } catch (error) {
            console.error('Error loading date images:', error);
        }
        
        // Generate greeting
        await this.showTypingIndicator();
        const greeting = await this.dialogueManager.generateGreeting();
        this.displayDialogue(greeting);
        
        // Generate initial response options
        this.updateResponseOptions();
        
        // Start date timer
        this.startDateTimer();
    }
    
    /**
     * Shows a typing indicator in the dialogue box
     */
    async showTypingIndicator() {
        const dialogueText = document.getElementById('dialogueText');
        dialogueText.innerHTML = '<span class="typing-indicator">Typing<span>.</span><span>.</span><span>.</span></span>';
    }
    
    /**
     * Displays character dialogue with typing animation
     * @param {string} text - Dialogue text
     */
    displayDialogue(text) {
        // Clear any existing typing animation
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
            this.typingTimeout = null;
        }
        
        const dialogueText = document.getElementById('dialogueText');
        
        // If typing is fast enough, just show the text immediately
        if (this.textSpeed >= 90) {
            dialogueText.textContent = text;
            
            // Read the text aloud
            if (this.selectedCharacter) {
                ttsManager.speak(text, this.selectedCharacter.gender);
            }
            return;
        }
        
        // Otherwise, do typing animation
        this.isTyping = true;
        dialogueText.textContent = '';
        
        // Read the text aloud
        if (this.selectedCharacter) {
            ttsManager.speak(text, this.selectedCharacter.gender);
        }
        
        // Calculate typing speed - lower is slower
        const typeDelay = 100 - this.textSpeed;
        
        let i = 0;
        const typeNextChar = () => {
            if (i < text.length) {
                dialogueText.textContent += text.charAt(i);
                i++;
                this.typingTimeout = setTimeout(typeNextChar, typeDelay);
            } else {
                this.isTyping = false;
                this.typingTimeout = null;
            }
        };
        
        typeNextChar();
    }
    
    /**
     * Updates the response options
     */
    async updateResponseOptions() {
        const optionsContainer = document.getElementById('responseOptions');
        optionsContainer.innerHTML = '';
        
        // Show loading state
        const loadingEl = document.createElement('div');
        loadingEl.className = 'loading-option';
        loadingEl.textContent = 'Generating options...';
        optionsContainer.appendChild(loadingEl);
        
        try {
            // Generate options
            this.responseOptions = await this.dialogueManager.generateResponseOptions(4);
            
            // Clear loading state
            optionsContainer.innerHTML = '';
            
            // Create option buttons
            this.responseOptions.forEach((option, index) => {
                const button = document.createElement('button');
                button.className = 'response-option';
                button.textContent = option.text;
                button.dataset.index = index;
                
                button.addEventListener('click', () => {
                    this.handleResponseSelection(index);
                });
                
                optionsContainer.appendChild(button);
            });
        } catch (error) {
            console.error('Error generating response options:', error);
            optionsContainer.innerHTML = '<div class="error-message">Could not generate options. Try custom response.</div>';
        }
    }
    
    /**
     * Handles response option selection
     * @param {number} index - Selected option index
     */
    async handleResponseSelection(index) {
        const selectedOption = this.responseOptions[index];
        if (!selectedOption) return;
        
        // Disable all response options
        const optionButtons = document.querySelectorAll('.response-option');
        optionButtons.forEach(button => {
            button.disabled = true;
            button.style.opacity = '0.6';
        });
        
        const customInput = document.getElementById('customResponseInput');
        const sendButton = document.getElementById('sendCustomResponse');
        customInput.disabled = true;
        sendButton.disabled = true;
        
        // Display player's response
        const dialogueText = document.getElementById('dialogueText');
        const playerName = 'You'; // Could be customizable in the future
        dialogueText.innerHTML = `<strong>${playerName}:</strong> ${selectedOption.text}`;
        
        // Get character response
        await this.showTypingIndicator();
        
        const response = await this.dialogueManager.respondToPlayer(selectedOption.text);
        
        // Update relationship based on impact
        const relationshipUpdate = this.relationshipManager.updateRelationship(
            this.selectedCharacter.id, 
            response.impact
        );
        
        this.relationshipChange += response.impact;
        
        // Display character response
        this.displayDialogue(response.text);
        
        // Re-enable inputs
        customInput.disabled = false;
        sendButton.disabled = false;
        
        // Generate new response options
        this.updateResponseOptions();
        
        // Check for relationship stage change
        if (relationshipUpdate.stageChanged && relationshipUpdate.newStage.threshold > relationshipUpdate.oldStage.threshold) {
            // Show relationship progression notification
            this.showRelationshipProgressNotification(relationshipUpdate);
        }
    }
    
    /**
     * Handles custom response input
     */
    async sendCustomResponse() {
        const customInput = document.getElementById('customResponseInput');
        const playerMessage = customInput.value.trim();
        
        if (!playerMessage) return;
        
        // Disable inputs
        customInput.disabled = true;
        document.getElementById('sendCustomResponse').disabled = true;
        
        const optionButtons = document.querySelectorAll('.response-option');
        optionButtons.forEach(button => {
            button.disabled = true;
            button.style.opacity = '0.6';
        });
        
        // Display player's response
        const dialogueText = document.getElementById('dialogueText');
        const playerName = 'You'; // Could be customizable in the future
        dialogueText.innerHTML = `<strong>${playerName}:</strong> ${playerMessage}`;
        
        // Clear input
        customInput.value = '';
        
        // Get character response
        await this.showTypingIndicator();
        
        const response = await this.dialogueManager.respondToPlayer(playerMessage);
        
        // Update relationship based on impact
        const relationshipUpdate = this.relationshipManager.updateRelationship(
            this.selectedCharacter.id, 
            response.impact
        );
        
        this.relationshipChange += response.impact;
        
        // Display character response
        this.displayDialogue(response.text);
        
        // Re-enable inputs
        customInput.disabled = false;
        document.getElementById('sendCustomResponse').disabled = false;
        
        // Generate new response options
        this.updateResponseOptions();
        
        // Check for relationship stage change
        if (relationshipUpdate.stageChanged && relationshipUpdate.newStage.threshold > relationshipUpdate.oldStage.threshold) {
            // Show relationship progression notification
            this.showRelationshipProgressNotification(relationshipUpdate);
        }
    }
    
    /**
     * Shows a notification when relationship progresses to a new stage
     * @param {Object} update - Relationship update info
     */
    showRelationshipProgressNotification(update) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'relationship-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <h3>Relationship Improved!</h3>
                <p>Your relationship with ${this.selectedCharacter.name} has reached a new stage:</p>
                <p class="new-stage">${update.newStage.name}</p>
                <p>${update.newStage.description}</p>
            </div>
        `;
        
        // Add notification styles if not already in document
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .relationship-notification {
                    position: fixed;
                    top: 20%;
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: var(--primary-color);
                    color: white;
                    padding: 1.5rem;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                    z-index: 2000;
                    text-align: center;
                    animation: notification-fade 5s forwards;
                    max-width: 80%;
                }
                
                .notification-content h3 {
                    margin-top: 0;
                    margin-bottom: 0.5rem;
                }
                
                .new-stage {
                    font-size: 1.2rem;
                    font-weight: bold;
                    margin: 0.5rem 0;
                }
                
                @keyframes notification-fade {
                    0% { opacity: 0; transform: translate(-50%, -20px); }
                    10% { opacity: 1; transform: translate(-50%, 0); }
                    80% { opacity: 1; transform: translate(-50%, 0); }
                    100% { opacity: 0; transform: translate(-50%, -20px); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Add to document and remove after animation
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
    
    /**
     * Starts the date timer
     */
    startDateTimer() {
        // Clear any existing timer
        if (this.dateTimer) {
            clearInterval(this.dateTimer);
        }
        
        this.dateStartTime = Date.now();
        this.dateDuration = 0;
        
        // Set random date length between 1-15 minutes based on relationship stage
        const relationshipStage = this.relationshipManager.getRelationshipStage(this.selectedCharacter.id);
        const stageIndex = relationshipStages.indexOf(relationshipStage);
        
        // Higher relationship = longer dates
        const minDateLength = 60; // 1 minute in seconds
        const maxDateLength = 60 * (5 + (stageIndex * 2)); // 5-15 minutes based on stage
        
        const dateLength = Math.floor(Math.random() * (maxDateLength - minDateLength + 1)) + minDateLength;
        
        // Update timer display
        const timerElement = document.getElementById('timeRemaining');
        timerElement.textContent = formatTime(dateLength);
        
        this.dateTimer = setInterval(() => {
            this.dateDuration = Math.floor((Date.now() - this.dateStartTime) / 1000);
            const timeRemaining = Math.max(0, dateLength - this.dateDuration);
            
            timerElement.textContent = formatTime(timeRemaining);
            
            // End date when time runs out
            if (timeRemaining <= 0) {
                clearInterval(this.dateTimer);
                this.dateTimer = null;
                this.endDate();
            }
        }, 1000);
    }
    
    /**
     * Confirms ending the date early
     */
    async confirmEndDate() {
        const confirmed = await showConfirmation(
            'End Date?',
            'Are you sure you want to end this date? You can choose a farewell message before leaving.'
        );
        
        if (confirmed) {
            this.endDate();
        }
    }
    
    /**
     * Ends the current date and shows summary
     */
    async endDate() {
        // Stop the timer
        if (this.dateTimer) {
            clearInterval(this.dateTimer);
            this.dateTimer = null;
        }
        
        // Show the date end screen
        showScreen('dateEndScreen');
        this.currentScreen = 'dateEndScreen';
        
        // Generate date summary
        const durationMinutes = Math.max(1, Math.floor(this.dateDuration / 60));
        const summary = await this.dialogueManager.generateDateSummary(
            durationMinutes,
            this.relationshipChange
        );
        
        document.getElementById('dateEndSummary').textContent = summary;
        
        // Show relationship change
        const relationshipChangeEl = document.getElementById('relationshipChange');
        if (this.relationshipChange > 0) {
            relationshipChangeEl.textContent = `Relationship improved (+${this.relationshipChange} points)`;
            relationshipChangeEl.style.color = 'var(--success-color)';
        } else if (this.relationshipChange < 0) {
            relationshipChangeEl.textContent = `Relationship worsened (${this.relationshipChange} points)`;
            relationshipChangeEl.style.color = 'var(--negative-color)';
        } else {
            relationshipChangeEl.textContent = 'Relationship unchanged';
            relationshipChangeEl.style.color = 'var(--light-text)';
        }
        
        // Generate farewell options
        this.farewellOptions = await this.dialogueManager.generateFarewellOptions();
        
        const farewellContainer = document.getElementById('farewellOptions');
        farewellContainer.innerHTML = '';
        
        this.farewellOptions.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'farewell-option';
            button.textContent = option.text;
            
            button.addEventListener('click', () => {
                this.handleFarewellSelection(index);
            });
            
            farewellContainer.appendChild(button);
        });
    }
    
    /**
     * Handles farewell option selection
     * @param {number} index - Selected farewell index
     */
    handleFarewellSelection(index) {
        const option = this.farewellOptions[index];
        if (!option) return;
        
        // Apply final relationship adjustment
        const impact = RESPONSE_IMPACT[option.impact] || RESPONSE_IMPACT.NEUTRAL;
        this.relationshipManager.updateRelationship(
            this.selectedCharacter.id,
            impact
        );
        
        // Disable all options
        const buttons = document.querySelectorAll('.farewell-option');
        buttons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.6';
        });
        
        // Highlight selected option
        buttons[index].style.backgroundColor = 'var(--response-selected)';
        buttons[index].style.opacity = '1';
    }
    
    /**
     * Shows confirmation for resetting all progress
     */
    async confirmReset() {
        const confirmed = await showConfirmation(
            'Reset Progress?',
            'Are you sure you want to reset all progress? This will delete all relationship data and memories.'
        );
        
        if (confirmed) {
            // Reset all data
            this.relationshipManager.resetAllRelationships();
            this.memoryManager.clearAllMemories();
            
            // Update UI
            this.updateContinueButton();
            
            // Show confirmation
            alert('All progress has been reset.');
        }
    }
}

