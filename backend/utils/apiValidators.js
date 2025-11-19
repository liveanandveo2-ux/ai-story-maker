/**
 * API Key Validation Utilities
 * Provides consistent validation patterns across all AI services
 */

// Common API key validation patterns
const API_KEY_PATTERNS = {
  openai: /^sk-[a-zA-Z0-9]{48}$/,
  huggingface: /^hf_[a-zA-Z0-9]{32,}$/,
  google: /^AIza[0-9A-Za-z_-]{35}$/,
  elevenlabs: /^[0-9a-f]{32}$/,
  stability: /^sk-[a-zA-Z0-9]{40,}$/
};

/**
 * Validate if an API key is properly formatted and not a placeholder
 * @param {string} apiKey - The API key to validate
 * @param {string} provider - The provider name (openai, huggingface, google, etc.)
 * @returns {Object} - Validation result with isValid boolean and error message
 */
function validateApiKey(apiKey, provider = 'openai') {
  if (!apiKey) {
    return { isValid: false, error: 'API key is required' };
  }

  if (typeof apiKey !== 'string') {
    return { isValid: false, error: 'API key must be a string' };
  }

  // Check for common placeholder values
  const placeholderPatterns = [
    'your_openai_api_key',
    'your_huggingface_api_key', 
    'your_google_ai_api_key',
    'your_google_api_key',
    'your_elevenlabs_api_key',
    'your_stability_api_key',
    'your_ai_api_key',
    'YOUR_API_KEY',
    'API_KEY',
    'change-me',
    'replace-me',
    'placeholder',
    'demo'
  ];

  const lowerKey = apiKey.toLowerCase();
  if (placeholderPatterns.some(pattern => lowerKey.includes(pattern.toLowerCase()))) {
    return { isValid: false, error: 'API key appears to be a placeholder value' };
  }

  // Check minimum length
  if (apiKey.length < 10) {
    return { isValid: false, error: 'API key is too short to be valid' };
  }

  // Check format pattern if available
  const pattern = API_KEY_PATTERNS[provider.toLowerCase()];
  if (pattern && !pattern.test(apiKey)) {
    return { isValid: false, error: `API key format doesn't match expected pattern for ${provider}` };
  }

  return { isValid: true, error: null };
}

/**
 * Validate OpenAI API key specifically
 * @param {string} apiKey - The OpenAI API key
 * @returns {boolean} - Whether the key is valid
 */
function validateOpenAIKey(apiKey) {
  const result = validateApiKey(apiKey, 'openai');
  return result.isValid;
}

/**
 * Validate HuggingFace API key
 * @param {string} apiKey - The HuggingFace API key  
 * @returns {boolean} - Whether the key is valid
 */
function validateHuggingFaceKey(apiKey) {
  const result = validateApiKey(apiKey, 'huggingface');
  return result.isValid;
}

/**
 * Validate Google AI API key
 * @param {string} apiKey - The Google AI API key
 * @returns {boolean} - Whether the key is valid
 */
function validateGoogleAIKey(apiKey) {
  const result = validateApiKey(apiKey, 'google');
  return result.isValid;
}

/**
 * Check if a service is properly configured with valid API key
 * @param {string} provider - Provider name
 * @returns {Object} - Configuration status
 */
function isServiceConfigured(provider) {
  const envVarMap = {
    openai: 'OPENAI_API_KEY',
    huggingface: 'HUGGINGFACE_API_KEY', 
    google: 'GOOGLE_AI_API_KEY',
    googleai: 'GOOGLE_AI_API_KEY',
    elevenlabs: 'ELEVENLABS_API_KEY',
    stability: 'STABILITY_API_KEY'
  };

  const envVar = envVarMap[provider.toLowerCase()];
  if (!envVar) {
    return { configured: false, reason: `Unknown provider: ${provider}` };
  }

  const apiKey = process.env[envVar];
  if (!apiKey) {
    return { configured: false, reason: `${envVar} environment variable not set` };
  }

  const validation = validateApiKey(apiKey, provider);
  if (!validation.isValid) {
    return { configured: false, reason: validation.error };
  }

  return { configured: true, reason: null };
}

/**
 * Get service configuration status for multiple providers
 * @param {Array} providers - Array of provider names
 * @returns {Object} - Status of each provider
 */
function getServicesStatus(providers) {
  const status = {};
  
  providers.forEach(provider => {
    status[provider] = isServiceConfigured(provider);
  });
  
  return status;
}

/**
 * Mask API key for logging (show only first and last 4 characters)
 * @param {string} apiKey - The API key to mask
 * @returns {string} - Masked API key
 */
function maskApiKey(apiKey) {
  if (!apiKey || apiKey.length < 8) {
    return '***';
  }
  
  const start = apiKey.substring(0, 4);
  const end = apiKey.substring(apiKey.length - 4);
  const middle = '*'.repeat(Math.min(apiKey.length - 8, 20));
  
  return `${start}${middle}${end}`;
}

module.exports = {
  validateApiKey,
  validateOpenAIKey,
  validateHuggingFaceKey, 
  validateGoogleAIKey,
  isServiceConfigured,
  getServicesStatus,
  maskApiKey,
  API_KEY_PATTERNS
};