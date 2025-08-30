import axios from 'axios';
import { environment } from './config/environment';

// WhatsApp API helper for Castello360 bot
export class WhatsAppAPI {
    private readonly baseUrl: string;
    private readonly phoneNumberId: string;
    private readonly accessToken: string;

    constructor() {
        this.baseUrl = 'https://graph.facebook.com/v20.0';
        this.phoneNumberId = environment.WABA_PHONE_NUMBER_ID;
        this.accessToken = environment.META_WABA_TOKEN;
    }

    /**
     * Send text message
     */
    async sendTextMessage(to: string, text: string): Promise<any> {
        const message = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'text',
            text: { body: text }
        };

        return this.sendMessage(message);
    }

    /**
     * Send interactive buttons message
     */
    async sendInteractiveButtons(
        to: string,
        bodyText: string,
        buttons: Array<{ id: string; title: string }>,
        headerText?: string,
        footerText?: string
    ): Promise<any> {
        // WhatsApp only allows up to 3 buttons
        if (buttons.length > 3) {
            buttons = buttons.slice(0, 3);
        }

        // Truncate button titles to 20 characters
        buttons = buttons.map(button => ({
            ...button,
            title: button.title.length > 20 ? button.title.substring(0, 20) : button.title
        }));

        const message = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'interactive',
            interactive: {
                type: 'button',
                body: { text: bodyText },
                action: {
                    buttons: buttons.map(button => ({
                        type: 'reply',
                        reply: {
                            id: button.id,
                            title: button.title
                        }
                    }))
                }
            }
        };

        if (headerText) {
            message.interactive.header = {
                type: 'text',
                text: headerText
            };
        }

        if (footerText) {
            message.interactive.footer = { text: footerText };
        }

        return this.sendMessage(message);
    }

    /**
     * Send list message
     */
    async sendListMessage(
        to: string,
        bodyText: string,
        buttonText: string,
        sections: Array<{
            title: string;
            rows: Array<{
                id: string;
                title: string;
                description?: string;
            }>;
        }>,
        headerText?: string,
        footerText?: string
    ): Promise<any> {
        // WhatsApp only allows up to 10 total rows
        let totalRows = 0;
        sections.forEach(section => {
            totalRows += section.rows.length;
        });

        if (totalRows > 10) {
            // Truncate sections to not exceed 10 items
            let remainingItems = 10;
            sections = sections.reduce((acc: typeof sections, section) => {
                if (remainingItems <= 0) return acc;
                
                const truncatedSection = {
                    ...section,
                    rows: section.rows.slice(0, remainingItems)
                };
                remainingItems -= truncatedSection.rows.length;
                
                return [...acc, truncatedSection];
            }, []);
        }

        const message = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'interactive',
            interactive: {
                type: 'list',
                body: { text: bodyText },
                action: {
                    button: buttonText,
                    sections
                }
            }
        };

        if (headerText) {
            message.interactive.header = {
                type: 'text',
                text: headerText
            };
        }

        if (footerText) {
            message.interactive.footer = { text: footerText };
        }

        return this.sendMessage(message);
    }

    /**
     * Send template message
     */
    async sendTemplateMessage(
        to: string,
        templateName: string,
        languageCode: string = 'es',
        variables?: string[]
    ): Promise<any> {
        const message = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'template',
            template: {
                name: templateName,
                language: { code: languageCode }
            }
        };

        if (variables && variables.length > 0) {
            message.template.components = [{
                type: 'body',
                parameters: variables.map(variable => ({
                    type: 'text',
                    text: variable
                }))
            }];
        }

        return this.sendMessage(message);
    }

    /**
     * Send typing indicator
     */
    async sendTypingIndicator(to: string): Promise<any> {
        const message = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'reaction',
            reaction: {
                type: 'typing'
            }
        };

        return this.sendMessage(message);
    }

    /**
     * Send read receipt
     */
    async sendReadReceipt(messageId: string): Promise<any> {
        const message = {
            messaging_product: 'whatsapp',
            status: 'read',
            message_id: messageId
        };

        const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
        
        try {
            const response = await axios.post(url, message, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return response.data;
        } catch (error) {
            console.error('Error sending read receipt:', error);
            throw error;
        }
    }

    /**
     * Generic message sender
     */
    private async sendMessage(message: any): Promise<any> {
        const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
        
        try {
            console.info('Sending WhatsApp message:', {
                to: message.to,
                type: message.type,
                phoneNumberId: this.phoneNumberId
            });

            const response = await axios.post(url, message, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            console.info('WhatsApp message sent successfully:', {
                messageId: response.data.messages?.[0]?.id,
                to: message.to
            });

            return response.data;
        } catch (error: any) {
            console.error('Error sending WhatsApp message:', {
                error: error.message,
                status: error.response?.status,
                data: error.response?.data,
                message: message
            });
            
            // Implement retry logic with exponential backoff
            if (error.response?.status >= 500) {
                return this.retryMessage(message);
            }
            
            throw error;
        }
    }

    /**
     * Retry message with exponential backoff
     */
    private async retryMessage(message: any, attempt: number = 1): Promise<any> {
        const maxAttempts = 3;
        const baseDelay = 1000; // 1 second
        
        if (attempt > maxAttempts) {
            throw new Error(`Failed to send message after ${maxAttempts} attempts`);
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        
        console.info(`Retrying message send, attempt ${attempt}/${maxAttempts} in ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        try {
            return await this.sendMessage(message);
        } catch (error) {
            return this.retryMessage(message, attempt + 1);
        }
    }

    /**
     * Download media from WhatsApp
     */
    async downloadMedia(mediaId: string): Promise<{ url: string; mimeType: string }> {
        try {
            const url = `${this.baseUrl}/${mediaId}`;
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
            
            return {
                url: response.data.url,
                mimeType: response.data.mime_type
            };
        } catch (error) {
            console.error('Error downloading media:', error);
            throw error;
        }
    }

    /**
     * Get media content
     */
    async getMediaContent(mediaUrl: string): Promise<Buffer> {
        try {
            const response = await axios.get(mediaUrl, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                },
                responseType: 'arraybuffer'
            });
            
            return Buffer.from(response.data);
        } catch (error) {
            console.error('Error getting media content:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const whatsappAPI = new WhatsAppAPI();
