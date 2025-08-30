import "dotenv/config";
import express from "express";

const app = express();
app.use(express.json());

// Hard fail early if VERIFY_TOKEN missing
if (!process.env.VERIFY_TOKEN) {
  console.error("ERROR: VERIFY_TOKEN missing in .env");
  process.exit(1);
}

// Health
app.get("/health", (_req, res) => res.status(200).send("ok"));

// Webhook verify (GET)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("[VERIFY] mode=%s token=%s challenge=%s", mode, token, challenge);

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    // Respond with raw challenge text
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Webhook receive (POST)
app.post("/webhook", (req, res) => {
  console.log("[INBOUND]", JSON.stringify(req.body));
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Webhook running on port", PORT);
  console.log("VERIFY_TOKEN expected =", process.env.VERIFY_TOKEN || "(unset)");
  console.log("Sanity-check URL (replace NGROK):");
  console.log(
    "https://<NGROK-URL>/webhook?hub.mode=subscribe&hub.verify_token=" +
      (process.env.VERIFY_TOKEN || "myverify123") +
      "&challenge=12345"
  );
});
