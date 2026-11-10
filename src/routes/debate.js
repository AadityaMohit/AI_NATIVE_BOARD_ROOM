/**
 * POST /api/debate — runs a debate and streams it to the client as SSE.
 * This layer is the only place that knows about HTTP: it adapts the
 * orchestrator's `emit` events into Server-Sent Events, and maps upstream
 * errors to friendly messages.
 */
import { Router } from 'express';
import { runDebate } from '../debate/orchestrator.js';

const router = Router();

function friendlyError(err) {
  const status = err?.status ?? 500;
  if (status === 401 || status === 403) return 'Authentication failed — check OPENROUTER_API_KEY.';
  if (status === 429) return 'Rate limited by the API. Give it a moment and try again.';
  return err?.message || 'Something went wrong talking to the model.';
}

router.post('/debate', async (req, res) => {
  const decision = typeof req.body?.decision === 'string' ? req.body.decision.trim() : '';
  const context = typeof req.body?.context === 'string' ? req.body.context.trim() : '';

  if (!decision) {
    return res.status(400).json({ error: 'Body must include a non-empty "decision" string.' });
  }

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });
  res.flushHeaders?.();

  const emit = (event, data = {}) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  let finished = false;
  const controller = new AbortController();
  // Stop generating (and billing) if the client disconnects mid-stream.
  res.on('close', () => { if (!finished) controller.abort(); });

  try {
    await runDebate({ decision, context, signal: controller.signal, emit });
    emit('done');
  } catch (err) {
    if (err?.name === 'AbortError') { finished = true; return res.end(); }
    console.error('[debate] error:', err?.status ?? 500, err?.message);
    emit('error', { message: friendlyError(err) });
  } finally {
    finished = true;
    res.end();
  }
});

export default router;
