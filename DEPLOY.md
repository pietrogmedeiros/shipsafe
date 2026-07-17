# ShipSafe — Deploy (Contabo + EasyPanel)

## What ships
A single Next.js 16 standalone container (built from `Dockerfile`). Data lives
in the **existing Elasticsearch** already running on the Contabo VM — ShipSafe
only adds its own `shipsafe-*` indices (auto-created on first boot by
`ensureIndices()`), so it will not touch other apps' data.

## 1. Create the app in EasyPanel
- New service → **App** → source = this Git repo (or push the image).
- Build: Dockerfile (root). Port: `3000`.
- Domain: e.g. `shipsafe.<seu-dominio>` with the EasyPanel-managed cert.

## 2. Environment variables
```
APP_URL=https://shipsafe.<seu-dominio>
JWT_SECRET=<openssl rand -hex 32>

# Point at the EXISTING Contabo Elasticsearch (internal service name in EasyPanel,
# or the VM's private address). Pick ONE auth method.
ELASTICSEARCH_URL=http://<es-service>:9200
# ELASTICSEARCH_API_KEY=...           # preferred
# ELASTICSEARCH_USERNAME=elastic
# ELASTICSEARCH_PASSWORD=...
# ELASTICSEARCH_INSECURE_TLS=1        # only if self-signed https

# AbacatePay (Pix) — leave blank to run in demo mode; set for real charges.
ABACATEPAY_API_KEY=<sua chave>
ABACATEPAY_BASE_URL=https://api.abacatepay.com/v2
ABACATEPAY_WEBHOOK_SECRET=<gere um segredo forte>
```

## 3. AbacatePay webhook
In the AbacatePay dashboard, create a webhook pointing at:
```
https://shipsafe.<seu-dominio>/api/billing/webhook?webhookSecret=<ABACATEPAY_WEBHOOK_SECRET>
```
Events: `checkout.completed`, `transparent.completed`. The handler also accepts
HMAC-SHA256 signatures if AbacatePay sends them. Payment confirmation is
double-covered (webhook **and** status polling), so a missed webhook still
upgrades the user.

## 4. First boot
Indices are created automatically. Verify:
```
curl -s $ELASTICSEARCH_URL/_cat/indices/shipsafe-*
```
You should see `shipsafe-users|apps|scans|findings|payments`.

## Roadmap after approval
- **Continuous monitoring (Pro):** a small worker (node cron) that re-scans
  `monitor:true` apps daily and alerts on newly-appeared findings. The data
  model + scan-runner already support it; only the scheduler + notifier remain.
- PDF report export, "Secured by ShipSafe" public badge endpoint.
