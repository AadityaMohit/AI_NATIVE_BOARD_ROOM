/**
 * Prompt construction. Pure functions that turn debate state into the
 * system/user strings sent to the model — no side effects, easy to tweak.
 */
import { DEBATE_RULES } from './personas.js';

/** Render the running transcript the way each speaker sees it. */
export function buildTranscript(turns) {
  if (turns.length === 0) return '(You are opening the discussion — no one has spoken yet.)';
  return turns.map((t) => `${t.name} (${t.role}): ${t.text}`).join('\n\n');
}

export function personaSystem(p) {
  return `You are ${p.name}, playing the role of "${p.role}" on a decision-making panel.\n\n${p.persona}\n\n${DEBATE_RULES}`;
}

export function personaUser({ decision, context, turns, round }) {
  const roundInstruction =
    round === 1
      ? 'Give your opening position on this decision.'
      : 'Respond to what the others have said. If someone made a point that changed or sharpened your view, say so explicitly — it is a sign of strength, not weakness, to update.';

  return (
    `DECISION UNDER DEBATE:\n${decision}\n` +
    (context ? `\nADDITIONAL CONTEXT FROM THE PERSON DECIDING:\n${context}\n` : '') +
    `\nTRANSCRIPT SO FAR:\n${buildTranscript(turns)}\n\n` +
    `It is now your turn. ${roundInstruction} Speak in character, in the first person.`
  );
}

export function chairSystem() {
  return (
    'You are The Chair — a neutral, decisive moderator who has just listened to a panel debate a decision. ' +
    'You synthesize, you do not take sides, and you are willing to make the hard call.'
  );
}

export function chairUser({ decision, context, turns }) {
  return (
    `DECISION:\n${decision}\n` +
    (context ? `\nCONTEXT:\n${context}\n` : '') +
    `\nFULL DEBATE TRANSCRIPT:\n${buildTranscript(turns)}\n\n` +
    'Deliver the final verdict. Structure it as plain prose in exactly this shape, no markdown:\n' +
    'RECOMMENDATION: one clear, decisive sentence on what to do.\n' +
    'WHY: the 2–3 strongest reasons, pulled from the debate.\n' +
    'WATCH OUT FOR: the single biggest risk to manage.\n' +
    'CONFIDENCE: Low, Medium, or High — and one phrase on why.'
  );
}
