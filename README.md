# NextStepConstruction Website

React + Fastify server-side rendered TypeScript website for a carpentry business with sections for About, Projects, Contact, and an estimate request form.

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:3000>

## Type checking

```bash
npm run typecheck
```

## Build for production

```bash
npm run build
npm run start
```

## Notes

- Estimate requests are submitted to `POST /api/estimate`.
- The current implementation logs requests server-side. You can connect email/CRM later.
