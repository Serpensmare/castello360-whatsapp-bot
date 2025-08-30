import { environment } from './environment';

export interface BotConfig {
    botId: string;
    name: string;
    accessToken: string;
    phoneNumberId: string;
    apiVersion: string;
    mediaPath?: string;
}

export class ConfigService {
    private static instance: ConfigService;
    private botConfigs: Map<string, BotConfig> = new Map();

    private constructor() {
        // Initialize with default bot configuration
        this.botConfigs.set('main_bot', {
            botId: 'main_bot',
            name: environment.BOT_NAME,
            accessToken: environment.WHATSAPP_ACCESS_TOKEN,
            phoneNumberId: environment.WHATSAPP_PHONE_NUMBER_ID,
            apiVersion: environment.WHATSAPP_API_VERSION,
            mediaPath: environment.MEDIA_PATH
        });
    }

    public static getInstance(): ConfigService {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService();
        }
        return ConfigService.instance;
    }

    public getConfig(botId: string): BotConfig {
        const config = this.botConfigs.get(botId);
        if (!config) {
            throw new Error(`Bot configuration not found for ID: ${botId}`);
        }
        return config;
    }

    public addBotConfig(config: BotConfig): void {
        this.botConfigs.set(config.botId, config);
    }

    public getAllBotIds(): string[] {
        return Array.from(this.botConfigs.keys());
    }
}
