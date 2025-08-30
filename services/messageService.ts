import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { WAMessage, WATextMessage, WAMediaMessage, WAContactMessage, WAContact, WAReactionMessage, WALocationMessage, WATemplateMessage, WATypingIndicatorMessage } from '../interfaces/waMessageInterface';
import { createLogger } from '../../../core/utils/logger';
import { WAButtonMessage, WAFlowMessageInteractive, WAListMessage, WAListSection, WAMessageHeader, WACtaUrlMessage } from '../interfaces/waInteractiveInterface';
import { QueueService } from '../../../core/queue/queueService';
import { environment } from '@core/config/environment';
import { ConfigService, BotConfig } from '@core/config/waConfig';

export class MessageService {
    protected logger;
    private readonly tempPath: string;
    private static instances: Map<string, MessageService> = new Map();
    protected config?: BotConfig;

    protected constructor(config?: BotConfig, customLogger = createLogger('WhatsAppMessage')) {
        this.logger = customLogger;
        this.config = config;
        this.tempPath = this.getTempPath();
        this.createTempDirectories();

        // Log de información detallada sobre la instancia creada
        if (config) {
            this.logger.info('MessageService inicializado con configuración específica de bot', { 
                botId: config.botId,
                name: config.name,
                phoneNumberId: config.phoneNumberId,
                apiVersion: config.apiVersion,
                tempPath: this.tempPath
            });
        } else {
            this.logger.info('MessageService inicializado con configuración global', { 
                apiUrl: this.getApiUrl(),
                phoneNumberId: this.getPhoneNumberId(),
                tempPath: this.tempPath
            });
        }
    }

    public static getInstance(botId?: string): MessageService {
        // Si no se proporciona botId, usar una instancia por defecto
        const key = botId || 'default';
        
        if (!this.instances.has(key)) {
            if (botId) {
                const config = ConfigService.getInstance().getConfig(botId);
                this.instances.set(key, new MessageService(config));
            } else {
                this.instances.set(key, new MessageService());
            }
        }
        
        return this.instances.get(key)!;
    }

    protected getAccessToken(): string {
        return this.config?.accessToken || environment.WHATSAPP_ACCESS_TOKEN || '';
    }

    protected getPhoneNumberId(): string {
        // Si hay una configuración específica del bot, usarla siempre
        if (this.config?.phoneNumberId) {
            return this.config.phoneNumberId;
        }
        // Solo usar el valor predeterminado si no hay configuración específica
        return environment.WHATSAPP_PHONE_NUMBER_ID || '';
    }

    protected getApiVersion(): string {
        // Si hay una configuración específica del bot, usarla siempre
        if (this.config?.apiVersion) {
            return this.config.apiVersion;
        }
        // Solo usar el valor predeterminado si no hay configuración específica
        return environment.WHATSAPP_API_VERSION || 'v22.0';
    }

    protected getTempPath(): string {
        if (this.config?.mediaPath) {
            return this.config.mediaPath;
        }
        
        // Usar la ruta correcta según el entorno
        if (environment.IS_DEVELOPMENT) {
            return path.join(environment.ROOT_PATH, 'src/modules/whatsapp/temp');
        } else {
            return path.join(environment.ROOT_PATH, 'dist/modules/whatsapp/temp');
        }
    }

    protected getApiUrl(): string {
        return `https://graph.facebook.com/${this.getApiVersion()}`;
    }

    /**
     * Envía cualquier tipo de mensaje a la API de WhatsApp
     */
    public async sendMessage(message: WAMessage): Promise<any> {
        try {
            await QueueService.enqueueSendMessage(
                this.config?.botId || '',
                message.to,
                JSON.stringify(message)
            );
            
            return { queued: true };
        } catch (error: any) {
            this.logger.error('Error al encolar mensaje:', error);
            throw error;
        }
    }

