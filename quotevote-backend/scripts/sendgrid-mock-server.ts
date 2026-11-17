/**
 * Local SendGrid API stand-in for #498 email E2E.
 *
 * Accepts POST /v3/mail/send, records recipient / template / dynamic data,
 * and exposes GET /emails for Playwright to poll.
 *
 * Usage:
 *   pnpm sendgrid:mock
 *   # optional: SENDGRID_MOCK_PORT=4010
 *
 * Point the backend at this process with:
 *   SENDGRID_MOCK_BASE_URL=http://127.0.0.1:4010
 *   SENDGRID_API_KEY=SG.e2e-mock
 *   SENDGRID_SENDER_EMAIL=noreply@quotevote.local
 */
import http from 'http';
import { randomUUID } from 'crypto';

const PORT = Number.parseInt(process.env.SENDGRID_MOCK_PORT ?? '4010', 10);
const HOST = '127.0.0.1';

export interface MockedSendGridEmail {
  id: string;
  receivedAt: string;
  to: string[];
  from?: string;
  subject?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, unknown>;
  html?: string;
  text?: string;
  raw: unknown;
}

const inbox: MockedSendGridEmail[] = [];

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

function extractRecipients(body: Record<string, unknown>): string[] {
  const emails = new Set<string>();

  if (typeof body.to === 'string') {
    emails.add(body.to.toLowerCase());
  } else if (Array.isArray(body.to)) {
    for (const entry of body.to) {
      if (typeof entry === 'string') {
        emails.add(entry.toLowerCase());
      } else if (entry && typeof entry === 'object' && 'email' in entry) {
        const email = (entry as { email?: string }).email;
        if (email) emails.add(email.toLowerCase());
      }
    }
  }

  const personalizations = body.personalizations;
  if (Array.isArray(personalizations)) {
    for (const personalization of personalizations) {
      if (!personalization || typeof personalization !== 'object') continue;
      const to = (personalization as { to?: unknown }).to;
      if (!Array.isArray(to)) continue;
      for (const recipient of to) {
        if (recipient && typeof recipient === 'object' && 'email' in recipient) {
          const email = (recipient as { email?: string }).email;
          if (email) emails.add(email.toLowerCase());
        }
      }
    }
  }

  return [...emails];
}

function asObjectRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

/**
 * @sendgrid/mail serializes personalizations to snake_case on the wire
 * (`dynamic_template_data`). Accept camelCase too for hand-built requests.
 */
function extractDynamicTemplateData(
  body: Record<string, unknown>
): Record<string, unknown> | undefined {
  const fromBody =
    asObjectRecord(body.dynamic_template_data) ?? asObjectRecord(body.dynamicTemplateData);
  if (fromBody) {
    return fromBody;
  }

  const personalizations = body.personalizations;
  if (!Array.isArray(personalizations) || personalizations.length === 0) {
    return undefined;
  }

  const first = asObjectRecord(personalizations[0]);
  if (!first) {
    return undefined;
  }

  return asObjectRecord(first.dynamic_template_data) ?? asObjectRecord(first.dynamicTemplateData);
}

function extractTemplateId(body: Record<string, unknown>): string | undefined {
  if (typeof body.template_id === 'string') return body.template_id;
  if (typeof body.templateId === 'string') return body.templateId;
  return undefined;
}

function extractContent(body: Record<string, unknown>): { html?: string; text?: string } {
  const result: { html?: string; text?: string } = {};

  if (typeof body.html === 'string') result.html = body.html;
  if (typeof body.text === 'string') result.text = body.text;

  if (Array.isArray(body.content)) {
    for (const part of body.content) {
      if (!part || typeof part !== 'object') continue;
      const typed = part as { type?: string; value?: string };
      if (typed.type === 'text/html' && typed.value) result.html = typed.value;
      if (typed.type === 'text/plain' && typed.value) result.text = typed.value;
    }
  }

  return result;
}

function recordSend(body: Record<string, unknown>): MockedSendGridEmail {
  const dynamicTemplateData = extractDynamicTemplateData(body);
  const content = extractContent(body);

  // Template emails have no rendered HTML; surface the app links as anchors
  // so consumers can scrape the same way they would a real inbox.
  let html = content.html;
  if (!html && dynamicTemplateData) {
    const links = [
      dynamicTemplateData.change_password_url,
      dynamicTemplateData.create_password_url,
      dynamicTemplateData.resetLink,
    ].filter((value): value is string => typeof value === 'string' && value.length > 0);

    if (links.length > 0) {
      html = links.map((href) => `<a href="${href}">${href}</a>`).join('\n');
    }
  }

  const message: MockedSendGridEmail = {
    id: randomUUID(),
    receivedAt: new Date().toISOString(),
    to: extractRecipients(body),
    from: typeof body.from === 'string' ? body.from : undefined,
    subject: typeof body.subject === 'string' ? body.subject : undefined,
    templateId: extractTemplateId(body),
    dynamicTemplateData,
    html,
    text: content.text,
    raw: body,
  };

  inbox.push(message);
  return message;
}

function listEmails(url: URL): MockedSendGridEmail[] {
  const to = (url.searchParams.get('to') ?? '').trim().toLowerCase();
  const afterRaw = url.searchParams.get('after');
  const afterMs = afterRaw ? Date.parse(afterRaw) : Number.NaN;

  return inbox.filter((message) => {
    if (to && !message.to.includes(to)) return false;
    if (!Number.isNaN(afterMs)) {
      const receivedMs = Date.parse(message.receivedAt);
      if (Number.isNaN(receivedMs) || receivedMs < afterMs) return false;
    }
    return true;
  });
}

const server = http.createServer(async (req, res) => {
  const method = req.method ?? 'GET';
  const requestUrl = new URL(req.url ?? '/', `http://${HOST}:${PORT}`);
  const path = requestUrl.pathname.replace(/\/+$/, '') || '/';

  try {
    if (method === 'GET' && path === '/health') {
      sendJson(res, 200, { ok: true, count: inbox.length });
      return;
    }

    if (method === 'GET' && path === '/emails') {
      sendJson(res, 200, { messages: listEmails(requestUrl) });
      return;
    }

    if (method === 'DELETE' && path === '/emails') {
      inbox.length = 0;
      sendJson(res, 200, { cleared: true });
      return;
    }

    if (method === 'POST' && path === '/v3/mail/send') {
      const raw = await readBody(req);
      let body: Record<string, unknown> = {};
      if (raw) {
        try {
          body = JSON.parse(raw) as Record<string, unknown>;
        } catch {
          sendJson(res, 400, { errors: [{ message: 'Invalid JSON body' }] });
          return;
        }
      }

      const message = recordSend(body);
      console.log(
        `[sendgrid-mock] captured email id=${message.id} to=${message.to.join(',')}` +
          (message.templateId ? ` template=${message.templateId}` : '')
      );
      // SendGrid returns 202 Accepted with an empty body on success.
      res.writeHead(202);
      res.end();
      return;
    }

    sendJson(res, 404, { errors: [{ message: `No route ${method} ${path}` }] });
  } catch (error: unknown) {
    console.error('[sendgrid-mock] request error', error);
    sendJson(res, 500, { errors: [{ message: 'Internal mock error' }] });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[sendgrid-mock] listening on http://${HOST}:${PORT}`);
  console.log('[sendgrid-mock] POST /v3/mail/send  GET /emails  DELETE /emails  GET /health');
});
