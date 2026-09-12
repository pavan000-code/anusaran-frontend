# Anusaran frontend

Next.js App Router implementation of the doctor-facing care-loop workspace from the Anusaran blueprint.

## Run

```bash
cp .env.example .env.local
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_URL` to the Railway FastAPI URL when the backend is deployed. Locally it defaults to `http://localhost:8000`. The dashboard renders the Lakshmi decision-card fixture until live alerts are available, then reads `GET /v1/doctors/me/alerts` from the backend.

## Local mocked end-to-end flow

Start the backend with `MOCK_MODE=true` (see the backend README), then set this in `.env.local`:

```text
NEXT_PUBLIC_API_URL=http://localhost:8000
```

The header changes from **Demo fixture** to **Mock API connected** after the frontend retrieves the synthetic alert. If port 8000 is busy, use another backend port and set this value to that port instead.

## Production

Deploy this folder to Vercel. Set `NEXT_PUBLIC_API_URL` in Vercel Environment Variables and add the Vercel origin to the backend `ALLOWED_ORIGINS` setting.
