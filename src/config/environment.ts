import dotenv from 'dotenv';

dotenv.config();

export const environment = {
    // Meta WhatsApp Business API Configuration
    META_WABA_TOKEN: process.env.META_WABA_TOKEN || '',
    WABA_PHONE_NUMBER_ID: process.env.WABA_PHONE_NUMBER_ID || '',
    WABA_VERIFY_TOKEN: process.env.WABA_VERIFY_TOKEN || '',
    
    // Server Configuration
    BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
    PORT: parseInt(process.env.PORT || '3000'),
    
    // Google Sheets Integration (Optional)
    GOOGLE_SHEETS_URL: process.env.GOOGLE_SHEETS_URL || '',
    
    // Castello360 Business Info
    BUSINESS_NAME: process.env.BUSINESS_NAME || 'Castello360',
    BUSINESS_PHONE: process.env.BUSINESS_PHONE || '+56971219394',
    BUSINESS_WEBSITE: process.env.BUSINESS_WEBSITE || 'https://castello360.com',
    
    // Environment
    IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
    NODE_ENV: process.env.NODE_ENV || 'development'
};

// Validate required environment variables
export function validateEnvironment(): void {
    const required = [
        'META_WABA_TOKEN',
        'WABA_PHONE_NUMBER_ID',
        'WABA_VERIFY_TOKEN'
    ];
    
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}
