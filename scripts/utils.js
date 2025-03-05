/**
 * Utility Functions for Heart Strings
 */

/**
 * Safely gets a value from localStorage with a default fallback
 * @param {string} key - The localStorage key
 * @param {*} defaultValue - The default value if key is not found
 * @returns {*} The retrieved value or default
 */
function getFromStorage(key, defaultValue) {
    try {
        const value = localStorage.getItem(key);
        return value !== null ? JSON.parse(value) : defaultValue;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return defaultValue;
    }
}

/**
 * Safely sets a value in localStorage
 * @param {string} key - The localStorage key
 * @param {*} value - The value to store
 */
function setInStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Error writing to localStorage:', error);
    }
}

/**
 * Shows a confirmation dialog with custom message
 * @param {string} title - The confirmation title
 * @param {string} message - The confirmation message
 * @returns {Promise<boolean>} Resolves to true if confirmed, false otherwise
 */
function showConfirmation(title, message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmationModal');
        const titleEl = document.getElementById('confirmationTitle');
        const messageEl = document.getElementById('confirmationMessage');
        const yesButton = document.getElementById('confirmYes');
        const noButton = document.getElementById('confirmNo');

        titleEl.textContent = title;
        messageEl.textContent = message;
        modal.classList.remove('hidden');

        function handleYes() {
            cleanup();
            resolve(true);
        }

        function handleNo() {
            cleanup();
            resolve(false);
        }

        function cleanup() {
            yesButton.removeEventListener('click', handleYes);
            noButton.removeEventListener('click', handleNo);
            modal.classList.add('hidden');
        }

        yesButton.addEventListener('click', handleYes);
        noButton.addEventListener('click', handleNo);
    });
}

/**
 * Shows a screen and hides all others
 * @param {string} screenId - The ID of the screen to show
 */
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    document.getElementById(screenId).classList.remove('hidden');
}

/**
 * Creates a loading element with specified message
 * @param {string} message - The loading message
 * @returns {HTMLElement} The loading element
 */
function createLoadingElement(message = 'Loading...') {
    const loadingEl = document.createElement('div');
    loadingEl.className = 'loading-placeholder';
    loadingEl.innerHTML = `
        <div class="loading-spinner"></div>
        <p>${message}</p>
    `;
    return loadingEl;
}

/**
 * Gets a random item from an array
 * @param {Array} array - The array to select from
 * @returns {*} A random item from the array
 */
function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Gets the time in minutes and seconds format
 * @param {number} seconds - Total seconds
 * @returns {string} Formatted time string
 */
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Shuffles an array in place
 * @param {Array} array - The array to shuffle
 * @returns {Array} The shuffled array
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Creates a character-specific LLM system prompt
 * @param {Object} character - The character object
 * @param {string} relationship - The current relationship stage
 * @param {Object} location - The current location object
 * @returns {string} The system prompt
 */
function createCharacterSystemPrompt(character, relationship, location) {
    return `You are ${character.name}, a character in a dating simulator game. Respond in first person as ${character.name}.
Your personality: ${character.personality}
Your background: ${character.background}
Your interests: ${character.interests.join(', ')}
Current relationship: ${relationship}
Current location: ${location.name} - ${location.atmosphere} - ${location.description}

When generating responses:
1. Stay in character with the personality, interests, and background described above
2. Be conversational and responsive to the player's messages
3. Remember past interactions with the player if mentioned
4. Include occasional references to the current location
5. Your responses should be 1-3 short paragraphs
6. Based on the relationship stage, adjust intimacy level appropriately
7. Show appropriate emotional reactions to the player's messages
8. Never break character or refer to yourself as an AI

Important: Keep all responses appropriate for a general audience. Avoid explicit or adult content.`;
}

/**
 * Creates a prompt for generating character image
 * @param {Object} character - The character object
 * @param {string} emotion - Optional emotion to show
 * @returns {string} The image generation prompt
 */
function createCharacterImagePrompt(character, emotion = 'neutral') {
    let emotionModifier = '';
    switch (emotion) {
        case 'happy':
            emotionModifier = ', smiling broadly, happy expression';
            break;
        case 'sad':
            emotionModifier = ', sad expression, slightly downcast';
            break;
        case 'surprised':
            emotionModifier = ', surprised expression, eyes wide';
            break;
        case 'angry':
            emotionModifier = ', annoyed expression, slightly frowning';
            break;
        case 'flirty':
            emotionModifier = ', flirtatious smile, playful expression';
            break;
        default:
            emotionModifier = ', neutral expression';
    }
    
    return `${character.promptTemplate}${emotionModifier}, high quality, detailed, 4k, portrait style, looking at viewer`;
}

