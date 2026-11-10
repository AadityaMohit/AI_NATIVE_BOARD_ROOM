/**
 * The Boardroom — entry point.
 *
 * A modular monolith: this file just boots the app. The real work lives in
 * src/ — config, the LLM provider, the debate engine, and the HTTP routes.
 *
 *   src/config.js            env + constants
 *   src/app.js               express app factory
 *   src/llm/openrouter.js    model provider (streamChat)
 *   src/debate/personas.js   the cast + debate rules
 *   src/debate/prompts.js    prompt builders
 *   src/debate/orchestrator.js  the turn-taking loop (no HTTP knowledge)
 *   src/routes/panel.js      GET  /api/panel
 *   src/routes/debate.js     POST /api/debate (SSE)
 */
import { createApp } from './src/app.js';
import { PORT, MODEL, assertConfig } from './src/config.js';

assertConfig();

createApp().listen(PORT, () => {
  console.log(`\n  The Boardroom is in session → http://localhost:${PORT}\n  Model: ${MODEL} (via OpenRouter)\n`);
});
