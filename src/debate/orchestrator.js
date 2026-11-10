/**
 * The debate engine. This is the heart of the app: it runs the turn-taking
 * protocol over the panel and the Chair.
 *
 * It knows nothing about HTTP or SSE — it reports progress by calling the
 * `emit(event, data)` callback it's handed, so the same loop could drive a
 * web response, a CLI, a test, or a websocket without changing a line.
 */
import { streamChat, sleep } from '../llm/openrouter.js';
import { PERSONAS, CHAIR } from './personas.js';
import { personaSystem, personaUser, chairSystem, chairUser } from './prompts.js';
import { ROUNDS } from '../config.js';

/**
 * Run a full debate to its verdict.
 *
 * Emitted events:
 *   turn_start    { id, name, role, round }
 *   delta         { text }
 *   turn_end      { }
 *   verdict_start { id, name, role }
 *
 * @param {object}        args
 * @param {string}        args.decision  the question under debate
 * @param {string}        args.context   optional extra context
 * @param {AbortSignal}   args.signal    aborts in-flight model calls
 * @param {(event: string, data?: object) => void} args.emit
 */
export async function runDebate({ decision, context, signal, emit }) {
  const turns = []; // shared running transcript every speaker reasons over
  let turnCount = 0;

  const runTurn = async (speaker, system, user, meta) => {
    if (turnCount++ > 0) await sleep(600); // gentle pacing between calls
    emit('turn_start', meta);
    let full = '';
    for await (const text of streamChat({ system, user, signal })) {
      full += text;
      emit('delta', { text });
    }
    emit('turn_end');
    turns.push({ id: speaker.id, name: speaker.name, role: speaker.role, text: full.trim() });
  };

  // Rounds of panel discussion.
  for (let round = 1; round <= ROUNDS; round++) {
    for (const p of PERSONAS) {
      if (signal.aborted) return;
      await runTurn(
        p,
        personaSystem(p),
        personaUser({ decision, context, turns, round }),
        { id: p.id, name: p.name, role: p.role, round },
      );
    }
  }

  // The Chair's closing verdict.
  if (signal.aborted) return;
  await sleep(600);
  emit('verdict_start', { id: CHAIR.id, name: CHAIR.name, role: CHAIR.role });
  for await (const text of streamChat({
    system: chairSystem(),
    user: chairUser({ decision, context, turns }),
    signal,
    maxOutputTokens: 500,
    temperature: 0.4,
  })) {
    emit('delta', { text });
  }
  emit('turn_end');
}
