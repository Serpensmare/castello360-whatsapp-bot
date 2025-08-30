/**
 * Validation utilities for Castello360 WhatsApp bot
 */

/**
 * Parse and validate date input
 * Accepts: "hoy", "mañana", "esta semana", "próxima semana", "DD/MM", "DD-MM"
 */
export function parseDate(input: string): { isValid: boolean; date?: Date; text?: string } {
    const lowerInput = input.toLowerCase().trim();
    
    // Handle relative dates
    if (lowerInput === 'hoy') {
        const today = new Date();
        return { isValid: true, date: today, text: 'hoy' };
    }
    
    if (lowerInput === 'mañana') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return { isValid: true, date: tomorrow, text: 'mañana' };
    }
    
    if (lowerInput === 'esta semana') {
        const thisWeek = new Date();
        thisWeek.setDate(thisWeek.getDate() + 3); // Mid-week
        return { isValid: true, date: thisWeek, text: 'esta semana' };
    }
    
    if (lowerInput === 'próxima semana') {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 10); // Next week
        return { isValid: true, date: nextWeek, text: 'próxima semana' };
    }
    
    // Handle DD/MM or DD-MM format
    const dateRegex = /^(\d{1,2})[\/\-](\d{1,2})$/;
    const match = input.match(dateRegex);
    
    if (match) {
        const day = parseInt(match[1]);
        const month = parseInt(match[2]) - 1; // Month is 0-indexed
        
        if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
            const date = new Date();
            date.setMonth(month);
            date.setDate(day);
            
            // If the date has passed this year, set it to next year
            if (date < new Date()) {
                date.setFullYear(date.getFullYear() + 1);
            }
            
            return { isValid: true, date, text: `${day}/${month + 1}` };
        }
    }
    
    return { isValid: false };
}

/**
 * Parse and validate number input
 * Accepts: "dos", "3", "3-4", "tres", etc.
 */
export function parseNumber(input: string): { isValid: boolean; value?: number; range?: { min: number; max: number } } {
    const cleanInput = input.trim();
    
    // Handle written numbers (basic Spanish)
    const writtenNumbers: Record<string, number> = {
        'uno': 1, 'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
        'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10
    };
    
    if (writtenNumbers[cleanInput.toLowerCase()]) {
        return { isValid: true, value: writtenNumbers[cleanInput.toLowerCase()] };
    }
    
    // Handle single number
    const singleNumber = parseInt(cleanInput);
    if (!isNaN(singleNumber) && singleNumber > 0) {
        return { isValid: true, value: singleNumber };
    }
    
    // Handle range (e.g., "3-4", "5-10")
    const rangeRegex = /^(\d+)\s*-\s*(\d+)$/;
    const rangeMatch = cleanInput.match(rangeRegex);
    
    if (rangeMatch) {
        const min = parseInt(rangeMatch[1]);
        const max = parseInt(rangeMatch[2]);
        
        if (!isNaN(min) && !isNaN(max) && min > 0 && max >= min) {
            return { isValid: true, range: { min, max } };
        }
    }
    
    return { isValid: false };
}

/**
 * Validate and extract URL from text
 * Detects web, Google Maps, Airbnb, Instagram URLs
 */
export function extractURL(text: string): { isValid: boolean; url?: string; type?: string } {
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const match = text.match(urlRegex);
    
    if (match && match[0]) {
        const url = match[0];
        
        // Determine URL type
        let type = 'web';
        if (url.includes('google.com/maps') || url.includes('maps.google.com')) {
            type = 'google_maps';
        } else if (url.includes('airbnb.com') || url.includes('airbnb.cl')) {
            type = 'airbnb';
        } else if (url.includes('instagram.com')) {
            type = 'instagram';
        }
        
        return { isValid: true, url, type };
    }
    
    return { isValid: false };
}

/**
 * Validate comuna input (Chilean administrative division)
 */
export function validateComuna(input: string): { isValid: boolean; comuna?: string } {
    const cleanInput = input.trim();
    
    if (cleanInput.length < 2) {
        return { isValid: false };
    }
    
    // Basic validation - comuna should be at least 2 characters
    // and not contain special characters (except spaces and hyphens)
    const comunaRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-]+$/;
    
    if (comunaRegex.test(cleanInput)) {
        return { isValid: true, comuna: cleanInput };
    }
    
    return { isValid: false };
}

/**
 * Validate phone number format
 */
export function validatePhone(phone: string): { isValid: boolean; formatted?: string } {
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Chilean phone format: +56 9 XXXX XXXX
    if (cleanPhone.startsWith('569') && cleanPhone.length === 11) {
        const formatted = `+${cleanPhone}`;
        return { isValid: true, formatted };
    }
    
    // Chilean phone format: +56 9 XXXX XXXX (with spaces)
    if (cleanPhone.startsWith('569') && cleanPhone.length === 11) {
        const formatted = `+${cleanPhone.substring(0, 3)} ${cleanPhone.substring(3, 7)} ${cleanPhone.substring(7)}`;
        return { isValid: true, formatted };
    }
    
    return { isValid: false };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): { isValid: boolean } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return { isValid: emailRegex.test(email.trim()) };
}

/**
 * Sanitize text input (remove special characters, limit length)
 */
export function sanitizeText(input: string, maxLength: number = 500): string {
    let sanitized = input.trim();
    
    // Remove potentially dangerous characters
    sanitized = sanitized.replace(/[<>]/g, '');
    
    // Limit length
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength) + '...';
    }
    
    return sanitized;
}

/**
 * Validate RUT format (Chilean national ID)
 */
export function validateRUT(rut: string): { isValid: boolean; formatted?: string } {
    // Remove dots and dashes
    const cleanRut = rut.replace(/[.-]/g, '');
    
    // RUT format: 12345678-9 (8 digits + 1 check digit)
    if (cleanRut.length !== 9) {
        return { isValid: false };
    }
    
    // Check if all characters except the last are digits
    const digits = cleanRut.substring(0, 8);
    const checkDigit = cleanRut.substring(8);
    
    if (!/^\d{8}$/.test(digits)) {
        return { isValid: false };
    }
    
    // Validate check digit
    let sum = 0;
    let multiplier = 2;
    
    for (let i = digits.length - 1; i >= 0; i--) {
        sum += parseInt(digits[i]) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    
    const expectedCheckDigit = 11 - (sum % 11);
    let checkDigitValue: string;
    
    if (expectedCheckDigit === 11) {
        checkDigitValue = '0';
    } else if (expectedCheckDigit === 10) {
        checkDigitValue = 'K';
    } else {
        checkDigitValue = expectedCheckDigit.toString();
    }
    
    if (checkDigit.toUpperCase() === checkDigitValue) {
        const formatted = `${digits}-${checkDigit}`;
        return { isValid: true, formatted };
    }
    
    return { isValid: false };
}
