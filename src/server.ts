import express from 'express';
import cors from 'cors';
import { environment, validateEnvironment } from './config/environment';
import { BotLogic } from './bot/botLogic';
import { whatsappAPI } from './wa';
import { stateStore } from './state';
import { leadManager } from './lead';

// Initialize Express app
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
        business: environment.BUSINESS_NAME,
        phone: environment.BUSINESS_PHONE,
        website: environment.BUSINESS_WEBSITE,
        version: '1.0.0'
    });
});

// WhatsApp webhook verification endpoint
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.info('Webhook verification request:', { mode, token, challenge });

    if (mode === 'subscribe' && token === environment.WABA_VERIFY_TOKEN) {
        console.info('Webhook verified successfully');
        res.status(200).send(challenge);
    } else {
        console.warn('Webhook verification failed');
        res.status(403).send('Forbidden');
    }
});

// WhatsApp webhook endpoint for receiving messages
app.post('/webhook', async (req, res) => {
    try {
        const webhookData = req.body;
        
        console.info('Received webhook:', {
            object: webhookData.object,
            entryCount: webhookData.entry?.length || 0
        });

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
            return res.status(400).json({ 
                error: 'Missing "to" or "message" parameter' 
            });
        }

        const result = await whatsappAPI.sendTextMessage(to, message);
        
        res.json({ 
            success: true, 
            result,
            message: 'Test message sent successfully'
        });
    } catch (error: any) {
        console.error('Error sending test message:', error);
        res.status(500).json({ 
            error: 'Failed to send message',
            details: error.message 
        });
    }
});

// Admin endpoints for lead management
app.get('/admin/leads', (req, res) => {
    try {
        const leads = stateStore.getAllLeads();
        const stats = leadManager.getLeadStats(leads);
        
        res.json({
            success: true,
            stats,
            leads: leads.map(lead => ({
                userPhone: lead.userPhone,
                serviceType: lead.serviceType,
                confirmed: lead.confirmed,
                lastUpdated: lead.lastUpdated,
                answers: lead.answers
            }))
        });
    } catch (error) {
        console.error('Error getting leads:', error);
        res.status(500).json({ error: 'Failed to get leads' });
    }
});

app.get('/admin/leads/:phone', (req, res) => {
    try {
        const { phone } = req.params;
        const lead = stateStore.getLead(phone);
        
        if (!lead) {
            return res.status(404).json({ error: 'Lead not found' });
        }
        
        const summary = leadManager.formatLeadSummary(lead);
        
        res.json({
            success: true,
            lead,
            summary
        });
    } catch (error) {
        console.error('Error getting lead:', error);
        res.status(500).json({ error: 'Failed to get lead' });
    }
});

app.get('/admin/leads/export/csv', (req, res) => {
    try {
        const leads = stateStore.getAllLeads();
        const csv = leadManager.exportToCSV(leads);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="castello360-leads.csv"');
        res.send(csv);
    } catch (error) {
        console.error('Error exporting leads:', error);
        res.status(500).json({ error: 'Failed to export leads' });
    }
});

app.post('/admin/leads/:phone/confirm', async (req, res) => {
    try {
        const { phone } = req.params;
        const lead = stateStore.getLead(phone);
        
        if (!lead) {
            return res.status(404).json({ error: 'Lead not found' });
        }
        
        // Mark lead as confirmed
        stateStore.confirmLead(phone);
        
        // Send to Google Sheets if configured
        const sentToSheets = await leadManager.sendToGoogleSheets(lead);
        
        // Send confirmation message to user
        try {
            await whatsappAPI.sendTextMessage(
                phone,
                '✅ ¡Perfecto! Tu cotización ha sido confirmada. ' +
                'Nuestro equipo se pondrá en contacto contigo pronto para coordinar la sesión. ' +
                '¡Gracias por elegir Castello360! 🎉'
            );
        } catch (error) {
            console.warn('Could not send confirmation message to user:', error);
        }
        
        res.json({
            success: true,
            message: 'Lead confirmed successfully',
            sentToGoogleSheets: sentToSheets
        });
    } catch (error) {
        console.error('Error confirming lead:', error);
        res.status(500).json({ error: 'Failed to confirm lead' });
    }
});

app.delete('/admin/leads/:phone', (req, res) => {
    try {
        const { phone } = req.params;
        stateStore.resetState(phone);
        
        res.json({
            success: true,
            message: 'Lead deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting lead:', error);
        res.status(500).json({ error: 'Failed to delete lead' });
    }
});

// Bot conversation endpoint (for manual testing)
app.post('/bot/conversation', async (req, res) => {
    try {
        const { phone, message } = req.body;
        
        if (!phone || !message) {
            return res.status(400).json({ 
                error: 'Missing "phone" or "message" parameter' 
            });
        }

        // Process message through bot logic
        await botLogic.handleWebhook({
            object: 'whatsapp_business_account',
            entry: [{
                id: 'test',
                changes: [{
                    value: {
                        messaging_product: 'whatsapp',
                        metadata: {
                            display_phone_number: environment.BUSINESS_PHONE,
                            phone_number_id: environment.WABA_PHONE_NUMBER_ID
                        },
                        messages: [{
                            from: phone,
                            id: `test_${Date.now()}`,
                            timestamp: new Date().toISOString(),
                            type: 'text',
                            text: { body: message }
                        }]
                    },
                    field: 'messages'
                }]
            }]
        });
        
        res.json({ 
            success: true, 
            message: 'Message processed successfully' 
        });
    } catch (error: any) {
        console.error('Error processing conversation:', error);
        res.status(500).json({ 
            error: 'Failed to process conversation',
            details: error.message 
        });
    }
});

// Start server
const PORT = environment.PORT;

app.listen(PORT, () => {
    console.log('🚀 Castello360 WhatsApp Bot Server started');
    console.log(`📱 Business: ${environment.BUSINESS_NAME}`);
    console.log(`📞 Phone: ${environment.BUSINESS_PHONE}`);
    console.log(`🌐 Website: ${environment.BUSINESS_WEBSITE}`);
    console.log(`🔗 Server: http://localhost:${PORT}`);
    console.log(`✅ Health Check: http://localhost:${PORT}/health`);
    console.log(`🔗 Webhook: http://localhost:${PORT}/webhook`);
    console.log(`🧪 Test Message: POST http://localhost:${PORT}/test-message`);
    console.log(`👥 Admin Leads: http://localhost:${PORT}/admin/leads`);
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Configure webhook URL in Meta Developer Console');
    console.log('2. Set up environment variables in .env file');
    console.log('3. Test with your WhatsApp number');
    console.log('4. Check admin endpoints for lead management');
    console.log('');
    console.log('🎯 Bot ready to handle Castello360 tour quotes!');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Export app for testing
export default app;
