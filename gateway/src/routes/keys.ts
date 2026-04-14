import { Router, Request, Response } from 'express';
import { db } from '../db';
import { generateApiKey, invalidateKeyCache } from '../services/apiKeys';
import crypto from 'crypto';

export const keysRouter = Router();

// GET /api/keys — list all keys for user
keysRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.context;
  const result = await db.query(
    `SELECT id, key_prefix, name, is_active, last_used, created_at
     FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  res.json(result.rows);
});

// POST /api/keys — create new API key
keysRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.context;
  const name: string = (req.body as { name?: string }).name ?? 'default';

  const { raw, hash, prefix } = generateApiKey();

  await db.query(
    `INSERT INTO api_keys (user_id, key_hash, key_prefix, name) VALUES ($1, $2, $3, $4)`,
    [userId, hash, prefix, name]
  );

  // Return raw key once — never stored, never retrievable again
  res.status(201).json({ key: raw, prefix, name, message: 'Save this key — it will not be shown again.' });
});

// DELETE /api/keys/:id — revoke key
keysRouter.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.context;
  const { id } = req.params;

  const result = await db.query(
    `UPDATE api_keys SET is_active = false WHERE id = $1 AND user_id = $2 RETURNING key_hash`,
    [id, userId]
  );

  if (result.rows.length === 0) { res.status(404).json({ error: 'Key not found' }); return; }

  await invalidateKeyCache(result.rows[0].key_hash as string);
  res.json({ message: 'Key revoked' });
});
