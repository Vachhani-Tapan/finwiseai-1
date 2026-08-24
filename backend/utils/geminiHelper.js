import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini API Key Rotation Helper
 * 
 * Stores multiple API keys and automatically rotates to the next one
 * when a key hits its rate limit or quota.
 */

// Parse comma-separated keys from environment variable
function getApiKeys() {
  const keys = process.env.GEMINI_API_KEYS
    ? process.env.GEMINI_API_KEYS.split(',').map(k => k.trim()).filter(Boolean)
    : [];

  // Also include the single key as a fallback
  if (process.env.GEMINI_API_KEY && !keys.includes(process.env.GEMINI_API_KEY.trim())) {
    keys.unshift(process.env.GEMINI_API_KEY.trim());
  }

  return keys;
}

let currentKeyIndex = 0;

/**
 * Generates AI content using Gemini with automatic key rotation.
 * If a key fails due to rate limiting or quota exhaustion, it tries the next key.
 * 
 * @param {string} prompt - The prompt to send to the model
 * @param {string} modelName - The Gemini model to use (default: 'gemini-3.6-flash')
 * @returns {Promise<string>} - The AI-generated response text
 */
export async function generateWithRotation(prompt, modelName = 'gemini-3.6-flash') {
  const keys = getApiKeys();

  if (keys.length === 0) {
    throw new Error('No Gemini API keys configured. Add GEMINI_API_KEY or GEMINI_API_KEYS to your .env file.');
  }

  let lastError = null;

  // Try each key, starting from the current index
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const keyIndex = (currentKeyIndex + attempt) % keys.length;
    const apiKey = keys[keyIndex];

    try {
      console.log(`[Gemini] Using API key #${keyIndex + 1} of ${keys.length} (starts with: ${apiKey.substring(0, 8)}...)`);

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      if (!responseText) {
        throw new Error('Empty response from Gemini');
      }

      // Success! Keep this key as the current one
      currentKeyIndex = keyIndex;
      return responseText;

    } catch (error) {
      lastError = error;
      const errorMessage = error.message || '';
      const isRateLimited = 
        errorMessage.includes('429') ||
        errorMessage.includes('quota') ||
        errorMessage.includes('rate') ||
        errorMessage.includes('Resource has been exhausted') ||
        errorMessage.includes('RESOURCE_EXHAUSTED') ||
        error.status === 429;

      if (isRateLimited && attempt < keys.length - 1) {
        console.warn(`[Gemini] Key #${keyIndex + 1} is rate-limited/exhausted. Rotating to next key...`);
        // Move to the next key for future requests too
        currentKeyIndex = (keyIndex + 1) % keys.length;
        continue;
      }

      // If it's not a rate limit error, or we've tried all keys, throw
      throw error;
    }
  }

  // If all keys failed
  throw lastError || new Error('All Gemini API keys have been exhausted.');
}

/**
 * Returns the count of configured API keys (for health checks / logging)
 */
export function getKeyCount() {
  return getApiKeys().length;
}
