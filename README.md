# Castello360 WhatsApp Bot

A TypeScript-based WhatsApp Business API bot for Castello360, designed to handle automated messaging, lead management, and business logic for castle/real estate tours.

## 🚀 Features

- **WhatsApp Business API Integration** - Direct integration with Meta's WhatsApp Cloud API
- **TypeScript Architecture** - Full TypeScript support with type safety
- **Modular Service Design** - Clean separation of concerns with services for different functionalities
- **Queue System** - Asynchronous message processing with queue management
- **Lead Management** - Built-in lead tracking and management system
- **Vercel Ready** - Serverless deployment with Vercel
- **Business Logic** - Pricing calculations, NLP processing, and automated responses

## 🏗️ Architecture

```
src/
├── bot/           # Bot logic and decision making
├── config/        # Environment and WhatsApp configuration
├── core/          # Core services including queue management
├── services/      # Message and template services
├── models/        # Data models for messages and leads
├── interfaces/    # TypeScript interfaces
└── utils/         # Utility functions and logging
```

## 📋 Prerequisites

- Node.js >= 18
- WhatsApp Business API access
- Meta Developer Account
- Vercel account (for deployment)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <your-github-repo-url>
   cd whatsapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your actual values
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# WhatsApp Cloud API Configuration
WHATSAPP_TOKEN=your_whatsapp_token_here
PHONE_NUMBER_ID=your_phone_number_id_here
VERIFY_TOKEN=your_custom_verify_token
GRAPH_VERSION=v23.0
BOT_ENABLED=true

# Server Configuration
PORT=3000

# Business Info
BUSINESS_NAME=Castello360
BUSINESS_PHONE=+56971219394
BUSINESS_WEBSITE=https://castello360.com
```

### WhatsApp API Setup

1. Go to [Meta Developers](https://developers.facebook.com/)
2. Create a WhatsApp Business app
3. Get your access token and phone number ID
4. Set up webhook URL: `https://your-domain.vercel.app/api/whatsapp/webhook`

## 🚀 Deployment

### Vercel Deployment

1. **Connect to Vercel**
   ```bash
   npm i -g vercel
   vercel login
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Set environment variables in Vercel dashboard**

### Local Development

```bash
npm run dev
```

The bot will be available at `http://localhost:3000`

## 🔧 Development

### Available Scripts

- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run dev` - Start development server
- `npm run watch` - Watch mode for TypeScript compilation

### Project Structure

- **`api/whatsapp/webhook.ts`** - Vercel serverless function for WhatsApp webhooks
- **`src/send.ts`** - WhatsApp message sending utility
- **`src/bot/botLogic.ts`** - Main bot decision logic
- **`src/services/`** - Message processing services
- **`src/core/queue/`** - Queue management system

## 📱 WhatsApp Integration

### Webhook Endpoint

```
POST /api/whatsapp/webhook
```

### Message Flow

1. WhatsApp sends message to webhook
2. Webhook processes and acknowledges
3. Message is queued for processing
4. Bot logic processes the message
5. Response is sent back via WhatsApp API

### Supported Message Types

- Text messages
- Interactive messages
- Template messages
- Media messages (planned)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please contact:
- **Business**: Castello360
- **Website**: https://castello360.com
- **Phone**: +56971219394

## 🔄 Changelog

### v1.0.0
- Initial WhatsApp bot implementation
- Vercel serverless deployment support
- Basic message processing and response system
- Lead management and business logic integration
