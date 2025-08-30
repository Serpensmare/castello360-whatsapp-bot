import { BotMessageService } from '../src/services/botMessageService';

// Example: Simple customer service bot
export class SimpleCustomerServiceBot {
    private botService: BotMessageService;

    constructor() {
        this.botService = BotMessageService.getInstance('main_bot');
    }

    // Handle incoming messages
    async handleMessage(from: string, message: string): Promise<void> {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            await this.sendWelcomeMessage(from);
        } else if (lowerMessage.includes('order')) {
            await this.handleOrderInquiry(from);
        } else if (lowerMessage.includes('support')) {
            await this.handleSupportRequest(from);
        } else if (lowerMessage.includes('hours')) {
            await this.sendBusinessHours(from);
        } else {
            await this.sendDefaultResponse(from);
        }
    }

    private async sendWelcomeMessage(from: string): Promise<void> {
        await this.botService.sendButtonMessage(
            from,
            "👋 Welcome to our store! How can I help you today?",
            [
                { id: "order", title: "Order Status" },
                { id: "support", title: "Get Support" },
                { id: "hours", title: "Business Hours" }
            ],
            undefined,
            "Choose an option below:"
        );
    }

    private async handleOrderInquiry(from: string): Promise<void> {
        await this.botService.sendTextMessage(
            from,
            "📦 To check your order status, please provide your order number or email address. I'll look it up for you!"
        );
    }

    private async handleSupportRequest(from: string): Promise<void> {
        await this.botService.sendTextMessage(
            from,
            "🆘 Our support team is available 24/7! Please describe your issue and we'll get back to you within 2 hours."
        );
    }

    private async sendBusinessHours(from: string): Promise<void> {
        await this.botService.sendTextMessage(
            from,
            "🕒 Our business hours:\n\n" +
            "Monday - Friday: 9:00 AM - 6:00 PM\n" +
            "Saturday: 10:00 AM - 4:00 PM\n" +
            "Sunday: Closed\n\n" +
            "For urgent matters outside business hours, please call our 24/7 hotline: 1-800-SUPPORT"
        );
    }

    private async sendDefaultResponse(from: string): Promise<void> {
        await this.botService.sendTextMessage(
            from,
            "I'm not sure I understood that. Try saying 'hello' for a menu, or ask about orders, support, or business hours!"
        );
    }
}

// Example: E-commerce bot
export class EcommerceBot {
    private botService: BotMessageService;

    constructor() {
        this.botService = BotMessageService.getInstance('main_bot');
    }

    async handleMessage(from: string, message: string): Promise<void> {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('catalog') || lowerMessage.includes('products')) {
            await this.sendProductCatalog(from);
        } else if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
            await this.sendPricingInfo(from);
        } else if (lowerMessage.includes('shipping')) {
            await this.sendShippingInfo(from);
        } else if (lowerMessage.includes('return')) {
            await this.sendReturnPolicy(from);
        } else {
            await this.sendWelcomeMessage(from);
        }
    }

    private async sendWelcomeMessage(from: string): Promise<void> {
        await this.botService.sendButtonMessage(
            from,
            "🛍️ Welcome to our online store! What would you like to know?",
            [
                { id: "catalog", title: "View Products" },
                { id: "pricing", title: "Pricing" },
                { id: "shipping", title: "Shipping Info" }
            ]
        );
    }

    private async sendProductCatalog(from: string): Promise<void> {
        await this.botService.sendListMessage(
            from,
            "🛍️ Here are our featured products:",
            "Browse Products",
            [
                {
                    title: "Electronics",
                    rows: [
                        { id: "laptop", title: "Gaming Laptop", description: "$1,299" },
                        { id: "phone", title: "Smartphone", description: "$699" },
                        { id: "tablet", title: "Tablet", description: "$399" }
                    ]
                },
                {
                    title: "Accessories",
                    rows: [
                        { id: "headphones", title: "Wireless Headphones", description: "$199" },
                        { id: "charger", title: "Fast Charger", description: "$49" }
                    ]
                }
            ]
        );
    }

    private async sendPricingInfo(from: string): Promise<void> {
        await this.botService.sendTextMessage(
            from,
            "💰 Our pricing:\n\n" +
            "• Free shipping on orders over $50\n" +
            "• Student discount: 10% off with valid ID\n" +
            "• Bulk orders: Contact us for special pricing\n" +
            "• All prices include tax"
        );
    }

    private async sendShippingInfo(from: string): Promise<void> {
        await this.botService.sendTextMessage(
            from,
            "🚚 Shipping Information:\n\n" +
            "• Standard: 3-5 business days ($5.99)\n" +
            "• Express: 1-2 business days ($12.99)\n" +
            "• Overnight: Next business day ($24.99)\n" +
            "• Free shipping on orders over $50"
        );
    }

    private async sendReturnPolicy(from: string): Promise<void> {
        await this.botService.sendTextMessage(
            from,
            "↩️ Return Policy:\n\n" +
            "• 30-day return window\n" +
            "• Must be in original condition\n" +
            "• Return shipping paid by customer\n" +
            "• Refund processed within 5-7 business days"
        );
    }
}

// Example usage:
// const customerBot = new SimpleCustomerServiceBot();
// const ecommerceBot = new EcommerceBot();
// 
// // Handle incoming message
// await customerBot.handleMessage(phoneNumber, "hello");
// await ecommerceBot.handleMessage(phoneNumber, "show me products");
