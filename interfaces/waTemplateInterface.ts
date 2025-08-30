// Parámetros para plantillas
export interface WATemplateParameter {
    type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
    text?: string;
    currency?: {
        amount_1000: number;
        code: string;
        fallback_value: string;
    };
    date_time?: {
        fallback_value: string;
    };
    image?: {
        link: string;
    };
    document?: {
        link: string;
    };
    video?: {
        link: string;
    };
}

// Componentes de plantillas
export interface WATemplateComponent {
    type: 'header' | 'body' | 'button';
    sub_type?: 'CATALOG' | 'COPY_CODE' | 'FLOW' | 'MPM' | 'ORDER_DETAILS' | 'QUICK_REPLY' | 'REMINDER' | 'URL' | 'VOICE_CALL';
    parameters?: WATemplateParameter[];
    index?: number;
}

// Mensaje de plantilla
export interface WATemplateMessage {
    messaging_product: 'whatsapp';
    recipient_type: 'individual';
    to: string;
    type: 'template';
    template: {
        name: string;
        language: {
            code: string;
        };
        components?: WATemplateComponent[];
    };
} 