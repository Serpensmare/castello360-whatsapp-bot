import { Schema, model, Document } from 'mongoose';

interface IFailedMessage extends Document {
    messageId: string;
    phone: string;
    status: string;
    timestamp: Date;
    errorCode?: string;
    errorCategory?: string;
    errorDetails: any[];
    originalMessage: any;
    influencer: string;
    retryCount: number;
    resolved: boolean;
    user: any;
    createdAt: Date;
    updatedAt: Date;
}

const failedMessageSchema = new Schema<IFailedMessage>({
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
    status: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        required: true
    },
    errorCode: {
        type: String,
        index: true
    },
    errorCategory: {
        type: String,
        index: true
    },
    errorDetails: {
        type: Schema.Types.Mixed,
        default: []
    },
    originalMessage: {
        type: Schema.Types.Mixed
    },
    influencer: {
        type: String,
        default: 'almascreadoras',
        index: true
    },
    retryCount: {
        type: Number,
        default: 0
    },
    resolved: {
        type: Boolean,
        default: false,
        index: true
    },
    user: {
        type: Schema.Types.Mixed
    }
}, {
    timestamps: true,
    versionKey: false
});

export const FailedMessage = model<IFailedMessage>('FailedMessage', failedMessageSchema);
