/** GET /api/panel — the roster the frontend uses to build the seats. */
import { Router } from 'express';
import { PERSONAS, CHAIR } from '../debate/personas.js';

const router = Router();

router.get('/panel', (_req, res) => {
  res.json({
    personas: PERSONAS.map(({ id, name, role }) => ({ id, name, role })),
    chair: { id: CHAIR.id, name: CHAIR.name, role: CHAIR.role },
  });
});

export default router;
