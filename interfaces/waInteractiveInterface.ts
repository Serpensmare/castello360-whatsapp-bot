// Interfaces para botones de respuesta rápida
export interface WAReplyButton {
    type: 'reply';
    reply: {
        id: string;
        title: string;
    };
}

// Interfaces para listas
export interface WAListRow {
    id: string;
    title: string;
    description?: string;
}

export interface WAListSection {
    title: string;
    rows: WAListRow[];
}

// Interfaces para headers
export interface WAMessageHeader {
    type: 'text' | 'image' | 'video';
    text?: string;
    image?: { link: string };
    video?: { link: string };
}

// Mensaje interactivo base
interface WAInteractiveBase {
    messaging_product: 'whatsapp';
    recipient_type: 'individual';
    to: string;
    type: 'interactive';
}

// Mensaje con botones
export interface WAButtonMessage extends WAInteractiveBase {
    interactive: {
        type: 'button';
        header?: WAMessageHeader;
        body: { text: string };
        footer?: { text?: string, image?: string, video?: string };
        action: {
            buttons: WAReplyButton[];
        };
    };
}

// Mensaje con lista
export interface WAListMessage extends WAInteractiveBase {
    interactive: {
        type: 'list';
        header?: WAMessageHeader;
        body: { text: string };
        footer?: { text: string };
        action: {
            button: string;
            sections: WAListSection[];
        };
    };
}

// flow
export interface WAFlowMessageInteractive extends WAInteractiveBase {
    interactive: {
        type: 'flow',
        header: {
            type: 'text' | 'image',
            text?: string,
            image?: { link: string }
        },
        body: {
            text: string
        },
        footer?: {
            text: string
        },
        action: {
            name: 'flow',
            parameters: {
                flow_message_version: '3',
                flow_name: string,
                flow_cta: string,
                flow_action: 'navigate',
                flow_action_payload?: {
                    screen: string,
                    data: Record<string, string>
                }
            }
        }
    }
}

// Mensaje con botón de URL CTA
export interface WACtaUrlMessage extends WAInteractiveBase {
    interactive: {
        type: 'cta_url';
        header?: WAMessageHeader;
        body?: { text: string }; // Hacer body opcional como en la doc
        footer?: { text: string };
        action: {
            name: 'cta_url';
            parameters: {
                display_text: string;
                url: string;
            };
        };
    };
}

// Tipo unión para mensajes interactivos
export type WAInteractiveMessage = WAButtonMessage | WAListMessage | WAFlowMessageInteractive | WACtaUrlMessage;

// Respuesta interactiva 
export interface WAInteractiveResponse {
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
} 