export default async function handler(req: any, res: any) {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN!;
  if (req.method === "GET") {
    const m = req.query["hub.mode"];
    const t = req.query["hub.verify_token"];
    const c = req.query["hub.challenge"];
    return m === "subscribe" && t === VERIFY_TOKEN ? res.status(200).send(c) : res.status(403).end();
  }
  if (req.method === "POST") {
    // ACK fast
    res.status(200).end();

    try {
      const value = req.body?.entry?.[0]?.changes?.[0]?.value;
      const msg = value?.messages?.[0];
      const from = msg?.from || "";
      const text = msg?.text?.body || "";

      // Kill switch and STOP keyword
      if (process.env.BOT_ENABLED === "false") return;
      if (typeof text === "string") {
        const upper = text.trim().toUpperCase();
        if (upper === "STOP" || upper === "PAUSA") return;
      }

      // Minimal auto-reply so I can see it working
      if (from) await (await import("../../src/send")).sendText(from, "Bot online.");

      // Call my real logic if present. Detect modules safely.
      try { const m = await import("../../src/messageService"); if (m.default) await m.default(req.body); if (m.process) await m.process(req.body); } catch {}
      try { const b = await import("../../src/botLogic"); if (b.default) await b.default(req.body); if (b.runBot) await b.runBot(req.body); } catch {}
      try { const q = await import("../../src/queueService"); if (q.enqueue) await q.enqueue("wa_events", req.body); } catch {}
    } catch (e) {
      console.error("handler error", e);
    }
    return;
  }
  res.status(405).end();
}

export const config = {
  api: {
    bodyParser: { sizeLimit: "1mb" }
  }
};
