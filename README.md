# Post Street Teleprompter

Mobile-friendly teleprompter with horizontal mirroring enabled by default, browser speech recognition, freestyle hold, and phrase-based reacquisition. Paste a script, open the teleprompter, start voice follow and allow microphone access. Use Safari on iPhone or Chrome on Android. Browser support and speech service availability vary. Scripts and settings are saved in this browser; the browser may send audio to its speech provider and require internet access.

## Voice follow

No OpenAI credits or API key are required for browser voice follow. The client does not call /api/token or OpenAI. Existing OPENAI_API_KEY remains private in Vercel. The legacy POST /api/token endpoint remains server-only for potential future OpenAI support; it is unused by this interface.

Recognition uses interim results, replaces revised words, and restarts after ordinary speech-session endings. Microphone, network and permission errors show a retry message. Switching away from the app stops listening; tap Start on return.

## Deployment and tests

GitHub main deploys to Vercel. Use repository root, Other framework and no build command. Run npm test for mocked endpoint, phrase matching and browser recognition lifecycle tests. Real microphone performance must be tested on the target phone.

## Behavior

No automatic timed scrolling. Short matching phrases advance near the current line; jumps farther ahead require at least five matching words. Unrelated speech holds the cursor. Back, Forward and Hold support manual correction. Voice matching is heuristic: repeated script phrases and transcription errors can require manual correction. Horizontal mirroring applies to script text while controls remain readable.
