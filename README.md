# ShipSafe 🛡️

**Scanner de segurança para apps vibe-coded.** Cole a URL do seu app deployado
e o ShipSafe bate nele por fora, como um atacante, para achar antes dos hackers:

- 🔑 **Segredos expostos** no bundle do client (Supabase, Firebase, OpenAI,
  Anthropic, Stripe live, AWS, GitHub, chaves privadas…)
- 🗄️ **Supabase RLS desligado** (probe real no REST — o mesmo furo do Moltbook /
  CVE-2025-48757)
- 📄 **Arquivos sensíveis expostos** (`.env`, `.git`, `config.json`, dumps SQL)
- 🧱 **Headers de segurança** ausentes (CSP, HSTS, clickjacking, nosniff)
- 🗺️ **Source maps** vazando o código-fonte

Cada achado vem com severidade, explicação em português e **como corrigir**.
Nota final **A–F**.

## Planos
- **Grátis:** 1 app, scan sob demanda, relatório completo.
- **Pro (R$ 29/mês):** até 25 apps, monitoramento contínuo + alerta a cada
  deploy, PDF e selo "Secured by ShipSafe". Pagamento via **Pix (AbacatePay)**.

## Stack
- **Next.js 16** (App Router, TS, Tailwind v4) — web + API
- **Elasticsearch** — todos os dados (`shipsafe-*`), findings como série temporal
- **AbacatePay** — cobrança Pix + webhook
- Auth própria: Elasticsearch + bcrypt + JWT em cookie httpOnly

## Rodar local
```bash
cp .env.example .env.local          # ajuste JWT_SECRET; ES aponta p/ localhost
docker compose up -d elasticsearch  # sobe o ES local
npm install
npm run dev                         # http://localhost:3000
```
Sem chave da AbacatePay, o upgrade roda em **modo demonstração** (QR fake que
confirma sozinho) — o resto funciona igual.

Scripts úteis:
```bash
npx tsx scripts/init-es.ts      # cria os índices ES (também é automático no boot)
npx tsx scripts/e2e-backend.ts  # teste ponta-a-ponta: user → scan real → ES
```

## Deploy
Veja **[DEPLOY.md](./DEPLOY.md)** — Docker + EasyPanel na Contabo, apontando para
o Elasticsearch existente. A arquitetura por fatias está em **[TEAM.md](./TEAM.md)**.

## Arquitetura (resumo)
```
app/(marketing)   landing            lib/scanner/*   engine de checks (puro)
app/(auth)        login/signup       lib/repo.ts     acesso ao Elasticsearch
app/(app)         dashboard/report   lib/scan-runner orquestra scan → ES
app/api/*         auth, scans, billing               proxy.ts protege /app/*
```
