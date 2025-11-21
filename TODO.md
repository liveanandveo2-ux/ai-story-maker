# API Fixes TODO

## 1. Update HuggingFace API Endpoints
- [ ] Replace outdated router.huggingface.co endpoints with current inference API
- [ ] Update model names to supported ones
- [ ] Fix text generation endpoints

## 2. Update Google AI API
- [ ] Update to correct Gemini model name and API version
- [ ] Fix endpoint URL for current Google AI API

## 3. Add Text Chunking for TTS
- [ ] Implement text splitting for long stories in ElevenLabs
- [ ] Add chunk processing and audio concatenation
- [ ] Update narration endpoint to handle chunked text

## 4. Improve API Key Validation
- [ ] Update validation patterns for current API key formats
- [ ] Add better error messages for invalid keys

## 5. Update Error Handling
- [ ] Add retry logic for transient failures
- [ ] Improve fallback mechanisms
- [ ] Better logging for debugging
