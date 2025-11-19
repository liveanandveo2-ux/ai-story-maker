// Test script for API key validation
import { validateApiKey } from './backend/utils/apiValidators.js';

console.log('Testing OpenAI API key validation:');
console.log('=' * 50);

const testKeys = [
  'sk-proj-abc123def456',
  'sk-proj-test-key-123',
  'sk-proj-',
  'sk-123456789',
  'sk-key',
  'invalid-key',
  'regular-key'
];

testKeys.forEach(key => {
  const result = validateApiKey(key, 'openai');
  console.log(`${key}: ${result.isValid ? '✅ VALID' : '❌ INVALID'} - ${result.error || 'OK'}`);
});