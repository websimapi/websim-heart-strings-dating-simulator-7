/**
 * Text-to-Speech Manager for Heart Strings
 */
class TTSManager {
    constructor() {
        this.enabled = true;
        this.rate = 1.0;
        this.volume = 1.0;
        this.voiceMap = {}; // Maps gender to voice
        this.currentUtterance = null;
        this.utteranceQueue = [];
        this.isProcessingQueue = false;
        
        // Initialize available voices when the window loads
        if (window.speechSynthesis) {
            this.loadVoices();
            // Some browsers need this event to get voices
            speechSynthesis.onvoiceschanged = () => this.loadVoices();
        } else {
            console.warn('Text-to-speech is not supported in this browser');
            this.enabled = false;
        }
    }
    
    /**
     * Loads and categorizes available voices
     */
    loadVoices() {
        if (!window.speechSynthesis) return;
        
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) return;
        
        const femaleVoices = voices.filter(voice => 
            voice.name.toLowerCase().includes('female') || 
            voice.name.toLowerCase().includes('woman') ||
            voice.name.toLowerCase().includes('girl')
        );
        
        const maleVoices = voices.filter(voice => 
            voice.name.toLowerCase().includes('male') || 
            voice.name.toLowerCase().includes('man') ||
            voice.name.toLowerCase().includes('boy')
        );
        
        // Assign default voices based on availability
        if (femaleVoices.length > 0) {
            this.voiceMap['female'] = femaleVoices[0];
        } else {
            this.voiceMap['female'] = voices[0];
        }
        
        if (maleVoices.length > 0) {
            this.voiceMap['male'] = maleVoices[0];
        } else {
            this.voiceMap['male'] = voices[0];
        }
    }
    
    /**
     * Toggles TTS on/off
     * @param {boolean} enabled - Whether to enable TTS
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled && this.currentUtterance) {
            window.speechSynthesis.cancel();
            this.currentUtterance = null;
            this.utteranceQueue = [];
            this.isProcessingQueue = false;
        }
    }
    
    /**
     * Sets the speech rate
     * @param {number} rate - Speech rate (0.5 to 2.0)
     */
    setSpeechRate(rate) {
        this.rate = Math.max(0.5, Math.min(2.0, rate));
    }
    
    /**
     * Sets the speech volume
     * @param {number} volume - Speech volume (0.0 to 1.0)
     */
    setSpeechVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
    
    /**
     * Splits text into sentences
     * @param {string} text - Text to split
     * @returns {string[]} Array of sentences
     */
    splitIntoSentences(text) {
        // Custom regex to split by sentence endings but handle common abbreviations
        const sentenceRegex = /[.!?]+(?=\s+|$)/g;
        let sentences = [];
        let lastIndex = 0;
        
        // Find all sentence endings
        let match;
        while ((match = sentenceRegex.exec(text)) !== null) {
            sentences.push(text.substring(lastIndex, match.index + match[0].length));
            lastIndex = match.index + match[0].length;
        }
        
        // Add any remaining text as the last sentence
        if (lastIndex < text.length) {
            sentences.push(text.substring(lastIndex));
        }
        
        // If no sentences were found, return the whole text as one sentence
        if (sentences.length === 0) {
            sentences.push(text);
        }
        
        return sentences.map(s => s.trim()).filter(s => s.length > 0);
    }
    
    /**
     * Speaks text for a character
     * @param {string} text - Text to speak
     * @param {string} gender - Character gender ('male' or 'female')
     */
    speak(text, gender) {
        if (!this.enabled || !window.speechSynthesis) return;
        
        // Stop any current speech
        this.stop();
        
        // Split text into sentences
        const sentences = this.splitIntoSentences(text);
        
        // Add each sentence to the queue
        sentences.forEach(sentence => {
            this.utteranceQueue.push({ text: sentence, gender });
        });
        
        // Start processing the queue if not already doing so
        if (!this.isProcessingQueue) {
            this.processUtteranceQueue();
        }
    }
    
    /**
     * Processes the utterance queue
     */
    processUtteranceQueue() {
        if (this.utteranceQueue.length === 0) {
            this.isProcessingQueue = false;
            return;
        }
        
        this.isProcessingQueue = true;
        const { text, gender } = this.utteranceQueue.shift();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.voiceMap[gender] || null;
        utterance.rate = this.rate;
        utterance.volume = this.volume;
        
        utterance.onend = () => {
            this.currentUtterance = null;
            setTimeout(() => this.processUtteranceQueue(), 150); // Small pause between sentences
        };
        
        utterance.onerror = (event) => {
            console.error('TTS error:', event);
            this.currentUtterance = null;
            this.processUtteranceQueue();
        };
        
        this.currentUtterance = utterance;
        window.speechSynthesis.speak(utterance);
    }
    
    /**
     * Stops any current speech
     */
    stop() {
        if (!window.speechSynthesis) return;
        
        window.speechSynthesis.cancel();
        this.currentUtterance = null;
        this.utteranceQueue = [];
        this.isProcessingQueue = false;
    }
}

// Create global instance
const ttsManager = new TTSManager();

