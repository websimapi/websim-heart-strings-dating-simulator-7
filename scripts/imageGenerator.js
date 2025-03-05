/**
 * Image Generator Service for Heart Strings
 */
class ImageGenerator {
    constructor() {
        this.imageCache = {};
        this.pendingRequests = new Map();
        this.failureCount = 0;
        this.maxRetries = 3;
    }
    
    /**
     * Gets an image URL from cache or generates a new one
     * @param {string} prompt - Image generation prompt
     * @param {string} aspect - Aspect ratio
     * @param {number} seed - Seed for consistent generation
     * @returns {Promise<string>} The image URL
     */
    async getImage(prompt, aspect = '1:1', seed = null) {
        // Create a cache key from the parameters
        const cacheKey = `${prompt}|${aspect}|${seed}`;
        
        // Return from cache if available
        if (this.imageCache[cacheKey]) {
            return this.imageCache[cacheKey];
        }
        
        // Check if this request is already pending
        if (this.pendingRequests.has(cacheKey)) {
            return this.pendingRequests.get(cacheKey);
        }
        
        // Create a new promise for this request
        const promise = this._generateImage(prompt, aspect, seed, cacheKey);
        this.pendingRequests.set(cacheKey, promise);
        
        try {
            const result = await promise;
            // Clean up the pending request and return the result
            this.pendingRequests.delete(cacheKey);
            return result;
        } catch (error) {
            // Clean up the pending request and rethrow
            this.pendingRequests.delete(cacheKey);
            throw error;
        }
    }
    
    /**
     * Internal method to handle image generation
     * @param {string} prompt - Image generation prompt
     * @param {string} aspect - Aspect ratio
     * @param {number} seed - Seed for consistent generation
     * @param {string} cacheKey - Key for caching
     * @param {number} retryCount - Current retry attempt
     * @returns {Promise<string>} The image URL
     */
    async _generateImage(prompt, aspect, seed, cacheKey, retryCount = 0) {
        try {
            // Generate image using the websim.imageGen API
            let options = { prompt };
            
            // Add aspect ratio or dimensions
            if (aspect) {
                options.aspect_ratio = aspect;
            }
            
            // Add seed if provided
            if (seed !== null && seed !== undefined) {
                options.seed = seed;
            }
            
            const result = await websim.imageGen(options);
            
            if (result && result.url) {
                // Cache the successful result
                this.imageCache[cacheKey] = result.url;
                this.failureCount = 0; // Reset failure count on success
                return result.url;
            } else {
                throw new Error('Image generation returned invalid result');
            }
        } catch (error) {
            console.error('Image generation error:', error);
            this.failureCount++;
            
            // Retry logic
            if (retryCount < this.maxRetries) {
                console.log(`Retrying image generation (${retryCount + 1}/${this.maxRetries})...`);
                return this._generateImage(prompt, aspect, seed, cacheKey, retryCount + 1);
            }
            
            // If too many failures, return a placeholder
            if (this.failureCount > 5) {
                console.warn('Too many image generation failures, using placeholder');
                return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%23f0f0f0"/><text x="50%" y="50%" font-family="Arial" font-size="20" text-anchor="middle" fill="%23999">Image Unavailable</text></svg>';
            }
            
            throw error;
        }
    }
    
    /**
     * Clears the image cache
     */
    clearCache() {
        this.imageCache = {};
    }
    
    /**
     * Preloads images for characters and locations
     * @param {Array} characters - Character data array
     * @param {Array} locations - Location data array
     */
    async preloadEssentialImages(characters, locations) {
        const preloadPromises = [];
        
        // Preload character images
        for (const character of characters) {
            const prompt = createCharacterImagePrompt(character);
            preloadPromises.push(
                this.getImage(prompt, '1:1', character.imageSeed)
                    .catch(err => console.warn(`Failed to preload image for ${character.name}:`, err))
            );
        }
        
        // Preload location images
        for (const location of locations) {
            preloadPromises.push(
                this.getImage(location.promptTemplate, '16:9', location.imageSeed)
                    .catch(err => console.warn(`Failed to preload image for ${location.name}:`, err))
            );
        }
        
        // Wait for all preloads to complete or fail
        await Promise.allSettled(preloadPromises);
    }
}

// Create global instance
const imageGenerator = new ImageGenerator();

