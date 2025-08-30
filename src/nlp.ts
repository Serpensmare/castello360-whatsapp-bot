/**
 * Natural Language Processing for Castello360 WhatsApp bot
 * Classifies user input into service types using keyword matching
 */

export type ServiceType = 'Restaurante' | 'Venue / Eventos' | 'Airbnb / Arriendo' | 'Hotel' | 'Otro';

export interface ServiceClassification {
    type: ServiceType;
    confidence: number;
    keywords: string[];
}

// Keywords for each service type
const SERVICE_KEYWORDS: Record<ServiceType, string[]> = {
    'Restaurante': [
        'restaurante', 'restaurant', 'comida', 'food', 'cena', 'dinner', 'almuerzo', 'lunch',
        'bar', 'pub', 'café', 'cafe', 'pizzeria', 'pizzería', 'sushi', 'peruano', 'chino',
        'italiano', 'mexicano', 'gastronomía', 'gastronomia', 'chef', 'cocina', 'kitchen',
        'comedor', 'dining', 'terraza', 'patio', 'salón', 'salon', 'mesas', 'tables',
        'aforo', 'capacidad', 'clientes', 'customers', 'horario', 'schedule'
    ],
    
    'Venue / Eventos': [
        'venue', 'evento', 'event', 'fiesta', 'party', 'boda', 'wedding', 'cumpleaños',
        'birthday', 'corporativo', 'corporate', 'conferencia', 'conference', 'seminario',
        'seminar', 'exposición', 'exposicion', 'exhibition', 'galería', 'galeria', 'gallery',
        'auditorio', 'auditorium', 'salón', 'salon', 'hall', 'espacio', 'space', 'área',
        'area', 'montaje', 'setup', 'iluminación', 'iluminacion', 'lighting', 'sonido',
        'audio', 'escenario', 'stage', 'pista', 'dance floor', 'decoración', 'decoracion'
    ],
    
    'Airbnb / Arriendo': [
        'airbnb', 'arriendo', 'rental', 'renta', 'departamento', 'apartment', 'casa',
        'house', 'habitación', 'habitacion', 'room', 'bedroom', 'living', 'cocina',
        'kitchen', 'baño', 'bano', 'bathroom', 'terraza', 'terrace', 'balcón', 'balcon',
        'balcony', 'piso', 'floor', 'edificio', 'building', 'conserje', 'porter',
        'clave', 'key', 'check-in', 'checkin', 'anfitrión', 'anfitrion', 'host',
        'huesped', 'huespedes', 'guest', 'guests', 'alojamiento', 'accommodation'
    ],
    
    'Hotel': [
        'hotel', 'hospedaje', 'lodging', 'habitación', 'habitacion', 'room', 'suite',
        'lobby', 'recepción', 'recepcion', 'reception', 'gimnasio', 'gym', 'spa',
        'piscina', 'pool', 'restaurante', 'restaurant', 'bar', 'concierge', 'valet',
        'parking', 'estacionamiento', 'wifi', 'internet', 'tv', 'television', 'aire',
        'ac', 'climatización', 'climatizacion', 'servicio', 'service', 'limpieza',
        'cleaning', 'room service', 'desayuno', 'breakfast', 'ocupación', 'ocupacion'
    ],
    
    'Otro': [
        'otro', 'other', 'diferente', 'different', 'especial', 'special', 'único',
        'unico', 'unique', 'personalizado', 'personalized', 'custom', 'específico',
        'especifico', 'particular', 'particular', 'especializado', 'especializado',
        'especialista', 'especialista', 'experto', 'expert', 'profesional', 'professional'
    ]
};

/**
 * Classify user input into service type using keyword matching
 */
export function classifyServiceType(input: string): ServiceClassification {
    const lowerInput = input.toLowerCase();
    const scores: Record<ServiceType, number> = {
        'Restaurante': 0,
        'Venue / Eventos': 0,
        'Airbnb / Arriendo': 0,
        'Hotel': 0,
        'Otro': 0
    };
    
    const matchedKeywords: Record<ServiceType, string[]> = {
        'Restaurante': [],
        'Venue / Eventos': [],
        'Airbnb / Arriendo': [],
        'Hotel': [],
        'Otro': []
    };
    
    // Score each service type based on keyword matches
    Object.entries(SERVICE_KEYWORDS).forEach(([serviceType, keywords]) => {
        keywords.forEach(keyword => {
            if (lowerInput.includes(keyword)) {
                scores[serviceType as ServiceType] += 1;
                matchedKeywords[serviceType as ServiceType].push(keyword);
            }
        });
    });
    
    // Find the service type with highest score
    let bestType: ServiceType = 'Otro';
    let bestScore = 0;
    
    Object.entries(scores).forEach(([serviceType, score]) => {
        if (score > bestScore) {
            bestScore = score;
            bestType = serviceType as ServiceType;
        }
    });
    
    // Calculate confidence (0-1)
    const totalPossibleKeywords = SERVICE_KEYWORDS[bestType].length;
    const confidence = totalPossibleKeywords > 0 ? bestScore / totalPossibleKeywords : 0;
    
    return {
        type: bestType,
        confidence: Math.min(confidence, 1), // Cap at 1.0
        keywords: matchedKeywords[bestType]
    };
}

