# Deploy Instructions

## 1. Supabase — run schema
Open Supabase SQL editor and paste the contents of `gateway/schema.sql`.

## 2. Create Heroku app (gateway)
```bash
heroku create low-power-api-marketplace
heroku buildpacks:set heroku/rust
heroku buildpacks:add heroku/nodejs
```

The rust buildpack runs `cargo build --release` first, then nodejs compiles TypeScript.

## 3. Set env vars
```bash
heroku config:set DATABASE_URL=<supabase-postgres-url>
heroku config:set REDIS_URL=<upstash-redis-url>
heroku config:set STRIPE_SECRET_KEY=sk_live_xxx
heroku config:set STRIPE_WEBHOOK_SECRET=whsec_xxx
heroku config:set NODE_ENV=production
```

## 4. Push to Heroku
```bash
# Deploy only the gateway subfolder
git subtree push --prefix gateway heroku main
```

## 5. Stripe webhook
In Stripe dashboard → Webhooks → Add endpoint:
- URL: https://low-power-api-marketplace.herokuapp.com/api/webhooks/stripe
- Events: invoice.paid, customer.subscription.updated, customer.subscription.deleted

## 6. Vercel — dashboard frontend
```bash
cd dashboard
npm install
# Set env var in Vercel dashboard:
# VITE_GATEWAY_URL=https://low-power-api-marketplace.herokuapp.com
```
Push dashboard/ to GitHub, connect to Vercel, deploy.
