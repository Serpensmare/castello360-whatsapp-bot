import { WATemplateMessage, WATemplateParameter, WATemplateComponent } from '../interfaces/waTemplateInterface';
import whatsappService from './messageService';
import { createLogger } from '../../../core/utils/logger';
import { WAMessage } from '../interfaces/waMessageInterface';

const logger = createLogger('WhatsAppTemplate');

export class TemplateService {
    private static instance: TemplateService;

    private constructor() {}

    public static getInstance(): TemplateService {
        if (!TemplateService.instance) {
            TemplateService.instance = new TemplateService();
        }
        return TemplateService.instance;
    }

    /**
     * Envía una plantilla con variables de texto
     */
    public async sendTemplate(
        to: string,
        templateName: string,
        languageCode: string,
        variables?: string[]
    ): Promise<any> {
        const message = this.createTemplateMessage(to, templateName, languageCode);
        
        if (variables && variables.length > 0) {
            message.template.components = [{
                type: 'body',
                parameters: variables.map(text => ({ type: 'text', text }))
            }];
        }

        return whatsappService.sendMessage(message as WAMessage);
    }

    /**
     * Envía una plantilla con componentes personalizados
     */
    public async sendTemplateWithComponents(
        to: string,
        templateName: string,
        languageCode: string,
        components?: WATemplateComponent[]
    ): Promise<any> {
        const message = this.createTemplateMessage(to, templateName, languageCode);
        message.template.components = components;
        return whatsappService.sendMessage(message as WAMessage);
    }

    /**
     * Crea un mensaje de plantilla base
     */
    private createTemplateMessage(
        to: string,
        templateName: string,
        languageCode: string
    ): WATemplateMessage {
        return {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'template',
            template: {
                name: templateName,
                language: {
                    code: languageCode
                }
            }
        };
    }

    /**
     * Helpers para crear parámetros
     */
    public createTextParameter(text: string): WATemplateParameter {
        return { type: 'text', text };
    }

    public createCurrencyParameter(amount: number, currencyCode: string, fallbackValue: string): WATemplateParameter {
        return {
            type: 'currency',
            currency: {
                amount_1000: amount * 1000,
                code: currencyCode,
                fallback_value: fallbackValue
            }
        };
    }

    public createDateTimeParameter(fallbackValue: string): WATemplateParameter {
        return {
            type: 'date_time',
            date_time: {
                fallback_value: fallbackValue
            }
        };
    }

    public createImageParameter(imageUrl: string): WATemplateParameter {
        return {
            type: 'image',
            image: {
                link: imageUrl
            }
        };
    }

    public createDocumentParameter(documentUrl: string): WATemplateParameter {
        return {
            type: 'document',
            document: {
                link: documentUrl
            }
        };
    }

    public createVideoParameter(videoUrl: string): WATemplateParameter {
        return {
            type: 'video',
            video: {
                link: videoUrl
            }
        };
    }

    /**
     * Helpers para crear componentes
     */
    public createBodyComponent(parameters: WATemplateParameter[]): WATemplateComponent {
        return {
            type: 'body',
            parameters
        };
    }

    public createHeaderComponent(parameters: WATemplateParameter[]): WATemplateComponent {
        return {
            type: 'header',
            parameters
        };
    }

    public createButtonComponent(parameters: WATemplateParameter[]): WATemplateComponent {
        return {
            type: 'button',
            parameters
        };
    }
}

export default TemplateService.getInstance(); 