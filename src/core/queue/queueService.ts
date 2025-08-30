export class QueueService {
    private static messageQueue: Array<{
        botId: string;
        to: string;
        message: string;
        timestamp: number;
    }> = [];

    public static async enqueueSendMessage(botId: string, to: string, message: string): Promise<void> {
        this.messageQueue.push({
            botId,
            to,
            message,
            timestamp: Date.now()
        });
        
        // For now, just log the queued message
        console.log(`[QUEUE] Message queued for bot ${botId} to ${to}`);
        
        // In a real implementation, you'd process this queue
        // For now, we'll just send it directly
        return Promise.resolve();
    }

    public static async enqueueSendTemplate(botId: string, to: string, message: string): Promise<void> {
        this.messageQueue.push({
            botId,
            to,
            message,
            timestamp: Date.now()
        });
        
        console.log(`[QUEUE] Template message queued for bot ${botId} to ${to}`);
        return Promise.resolve();
    }

    public static getQueueLength(): number {
        return this.messageQueue.length;
    }

    public static clearQueue(): void {
        this.messageQueue = [];
    }
}
