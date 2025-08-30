import { Schema, model, Document } from 'mongoose';

interface IWAMessage extends Document {
    messageId: string;
    phone: string;
    botId: string;
    status: string;
    messageType: string;
    timestamp: Date;
    originalMessage: any;
    processingTime?: number;
    templateName?: string;
    influencer: string;
    rateLimit?: {
        remaining?: number;
        reset?: number;
    };
    user?: any;
    createdAt: Date;
    updatedAt: Date;
}

const waMessageSchema = new Schema<IWAMessage>({
    messageId: { 
        type: String, 
        required: true, 
        unique: true,
        index: true 
    },
    phone: {
        type: String,
        required: true,
        index: true
    },
    botId: {
        type: String,
        required: true,
        index: true
    },
    status: {
        type: String,
        required: true,
        default: 'sent',
        index: true
    },
    messageType: {
        type: String,
        required: true,
        enum: ['text', 'template', 'image', 'video', 'audio', 'document', 'location', 'interactive', 'contacts'],
        index: true
    },
    timestamp: {
        type: Date,
        required: true,
        default: Date.now
    },
    originalMessage: {
        type: Schema.Types.Mixed
    },
    processingTime: {
        type: Number
    },
    templateName: {
        type: String,
        index: true
    },
    influencer: {
        type: String,
        default: 'almascreadoras',
        index: true
    },
    rateLimit: {
        remaining: Number,
        reset: Number
    },
    user: {
        type: Schema.Types.Mixed
    }
}, {
    timestamps: true,
    versionKey: false
});

// Crear índices compuestos para consultas comunes
waMessageSchema.index({ botId: 1, createdAt: -1 });
waMessageSchema.index({ phone: 1, createdAt: -1 });

export const WAMessage = model<IWAMessage>('WAMessage', waMessageSchema);
