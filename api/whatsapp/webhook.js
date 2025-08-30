export default async function handler(req, res) {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  if (req.method === "GET") {
    const m = req.query["hub.mode"];
    const t = req.query["hub.verify_token"];
    const c = req.query["hub.challenge"];
    return m === "subscribe" && t === VERIFY_TOKEN ? res.status(200).send(c) : res.status(403).end();
  }
  if (req.method === "POST") {
    res.status(200).end(); // ack fast
    try {
      let body = req.body;
      if (typeof body === "string") body = JSON.parse(body);
      const v   = body?.entry?.[0]?.changes?.[0]?.value;
      const msg = v?.messages?.[0];
      const from = msg?.from;
      if (from) await sendText(from, "Bot online.");
    } catch (e) { console.error("handler error", e); }
    return;
  }
  res.status(405).end();
}

async function sendText(to, text) {
  const PNID  = process.env.PHONE_NUMBER_ID;
  const TOKEN = process.env.WHATSAPP_TOKEN;
  const GV    = process.env.GRAPH_VERSION || "v23.0";
  const url   = `https://graph.facebook.com/${GV}/${PNID}/messages`;
  const body  = { messaging_product:"whatsapp", to, type:"text", text:{ body:text } };
  const r = await fetch(url, {
    method:"POST",
    headers:{ Authorization:`Bearer ${TOKEN}`, "Content-Type":"application/json" },
    body: JSON.stringify(body)
  });
  if (!r.ok) console.error("sendText failed", r.status, await r.text());
}
