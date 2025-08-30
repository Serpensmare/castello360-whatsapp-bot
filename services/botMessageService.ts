import { MessageService } from './messageService';
import { ConfigService, BotConfig } from '../../../core/config/waConfig';
import { createLogger } from '../../../core/utils/logger';

export class BotMessageService extends MessageService {
    private static botInstances: Map<string, BotMessageService> = new Map();

    private constructor(botId: string) {
        const config = ConfigService.getInstance().getConfig(botId);
        const logger = createLogger(`WhatsApp-${config.name}`);
        super(config, logger);
        
        logger.info(`BotMessageService inicializado para ${config.name}`, {
            botId,
            phoneNumberId: config.phoneNumberId,
            apiVersion: config.apiVersion
        });
    }

    public static getInstance(botId: string): BotMessageService {
        if (!botId) {
            throw new Error('Se requiere un botId para obtener una instancia de BotMessageService');
        }
        
        if (!this.botInstances.has(botId)) {
            this.botInstances.set(botId, new BotMessageService(botId));
        }
        return this.botInstances.get(botId)!;
    }

    protected getAccessToken(): string {
        if (!this.config?.accessToken) {
            throw new Error(`No se encontró accessToken para el bot`);
        }
        return this.config.accessToken;
    }

    protected getPhoneNumberId(): string {
        if (!this.config?.phoneNumberId) {
            throw new Error(`No se encontró phoneNumberId para el bot`);
        }
        return this.config.phoneNumberId;
    }

    protected getApiVersion(): string {
        if (!this.config?.apiVersion) {
            throw new Error(`No se encontró apiVersion para el bot`);
        }
        return this.config.apiVersion;
    }

    protected getTempPath(): string {
        return this.config!.mediaPath || super.getTempPath();
    }
} 