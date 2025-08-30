import express from 'express';
import cors from 'cors';
import { environment } from './config/environment';
import { BotLogic } from './bot/botLogic';
import { WAWebhookPayload } from './interfaces/waMessageInterface';

const app = express();
const botLogic = new BotLogic();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        bot: environment.BOT_NAME,
        version: '1.0.0'
    });
});

// WhatsApp webhook verification endpoint
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('Webhook verification request:', { mode, token, challenge });

    if (mode === 'subscribe' && token === environment.WEBHOOK_VERIFY_TOKEN) {
        console.log('Webhook verified successfully');
        res.status(200).send(challenge);
    } else {
        console.log('Webhook verification failed');
        res.status(403).send('Forbidden');
    }
});

// WhatsApp webhook endpoint for receiving messages
app.post('/webhook', async (req, res) => {
    try {
        const webhookData: WAWebhookPayload = req.body;
        
        console.log('Received webhook:', JSON.stringify(webhookData, null, 2));

        // Process the webhook data
        await botLogic.handleWebhook(webhookData);

        // Always respond with 200 OK to WhatsApp
        res.status(200).send('OK');
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Test endpoint to send a message (for testing purposes)
app.post('/test-message', async (req, res) => {
    try {
        const { to, message } = req.body;
        
        if (!to || !message) {
            return res.status(400).json({ error: 'Missing "to" or "message" parameter' });
        }

        // Import the bot service here to avoid circular dependencies
        const { BotMessageService } = await import('./services/botMessageService');
        const botService = BotMessageService.getInstance('main_bot');
        
        const result = await botService.sendTextMessage(to, message);
        
        res.json({ success: true, result });
    } catch (error) {
        console.error('Error sending test message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Start server
const PORT = environment.PORT;
app.listen(PORT, () => {
    console.log(`🚀 WhatsApp Bot Server started on port ${PORT}`);
    console.log(`📱 Bot Name: ${environment.BOT_NAME}`);
    console.log(`🔗 Webhook URL: http://localhost:${PORT}/webhook`);
    console.log(`✅ Health Check: http://localhost:${PORT}/health`);
    console.log(`🧪 Test Message: POST http://localhost:${PORT}/test-message`);
    console.log('');
    console.log('📋 To test your bot:');
    console.log('1. Make sure your WhatsApp Business API is configured');
    console.log('2. Set up webhook URL in Meta Developer Console');
    console.log('3. Send a message to your WhatsApp number');
    console.log('4. Check the console logs for incoming messages');
});
