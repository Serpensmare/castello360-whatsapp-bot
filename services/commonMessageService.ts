import { createLogger } from '../../../core/utils/logger';
import { MessageService } from './messageService';
import { MessageData } from '@/bots/fito/interfaces/exercise.interface';
import { AIAudioRequest } from '@/modules/ai/interfaces/aiServiceInterface';
import { AIOrchestrator } from '@/modules/ai/services/aiOrchestrator';
import { BotConfig } from '@/core/config/waConfig';


interface User {
    phone: string;
}
export class CommonMessageService {
    protected logger;
    protected config?: BotConfig;
    protected messageService: MessageService;
    protected aiOrchestrator: AIOrchestrator;
    private static instance: CommonMessageService;
    protected constructor(config?: BotConfig, customLogger = createLogger('WhatsAppCommonMessage')) {
        this.logger = customLogger;
        this.config = config;
        this.messageService = MessageService.getInstance();
        this.aiOrchestrator = new AIOrchestrator();
    }
    public static getInstance(): CommonMessageService {
        if (!CommonMessageService.instance) {
            CommonMessageService.instance = new CommonMessageService();
        }
        return CommonMessageService.instance;
    }
    
    public async processAudioMessage(user: User, message: MessageData): Promise<MessageData | null> {
        try {
            const audioPath = await this.messageService.downloadMedia(message.mediaId!, 'audio');
            
            const audioRequest: AIAudioRequest = {
                audioPath,
                language: 'es'
            };
            
            const audioResponse = await this.aiOrchestrator.audioToText(audioRequest);
            
            if (audioResponse.success && audioResponse.data) {
                return {
                    ...message,
                    type: 'text',
                    text: audioResponse.data
                };
            } else {
                this.logger.error('Error al convertir audio a texto', { error: audioResponse.error });
                await this.messageService.sendTextMessage(
                    user.phone,
                    "Lo siento, no pude entender el audio. ¿Podrías escribirlo?"
                );
                return null;
            }
        } catch (error) {
            this.logger.error('Error al procesar audio', { error });
            await this.messageService.sendTextMessage(
                user.phone,
                "Lo siento, hubo un problema al procesar el audio. ¿Podrías escribirlo?"
            );
            return null;
        }
    }

}