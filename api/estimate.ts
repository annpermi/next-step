import type { VercelRequest, VercelResponse } from '@vercel/node';

type EstimateRequestBody = {
  name?: string;
  phone?: string;
  email?: string;
  projectType?: string;
  details?: string;
  timeline?: string;
  company?: string;
};

type EstimateResponse = {
  ok: boolean;
  message: string;
};

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
// Best-effort only: serverless instances are not shared, so this resets on
// cold start and isn't enforced across concurrent instances. Fine for a
// low-traffic contractor site; move to a shared store (e.g. Vercel KV) if
// this ever needs to hold up under real abuse.
const estimateRequestTimestamps = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (estimateRequestTimestamps.get(ip) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
  );
  recent.push(now);
  estimateRequestTimestamps.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX_REQUESTS;
}

function clientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const header = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return header?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Method not allowed' } satisfies EstimateResponse);
  }

  const body = (req.body ?? {}) as EstimateRequestBody;
  const { name, phone, email, projectType, details, timeline, company } = body;

  if (company) {
    return res.status(200).json({
      ok: true,
      message: 'Thanks! We received your request and will call you shortly.',
    } satisfies EstimateResponse);
  }

  if (isRateLimited(clientIp(req))) {
    return res.status(429).json({
      ok: false,
      message: 'Too many requests. Please try again later.',
    } satisfies EstimateResponse);
  }

  if (!name || !phone || !projectType || !details) {
    return res.status(400).json({
      ok: false,
      message: 'Please fill in name, phone, project type, and project details.',
    } satisfies EstimateResponse);
  }

  console.log('New estimate request', { name, phone, email, projectType, timeline, details });

  return res.status(200).json({
    ok: true,
    message: 'Thanks! We received your request and will call you shortly.',
  } satisfies EstimateResponse);
}
