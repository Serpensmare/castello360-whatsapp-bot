export function createLogger(name: string) {
    return {
        info: (message: string, data?: any) => {
            console.log(`[${new Date().toISOString()}] [INFO] [${name}] ${message}`, data || '');
        },
        warn: (message: string, data?: any) => {
            console.warn(`[${new Date().toISOString()}] [WARN] [${name}] ${message}`, data || '');
        },
        error: (message: string, data?: any) => {
            console.error(`[${new Date().toISOString()}] [ERROR] [${name}] ${message}`, data || '');
        },
        debug: (message: string, data?: any) => {
            if (process.env.NODE_ENV === 'development') {
                console.log(`[${new Date().toISOString()}] [DEBUG] [${name}] ${message}`, data || '');
            }
        }
    };
}
