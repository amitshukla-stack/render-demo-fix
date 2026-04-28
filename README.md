# GAIA Checkout Demo

A simple Juspay-integrated checkout page for demoing **GAIA** (Barclayyard's fintech entity) to merchants.

The customer enters an amount + currency, the backend creates a Juspay order session, and the
customer is redirected to Juspay's Hypercheckout to complete the payment. After payment,
Juspay redirects back to `/return`, where we fetch the final order status and render a result screen.

## Architecture

```
Browser ──POST /api/create-session──▶ Node backend ──POST /session──▶ Juspay
   │                                                                     │
   │  ◀── { payment_links.web } ──                                        │
   │                                                                     │
   ├─── window.location = payment_links.web ───────────────▶ Juspay Hypercheckout
   │                                                                     │
   │  ◀────────────────── redirect to /return?order_id=… ─────────────────┘
   │
   └── GET /api/order-status/:id ─▶ Node ─▶ GET /orders/:id ─▶ Juspay
```

## Routes

| Method | Path                          | Purpose |
|--------|-------------------------------|---------|
| POST   | `/api/create-session`         | Creates Juspay order, returns `payment_links.web` |
| GET    | `/api/order-status/:order_id` | Fetches Juspay order status, returns a normalised `bucket` (`success`/`pending`/`failure`) |
| GET    | `/return`                     | Juspay redirects here after payment; renders `status.html` which polls `/api/order-status` |
| GET    | `/healthz`                    | Render health check |

## Local development

```bash
npm install
npm start
# open http://localhost:3000
```

## Deploy on Render.com

1. Push this folder to a GitHub repo.
2. On Render → **New → Web Service** → connect the repo.
3. Settings:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Node version:** 18 or above
4. Add environment variables:

| Key                  | Value                                                       |
|----------------------|-------------------------------------------------------------|
| `JUSPAY_API_KEY`     | Your Juspay API key (becomes Basic-Auth username)           |
| `JUSPAY_MERCHANT_ID` | The `x-merchantid` header value                             |
| `JUSPAY_CLIENT_ID`   | `payment_page_client_id` — e.g. `picasso`                   |
| `JUSPAY_BASE_URL`    | `https://sandbox.juspay.in` for sandbox, `https://api.juspay.in` for prod |
| `PUBLIC_BASE_URL`    | Your Render URL, e.g. `https://gaia-checkout.onrender.com`. **This is used to build `return_url`.** |

5. Once deployed, hit your URL — that's the demo.

## Frontend (`public/`)

- `index.html` — checkout form
- `status.html` — payment result screen (loaded at `/return`)
- `app.jsx` — main React app
- `components.jsx` — icons, GAIA badge, PPRO currency list
- `styles.css` — Barclays-inspired cyan/blue theme
- `tweaks-panel.jsx` — design-time tweak controls

The frontend uses React via CDN (no build step). PPRO-supported currencies are
mapped 1:1 with Juspay's 3-letter ISO 4217 codes.

## Tweaks

When previewed in the design environment, toggle **Tweaks** on the toolbar to:

- Edit merchant branding (name, line item)
- Change prefilled customer info
- Toggle real Juspay API call vs. mocked offline flow
- Toggle the API exchange panel open/closed by default

Tweak values persist into the source file via the `EDITMODE-BEGIN/END` block in `app.jsx`.

## Status mapping

The backend normalises Juspay's many statuses into three buckets:

| Bucket    | Juspay statuses                                                       |
|-----------|-----------------------------------------------------------------------|
| `success` | `CHARGED`, `COD_INITIATED`, `AUTO_REFUNDED`, `PARTIALLY_CHARGED`     |
| `failure` | `AUTHORIZATION_FAILED`, `AUTHENTICATION_FAILED`, `JUSPAY_DECLINED`, `TERMINAL_FAILURE`, `DECLINED`, `VOIDED`, `EXPIRED`, `NOT_FOUND` |
| `pending` | `NEW`, `PENDING_VBV`, `AUTHORIZING`, `STARTED`                        |

The status screen polls every 2 s for up to 5 attempts before settling.

## What's intentionally not in scope

- Webhook receiver (use `/orders/:id` polling for the demo; webhooks are recommended for production)
- Refunds / cancellations (Juspay has `/orders/:id/refund` and `/orders/:id/cancel`)
- Saved cards / mandates / SDK integration (we use the hosted payment-link flow only)
- Database persistence (orders live only in Juspay)
