export async function sendText(to: string, text: string) {
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
