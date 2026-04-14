import { Router, Request, Response } from 'express';
import { stripe } from '../services/stripe';
import { db } from '../db';
import { env } from '../config/env';
import Stripe from 'stripe';

export const billingRouter = Router();

// POST /api/billing/upgrade — create Stripe subscription for pro plan
billingRouter.post('/upgrade', async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.context;

  const userRes = await db.query(
    'SELECT email, stripe_customer_id, plan FROM users WHERE id = $1',
    [userId]
  );
  const user = userRes.rows[0];
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  if (user.plan === 'pro') { res.status(400).json({ error: 'Already on Pro plan' }); return; }

  let customerId: string = user.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email });
    customerId = customer.id;
    await db.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [customerId, userId]);
  }

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: process.env.STRIPE_PRO_PRICE_ID! }],
  });

  const itemId = subscription.items.data[0].id;
  await db.query(
    'UPDATE users SET plan = $1, stripe_subscription_item_id = $2 WHERE id = $3',
    ['pro', itemId, userId]
  );

  res.json({ message: 'Upgraded to Pro', subscriptionId: subscription.id });
});

// POST /api/billing/portal — redirect to Stripe Customer Portal
billingRouter.post('/portal', async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.context;
  const userRes = await db.query('SELECT stripe_customer_id FROM users WHERE id = $1', [userId]);
  const user = userRes.rows[0];
  if (!user?.stripe_customer_id) { res.status(400).json({ error: 'No billing account found' }); return; }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripe_customer_id,
    return_url: process.env.DASHBOARD_URL ?? 'http://localhost:5173/billing',
  });

  res.json({ url: session.url });
});

// POST /api/webhooks/stripe — Stripe event handler
billingRouter.post('/webhooks/stripe', async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    res.status(400).json({ error: 'Invalid webhook signature' }); return;
  }

  if (event.type === 'invoice.paid') {
    const invoice = event.data.object as Stripe.Invoice;
    await db.query(
      `INSERT INTO billing_events (user_id, stripe_event_id, event_type, amount_cents)
       VALUES ((SELECT id FROM users WHERE stripe_customer_id = $1), $2, $3, $4)
       ON CONFLICT (stripe_event_id) DO NOTHING`,
      [invoice.customer, event.id, event.type, invoice.amount_paid]
    );
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription;
    await db.query(
      `UPDATE users SET plan = 'free', stripe_subscription_item_id = NULL WHERE stripe_customer_id = $1`,
      [sub.customer]
    );
  }

  res.json({ received: true });
});
