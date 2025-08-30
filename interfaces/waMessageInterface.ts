import { WAButtonMessage, WAListMessage, WAFlowMessageInteractive, WACtaUrlMessage } from './waInteractiveInterface';

// Interfaz base para todos los mensajes
export interface WAMessageBase {
    messaging_product: 'whatsapp';
    recipient_type: 'individual';
    to: string;
    context?: {
        message_id: string;
    };
}

// Interfaz básica para mensajes de texto
export interface WATextMessage extends WAMessageBase {
    type: 'text';
    text: {
        body: string;
        preview_url?: boolean;
    };
}

// Interfaz para mensajes de medios
export interface WAMediaMessage extends WAMessageBase {
    type: 'image' | 'video' | 'audio' | 'document';
    [key: string]: any; // Para el contenido específico del tipo de medio
}

export interface WATemplateMessage extends WAMessageBase {
    type: 'template';
    template: {
        name: string;
        language: {
            code: string;
        };
        components?: Array<{
            type: 'body' | 'header' | 'button';
            parameters: Array<{
                type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
                [key: string]: any;
            }>;
        }>;
    };
}

// Interfaces para contactos
export interface WAContactAddress {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    country_code?: string;
    type: 'HOME' | 'WORK';
}

export interface WAContactEmail {
    email: string;
    type: 'HOME' | 'WORK';
}

export interface WAContactName {
    formatted_name: string;
    first_name?: string;
    last_name?: string;
    middle_name?: string;
    suffix?: string;
    prefix?: string;
}

export interface WAContactOrg {
    company?: string;
    department?: string;
    title?: string;
}

export interface WAContactPhone {
    phone: string;
    type: 'CELL' | 'MAIN' | 'IPHONE' | 'HOME' | 'WORK';
    wa_id?: string;
}

export interface WAContactUrl {
    url: string;
    type: 'HOME' | 'WORK';
}

export interface WAContact {
    addresses?: WAContactAddress[];
    birthday?: string;  // YYYY-MM-DD
    emails?: WAContactEmail[];
    name: WAContactName;
    org?: WAContactOrg;
    phones?: WAContactPhone[];
    urls?: WAContactUrl[];
}

export interface WAContactMessage extends WAMessageBase {
    type: 'contacts';
    contacts: WAContact[];
}

// Interfaz para mensajes de reacción
export interface WAReactionMessage extends WAMessageBase {
    type: 'reaction';
    reaction: {
        message_id: string;
        emoji: string;
    };
}

// Interfaz para mensajes de ubicación
export interface WALocationMessage extends WAMessageBase {
    type: 'location';
    location: {
        latitude: number;
        longitude: number;
        name: string;
        address: string;
    };
}

// Interfaz para indicadores de escritura
export interface WATypingIndicatorMessage {
    messaging_product: 'whatsapp';
    status: 'read';
    message_id: string;
    typing_indicator: {
        type: 'text';
    };
}

// Tipo unión para todos los mensajes posibles
export type WAMessage = WATextMessage | WAMediaMessage | WATemplateMessage | WAButtonMessage | WAListMessage | WAFlowMessageInteractive | WAContactMessage | WAReactionMessage | WALocationMessage | WACtaUrlMessage;

// Interfaces para webhooks
export interface WAWebhookEntry {
    id: string;
    changes: Array<{
        value: {
            messaging_product: 'whatsapp';
            metadata: {
                display_phone_number: string;
                phone_number_id: string;
            };
            contacts?: Array<{
                profile: {
                    name: string;
                };
                wa_id: string;
            }>;
            messages?: Array<{
                from: string;
                id: string;
                timestamp: string;
                type: string;
                text?: {
                    body: string;
                };
                image?: {
                    id: string;
                    caption?: string;
                };
                video?: {
                    id: string;
                    caption?: string;
                };
                audio?: {
                    id: string;
                };
                document?: {
                    id: string;
                    filename?: string;
                };
                interactive?: {
                    type: 'button_reply' | 'list_reply';
                    button_reply?: {
                        id: string;
                        title: string;
                    };
                    list_reply?: {
                        id: string;
                        title: string;
                        description?: string;
                    };
                };
            }>;
        };
        field: string;
    }>;
}

export interface WAWebhookPayload {
    object: string;
    entry: WAWebhookEntry[];
}

export interface WAButton {
    type: 'reply' | 'url';
    reply?: {
        id: string;
        title: string;
    };
    url?: string;
    title?: string;
}

export interface WAInteractiveButton {
    type: 'button';
    body: {
        text: string;
    };
    action: {
        buttons: WAButton[];
    };
    header?: {
        type: 'text' | 'image';
        text?: string;
        image?: {
            link: string;
        };
    };
    footer?: {
        text: string;
    };
}

export interface WAInteractiveMessage {
    messaging_product: 'whatsapp';
    recipient_type: 'individual';
    to: string;
    type: 'interactive';
    interactive: WAFlowMessageInteractive | WAButtonMessage | WAListMessage;
}

export { WAFlowMessageInteractive };
