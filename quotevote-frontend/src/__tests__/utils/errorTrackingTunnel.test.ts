/**
 * @jest-environment node
 */
import { forwardEnvelope, MAX_ENVELOPE_BYTES } from "@/lib/errorTracking/tunnel";

const DSN = "https://public123@o1.ingest.example.io/42";

const envelope = (dsn: string, extra = ""): string =>
  `${JSON.stringify({ event_id: "abc", dsn })}\n{"type":"event"}\n{"message":"x"}${extra}`;

const post = (body: string, headers: Record<string, string> = {}): Request =>
  new Request("http://localhost:3000/monitoring", { method: "POST", body, headers });

describe("forwardEnvelope", () => {
  it("forwards an envelope for the configured project to Sentry", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(new Response(null, { status: 200 }));
    const body = envelope(DSN);

    const response = await forwardEnvelope(post(body), DSN, fetchImpl);

    expect(response.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://o1.ingest.example.io/api/42/envelope/");
    expect(init.method).toBe("POST");
    expect(new TextDecoder().decode(init.body)).toBe(body);
  });

  it("is off when no DSN is configured", async () => {
    const fetchImpl = jest.fn();
    const response = await forwardEnvelope(post(envelope(DSN)), undefined, fetchImpl);
    expect(response.status).toBe(404);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it.each([
    ["another project", envelope("https://public123@o1.ingest.example.io/99")],
    ["another host", envelope("https://public123@evil.example.com/42")],
    ["another key", envelope("https://other@o1.ingest.example.io/42")],
    ["no dsn in the header", '{"event_id":"abc"}\n{}'],
    ["a header that isn't JSON", "not json\n{}"],
  ])("refuses an envelope for %s", async (_label, body) => {
    const fetchImpl = jest.fn();
    const response = await forwardEnvelope(post(body), DSN, fetchImpl);
    expect(response.status).toBe(400);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("refuses bodies over the size limit", async () => {
    const fetchImpl = jest.fn();
    const big = envelope(DSN, "x".repeat(MAX_ENVELOPE_BYTES));

    expect((await forwardEnvelope(post(big), DSN, fetchImpl)).status).toBe(413);
    expect(
      (
        await forwardEnvelope(
          post(envelope(DSN), { "content-length": String(MAX_ENVELOPE_BYTES + 1) }),
          DSN,
          fetchImpl
        )
      ).status
    ).toBe(413);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("passes on Sentry's status, and answers 502 when Sentry can't be reached", async () => {
    const limited = jest.fn().mockResolvedValue(new Response(null, { status: 429 }));
    expect((await forwardEnvelope(post(envelope(DSN)), DSN, limited)).status).toBe(429);

    const down = jest.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    expect((await forwardEnvelope(post(envelope(DSN)), DSN, down)).status).toBe(502);
  });
});