    /**
    * Envía un mensaje de plantilla a la cola de envío
    */
    public async sendTemplateMessageQueue(message: WATemplateMessage): Promise<any> {
        try {
            await QueueService.enqueueSendTemplate(
                this.config?.botId || '',
                message.to,
                JSON.stringify(message)
            );
            return { queued: true };
        } catch (error: any) {
            this.logger.error('Error al encolar mensaje:', error);
            throw error;
        }
    }

    /**
     * Envía un mensaje de plantilla
     */
    public async sendTemplateMessage(
        to: string, 
        templateName: string, 
        languageCode: string, 
        variables?: string[],
        buttonPayloads?: Array<{ index: number; payload: string }>,
        header?: {
            type: 'video' | 'image',
            video?: {
                link: string
            },
            image?: {
                link: string
            }
        }
    ): Promise<any> {
        const components: any[] = [];

        if (variables && variables.length > 0) {
            components.push({
                type: 'body',
                parameters: variables.map(variable => ({
                    type: 'text',
                    text: variable
                }))
            });
        }

        if (buttonPayloads && buttonPayloads.length > 0) {
            buttonPayloads.forEach(btn => {
                components.push({
                    type: 'button',
                    sub_type: 'quick_reply',
                    index: btn.index.toString(),
                    parameters: [
                        {
                            type: 'payload',
                            payload: btn.payload
                        }
                    ]
                });
            });
        }

        if (header) {
            components.push({
                type: 'header',
                parameters: [header]
            });
        }

        const message: WATemplateMessage = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'template',
            template: {
                name: templateName,
                language: {
                    code: languageCode
                },
                components: components.length > 0 ? components : undefined
            }
        };
        return this.sendTemplateMessageQueue(message);
    }

    /**
     * Envía un mensaje de texto simple
     */
    public async sendTextMessage(to: string, text: string): Promise<any> {
        text = text.replace(/\*\*/g, '*') 
                  .replace(/###\s*/g, '•')
                  .replace(/--\s*/g, '•')
        const message: WATextMessage = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'text',
            text: { body: text }
        };
        return this.sendMessage(message);
    }

    /**
     * Envía un mensaje con media
     */
    public async sendMediaMessage(
        to: string, 
        mediaType: 'image' | 'video' | 'audio' | 'document',
        mediaPath: string,
        caption?: string,
        filename?: string
    ): Promise<any> {
        const message: WAMediaMessage = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: mediaType,
            [mediaType]: {
                link: mediaPath,
                caption,
                filename
            }
        };
        return this.sendMessage(message);
    }

    /**
     * Envía un mensaje con información de contacto
     */
    public async sendContactMessage(
        to: string,
        contact: WAContact
    ): Promise<any> {
        const message: WAContactMessage = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'contacts',
            contacts: [contact]
        };
        return this.sendMessage(message);
    }

    /**
     * Helper para crear un contacto básico
     */
    public createBasicContact(
        formattedName: string,
        phone: string,
        firstName?: string,
        lastName?: string,
        email?: string
    ): WAContact {
        const contact: WAContact = {
            name: {
                formatted_name: formattedName,
                first_name: firstName,
                last_name: lastName
            }
        };

        if (phone) {
            contact.phones = [{
                phone,
                type: 'CELL',
                wa_id: phone
            }];
        }

        if (email) {
            contact.emails = [{
                email,
                type: 'WORK'
            }];
        }

        return contact;
    }

    /**
     * Descarga media desde la API de WhatsApp
     */
    public async downloadMedia(mediaId: string, mediaType: string): Promise<string> {
        try {
            // Obtener URL de descarga
            const mediaUrl = await this.getMediaUrl(mediaId);
            
            // Determinar extensión y subcarpeta
            const { ext, subFolder } = this.getMediaTypeInfo(mediaType);
            
            // Crear nombre de archivo único
            const fileName = `${Date.now()}_${mediaId}${ext}`;
            const filePath = path.join(this.tempPath, subFolder, fileName);
            
            // Descargar archivo
            const response = await axios.get(mediaUrl, {
                headers: { 'Authorization': `Bearer ${this.getAccessToken()}` },
                responseType: 'stream'
            });
            
            // Guardar archivo
            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);
            
            return new Promise((resolve, reject) => {
                writer.on('finish', () => resolve(filePath));
                writer.on('error', reject);
            });
        } catch (error) {
            this.logger.error('Error al descargar media:', error);
            throw error;
        }
    }

    private async getMediaUrl(mediaId: string): Promise<string> {
        try {
            const response = await axios.get(
                `${this.getApiUrl()}/${mediaId}`,
                { headers: { 'Authorization': `Bearer ${this.getAccessToken()}` } }
            );
            return response.data.url;
        } catch (error) {
            this.logger.error('Error al obtener URL de media:', error);
            throw error;
        }
    }

    private getMediaTypeInfo(mediaType: string): { ext: string, subFolder: string } {
        switch (mediaType) {
            case 'image':
                return { ext: '.jpg', subFolder: 'images' };
            case 'video':
                return { ext: '.mp4', subFolder: 'video' };
            case 'audio':
                return { ext: '.mp3', subFolder: 'audio' };
            case 'document':
                return { ext: '.pdf', subFolder: 'documents' };
            default:
                return { ext: '', subFolder: 'other' };
        }
    }

    protected createTempDirectories(): void {
        const subFolders = ['images', 'video', 'audio', 'documents', 'other'];
        if (!fs.existsSync(this.tempPath)) {
            fs.mkdirSync(this.tempPath, { recursive: true });
        }
        subFolders.forEach(folder => {
            const folderPath = path.join(this.tempPath, folder);
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }
        });
    }

    /**
     * Envía una reacción a un mensaje específico
     */
    public async sendReactionMessage(
        to: string,
        messageId: string,
        emoji: string
    ): Promise<any> {
        const message: WAReactionMessage = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'reaction',
            reaction: {
                message_id: messageId,
                emoji
            }
        };
        return this.sendMessage(message);
    }

    /**
     * Envía una ubicación
     */
    public async sendLocationMessage(
        to: string,
        latitude: number,
        longitude: number,
        name: string,
        address: string
    ): Promise<any> {
        const message: WALocationMessage = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'location',
            location: {
                latitude,
                longitude,
                name,
                address
            }
        };
        return this.sendMessage(message);
    }

    /**
     * Responde a un mensaje específico
     */
    public async replyToMessage(
        to: string,
        messageId: string,
        text: string,
        previewUrl: boolean = false
    ): Promise<any> {
        const message: WATextMessage = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            context: {
                message_id: messageId
            },
            type: 'text',
            text: {
                body: text,
                preview_url: previewUrl
            }
        };
        return this.sendMessage(message);
    }

    public async sendButtonMessage(
        to: string,
        bodyText: string,
        buttons: Array<{ id: string; title: string }>,
        headerContent?: WAMessageHeader,
        footerText?: string,
        footerImage?: string,
        footerVideo?: string,
    ): Promise<any> {
        if (buttons.length > 3) {
            this.logger.warn('WhatsApp solo permite hasta 3 botones. Se truncará la lista.');
            buttons = buttons.slice(0, 3);
        }
        buttons = buttons.map(button => ({
            id: button.id,
            title: button.title.length > 20 ? button.title.substring(0, 20) : button.title
        }));

        const message: WAButtonMessage = {
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

        if (headerContent) {
            message.interactive.header = headerContent;
        }

        if (footerText) {
            message.interactive.footer = { text: footerText };
        }

        

        return this.sendMessage(message);
    }

    /**
     * Envía un mensaje con lista de opciones
     */
    public async sendListMessage(
        to: string,
        bodyText: string,
        buttonText: string,
        sections: WAListSection[],
        headerContent?: WAMessageHeader,
        footerText?: string
    ): Promise<any> {
        // Validar límites de WhatsApp
        let totalRows = 0;
        sections.forEach(section => {
            totalRows += section.rows.length;
        });

        if (totalRows > 10) {
            this.logger.warn('WhatsApp solo permite hasta 10 items en total. Se truncará la lista.');
            // Truncar secciones para no exceder 10 items
            let remainingItems = 10;
            sections = sections.reduce((acc: WAListSection[], section) => {
                if (remainingItems <= 0) return acc;
                
                const truncatedSection = {
                    ...section,
                    rows: section.rows.slice(0, remainingItems)
                };
                remainingItems -= truncatedSection.rows.length;
                
                return [...acc, truncatedSection];
            }, []);
        }

        const message: WAListMessage = {
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

        if (headerContent) {
            message.interactive.header = headerContent;
        }

        if (footerText) {
            message.interactive.footer = { text: footerText };
        }

        return this.sendMessage(message);
    }

    public async sendFlowMessage({
        to, 
        flowName, 
        flowAction,
        headerType,
        headerText,
        headerImage,
        bodyText,
        footerText,
        flow_action_payload
    }: {
        to: string, 
        flowName: string, 
        flowAction: string,
        headerType: 'text' | 'image',
        headerText?: string,
        headerImage?: {
            link: string
        },
        bodyText: string,
        footerText?: string,
        flow_action_payload?: any
    }): Promise<any> {
        const message: WAFlowMessageInteractive & {
            messaging_product: 'whatsapp';
            recipient_type: 'individual';
            to: string;
            type: 'interactive';
            } = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to,
                type: 'interactive',
                interactive: {
                    type: 'flow',
                    header: {
                        type: headerType,
                        text: headerText,
                        image: headerImage
                    },
                    body: {
                        text: bodyText
                    },
                    ...(footerText ? { footer: { text: footerText } } : {}),
                    action: {
                        name: 'flow',   
                        parameters: {
                            flow_message_version: '3',
                            flow_name: flowName,
                            flow_cta: flowAction,
                            flow_action: 'navigate',
                            ...(flow_action_payload ? { flow_action_payload: flow_action_payload } : {})
                        }
                    }
                }
            };  
            console.log("Enviando flow de edición", JSON.stringify(message));
        return this.sendMessage(message);  
    }

 
    public async sendDirectMessage(message: WAMessage): Promise<any> {
        try {
            const phoneNumberId = this.getPhoneNumberId();
            const apiUrl = this.getApiUrl();
            const url = `${apiUrl}/${phoneNumberId}/messages`;
            
            // Log detallado con la información de configuración que se usará para enviar el mensaje
            this.logger.info('Enviando mensaje directo a WhatsApp', { 
                phoneNumberId,
                apiUrl,
                recipient: message.to,
                messageType: message.type,
                botId: this.config?.botId || 'default'
            });

            const response = await axios.post(url, message, {
                headers: {
                    'Authorization': `Bearer ${this.getAccessToken()}`,
                    'Content-Type': 'application/json'
                }
            });

            this.logger.info('Mensaje enviado exitosamente', {
                messageId: response.data.messages?.[0]?.id,
                recipient: message.to,
                botId: this.config?.botId || 'default'
            });

            return response.data;
        } catch (error: any) {
            const errorDetails = {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message,
                phoneNumberId: this.getPhoneNumberId(),
                botId: this.config?.botId || 'default'
            };
            this.logger.error('Error al enviar mensaje:', errorDetails);
            throw error;
        }
    }
    
    public async sendDirectTemplateMessage(message: WATemplateMessage): Promise<any> {
        try {
            const url = `${this.getApiUrl()}/${this.getPhoneNumberId()}/messages`;
            const response = await axios.post(url, message, {
                headers: { 
                    'Authorization': `Bearer ${this.getAccessToken()}`,
                    'Content-Type': 'application/json'
                }
            });
            this.logger.info('Mensaje enviado exitosamente', {
                response: response.data
            });
            return response.data;
        } catch (error: any) {
            const errorDetails = {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            };
            this.logger.error('Error al enviar mensaje:', errorDetails);
            throw error;
        }
    }

    /**
     * Marca un mensaje como leído y muestra un indicador de escritura en WhatsApp
     * El indicador de escritura se mostrará hasta que se envíe una respuesta o hasta 25 segundos, lo que ocurra primero
     * @param messageId ID del mensaje recibido del webhook
     */
    public async sendTypingIndicator(messageId: string): Promise<any> {
        try {
            const typingIndicator: WATypingIndicatorMessage = {
                messaging_product: 'whatsapp',
                status: 'read',
                message_id: messageId,
                typing_indicator: {
                    type: 'text'
                }
            };

            const phoneNumberId = this.getPhoneNumberId();
            const apiUrl = this.getApiUrl();
            const url = `${apiUrl}/${phoneNumberId}/messages`;
            
            this.logger.info('Enviando indicador de escritura', { 
                phoneNumberId,
                messageId,
                botId: this.config?.botId || 'default'
            });

            const response = await axios.post(url, typingIndicator, {
                headers: {
                    'Authorization': `Bearer ${this.getAccessToken()}`,
                    'Content-Type': 'application/json'
                }
            });

            this.logger.info('Indicador de escritura enviado exitosamente', {
                messageId,
                response: response.data,
                botId: this.config?.botId || 'default'
            });

            return response.data;
        } catch (error: any) {
            const errorDetails = {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message,
                messageId,
                botId: this.config?.botId || 'default'
            };
            this.logger.error('Error al enviar indicador de escritura:', errorDetails);
            throw error;
        } 
    }

    /**
     * Elimina un mensaje enviado previamente usando su message ID
     * @param messageId ID del mensaje que se desea eliminar
     */
    public async deleteMessage(messageId: string): Promise<any> {
        try {
            const phoneNumberId = this.getPhoneNumberId();
            const apiUrl = this.getApiUrl();
            const url = `${apiUrl}/${phoneNumberId}/messages`;
            
            const deletePayload = {
                messaging_product: 'whatsapp',
                status: 'deleted',
                message_id: messageId
            };
            
            this.logger.info('Eliminando mensaje de WhatsApp', { 
                phoneNumberId,
                messageId,
                botId: this.config?.botId || 'default'
            });

            const response = await axios.post(url, deletePayload, {
                headers: {
                    'Authorization': `Bearer ${this.getAccessToken()}`,
                    'Content-Type': 'application/json'
                }
            });

            this.logger.info('Mensaje eliminado exitosamente', {
                messageId,
                response: response.data,
                botId: this.config?.botId || 'default'
            });

            return response.data;
        } catch (error: any) {
            const errorDetails = {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message,
                messageId,
                botId: this.config?.botId || 'default'
            };
            this.logger.error('Error al eliminar mensaje:', errorDetails);
            throw error;
        }
    }

    /**
     * Envía un mensaje interactivo con un botón de URL "Call-to-Action"
     */
    public async sendCtaUrlMessage(
        to: string,
        displayText: string,
        url: string,
        bodyText?: string,
        headerText?: string,
        footerText?: string
    ): Promise<any> {
        const message: WACtaUrlMessage = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'interactive',
            interactive: {
                type: 'cta_url',
                action: {
                    name: 'cta_url',
                    parameters: {
                        display_text: displayText,
                        url
                    }
                }
            }
        };

        if (headerText) {
            message.interactive.header = {
                type: 'text',
                text: headerText
            };
        }

        if (bodyText) {
            message.interactive.body = { text: bodyText };
        }

        if (footerText) {
            message.interactive.footer = { text: footerText };
        }

        return this.sendMessage(message);
    }
}

export default MessageService.getInstance();