/**
 * Extract additional context from user input
 */
export function extractContext(input: string): {
    urgency: boolean;
    budget: string | null;
    location: string | null;
    timeframe: string | null;
} {
    const lowerInput = input.toLowerCase();
    
    // Check for urgency indicators
    const urgencyKeywords = ['urgente', 'urgent', 'rápido', 'rapido', 'fast', 'inmediato', 'immediate', 'hoy', 'mañana', 'mañana'];
    const urgency = urgencyKeywords.some(keyword => lowerInput.includes(keyword));
    
    // Extract budget information
    const budgetRegex = /(?:presupuesto|budget|precio|price|valor|value|cost|precio|precio)\s*(?:de\s*)?(?:aproximadamente\s*)?(?:alrededor\s*de\s*)?(\d+(?:\.\d+)?(?:\s*(?:mil|k|millones|m))?)/i;
    const budgetMatch = input.match(budgetRegex);
    const budget = budgetMatch ? budgetMatch[1] : null;
    
    // Extract location information
    const locationRegex = /(?:en|ubicado\s*en|situado\s*en|localizado\s*en)\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-]+?)(?:\s|,|\.|$)/i;
    const locationMatch = input.match(locationRegex);
    const location = locationMatch ? locationMatch[1].trim() : null;
    
    // Extract timeframe information
    const timeframeKeywords = ['esta semana', 'próxima semana', 'proxima semana', 'este mes', 'próximo mes', 'proximo mes', 'pronto', 'rápido', 'rapido'];
    let timeframe: string | null = null;
    
    for (const keyword of timeframeKeywords) {
        if (lowerInput.includes(keyword)) {
            timeframe = keyword;
            break;
        }
    }
    
    return {
        urgency,
        budget,
        location,
        timeframe
    };
}

/**
 * Generate follow-up questions based on service type and context
 */
export function generateFollowUpQuestions(
    serviceType: ServiceType,
    context: ReturnType<typeof extractContext>
): string[] {
    const questions: string[] = [];
    
    // Common questions for all service types
    questions.push('¿En qué comuna o ciudad se encuentra?');
    questions.push('¿Cuántos espacios o ambientes necesitas que fotografiemos?');
    
    // Service-specific questions
    switch (serviceType) {
        case 'Restaurante':
            questions.push('¿Cuál es el aforo aproximado?');
            questions.push('¿Hay horarios de baja afluencia para grabar?');
            questions.push('¿Hay zonas con acceso restringido?');
            break;
            
        case 'Venue / Eventos':
            questions.push('¿Cuántos metros cuadrados aproximadamente?');
            questions.push('¿Está montado o vacío el espacio?');
            questions.push('¿Necesitas iluminación especial?');
            break;
            
        case 'Airbnb / Arriendo':
            questions.push('¿Tienes el link del aviso?');
            questions.push('¿Cuántos metros cuadrados aproximadamente?');
            questions.push('¿En qué piso está y cómo es el acceso?');
            break;
            
        case 'Hotel':
            questions.push('¿Cuántos tipos de habitación necesitas cubrir?');
            questions.push('¿Qué áreas comunes incluye (lobby, gym, spa)?');
            questions.push('¿Cuál es la ocupación actual?');
            break;
            
        case 'Otro':
            questions.push('¿Puedes describir más específicamente qué necesitas?');
            questions.push('¿Es un espacio comercial, residencial o mixto?');
            break;
    }
    
    // Add urgency-related questions
    if (context.urgency) {
        questions.push('¿Para cuándo necesitas el tour 360?');
    }
    
    // Add budget-related questions
    if (context.budget) {
        questions.push(`¿Tu presupuesto de ${context.budget} incluye edición avanzada y hosting?`);
    }
    
    return questions;
}

/**
 * Check if input contains navigation commands
 */
export function isNavigationCommand(input: string): boolean {
    const lowerInput = input.toLowerCase();
    const navigationCommands = [
        'menú', 'menu', 'inicio', 'start', 'comenzar', 'begin',
        'atrás', 'atras', 'back', 'anterior', 'previous',
        'reiniciar', 'reset', 'nuevo', 'new', 'otra vez', 'again',
        'humano', 'human', 'persona', 'person', 'representante', 'representative'
    ];
    
    return navigationCommands.some(command => lowerInput.includes(command));
}

/**
 * Get navigation command type
 */
export function getNavigationCommand(input: string): 'menu' | 'back' | 'reset' | 'human' | null {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('menú') || lowerInput.includes('menu') || lowerInput.includes('inicio')) {
        return 'menu';
    }
    
    if (lowerInput.includes('atrás') || lowerInput.includes('atras') || lowerInput.includes('anterior')) {
        return 'back';
    }
    
    if (lowerInput.includes('reiniciar') || lowerInput.includes('reset') || lowerInput.includes('nuevo')) {
        return 'reset';
    }
    
    if (lowerInput.includes('humano') || lowerInput.includes('persona') || lowerInput.includes('representante')) {
        return 'human';
    }
    
    return null;
}
