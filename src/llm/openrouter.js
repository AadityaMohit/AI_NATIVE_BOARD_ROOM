/**
 * The LLM provider boundary. Everything model-specific lives here, so swapping
 * providers (or models) never touches the debate logic. Exposes a single
 * async generator that streams one chat completion as text deltas.
 */
import { MODEL, API_KEY, OPENROUTER_URL } from '../config.js';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Stream one model turn from OpenRouter's OpenAI-compatible chat API.
 * @yields {string} text deltas as they arrive
 */
export async function* streamChat({ system, user, signal, maxOutputTokens = 600, temperature = 0.9 }) {
  const body = JSON.stringify({
    model: MODEL,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    max_tokens: maxOutputTokens,
    temperature,
    stream: true,
  });

  // Retry transient 429/503 with exponential backoff instead of failing the turn.
  let upstream;
  for (let attempt = 0; ; attempt++) {
    upstream = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
        // Optional attribution headers OpenRouter uses for its dashboard.
        'HTTP-Referer': 'http://localhost',
        'X-Title': 'The Boardroom',
      },
      body,
      signal,
    });
    if (upstream.ok) break;
    if ((upstream.status === 429 || upstream.status === 503) && attempt < 4) {
      await upstream.body?.cancel().catch(() => {});
      await sleep(1200 * 2 ** attempt); // 1.2s, 2.4s, 4.8s, 9.6s
      continue;
    }
    const errBody = await upstream.json().catch(() => null);
    const apiMsg = errBody?.error?.message;
    throw Object.assign(new Error(apiMsg || `OpenRouter API error ${upstream.status}`), {
      status: upstream.status,
    });
  }

  // OpenAI-style SSE: `data: {json}` lines, terminated by `data: [DONE]`.
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const textFromLine = (line) => {
    if (!line.startsWith('data:')) return '';
    const json = line.slice(5).trim();
    if (!json || json === '[DONE]') return '';
    try {
      const chunk = JSON.parse(json);
      return chunk?.choices?.[0]?.delta?.content ?? '';
    } catch {
      return ''; // ignore keep-alive comments / partial lines
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop(); // keep the (possibly incomplete) trailing line
    for (const line of lines) {
      const text = textFromLine(line);
      if (text) yield text;
    }
  }
  if (buffer.trim()) {
    const text = textFromLine(buffer.trim());
    if (text) yield text;
  }
}
