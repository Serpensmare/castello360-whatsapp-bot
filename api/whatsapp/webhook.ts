export default async function handler(req: any, res: any) {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN!;
  if (req.method === "GET") {
    const m = req.query["hub.mode"], t = req.query["hub.verify_token"], c = req.query["hub.challenge"];
    return m === "subscribe" && t === VERIFY_TOKEN ? res.status(200).send(c) : res.status(403).end();
  }
  if (req.method === "POST") {
    res.status(200).end();
    try {
      const v = req.body?.entry?.[0]?.changes?.[0]?.value;
      const msg = v?.messages?.[0];
      const from = msg?.from;
      if (from) await sendText(from, "Bot online.");
    } catch {}
    return;
  }
  res.status(405).end();
}

async function sendText(to: string, text: string) {
  const PNID  = process.env.PHONE_NUMBER_ID!;
  const TOKEN = process.env.WHATSAPP_TOKEN!;
  const GV    = process.env.GRAPH_VERSION || "v23.0";
  const url = `https://graph.facebook.com/${GV}/${PNID}/messages`;
  const body = { messaging_product: "whatsapp", to, type: "text", text: { body: text } };
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!r.ok) console.error("sendText failed", r.status, await r.text());
}

export const config = {
  api: {
    bodyParser: { sizeLimit: "1mb" }
  }
};
