// Castello360 Pricing Configuration
export const PRICING = {
    visitaBase: 40000,            // visita y logística
    porEspacio: 15000,            // por habitación/área
    edicionAvanzadaPct: 0.25,     // +25%
    embedFijo: 20000,             // setup de enlace/embed listo
    urgentePct: 0.20,             // +20%
    desplazamiento: {             // recargo según zona
        base: 0,
        zonas: [
            { match: /Las Condes|Providencia|Ñuñoa|Santiago/i, pct: 0.00 },
            { match: /Maipú|La Florida|Puente Alto|Huechuraba|Quilicura/i, pct: 0.05 },
            { match: /Colina|Lampa|Padre Hurtado|Talagante|Peñaflor/i, pct: 0.08 },
            { match: /Valparaíso|Viña del Mar|Rancagua|Quillota/i, pct: 0.12 }
        ]
    },
    hostingAnual: 250000          // oferta opcional de hosting/soporte anual
};

export interface PricingInput {
    tipo: string;
    nEspacios: number;
    edicion: 'Básica' | 'Avanzada';
    embed: boolean;
    urgente: boolean;
    comuna: string;
}

export interface PricingResult {
    subtotal: number;
    visitaBase: number;
    porEspacioTotal: number;
    edicionLine: string;
    embedLine: string;
    urgenteLine: string;
    desplazamientoLine: string;
    desplazamientoPct: number;
    min: number;
    max: number;
    hostingAnual: number;
}

/**
 * Calculate tour pricing based on Castello360 pricing structure
 */
export function calculatePricing(input: PricingInput): PricingResult {
    const { tipo, nEspacios, edicion, embed, urgente, comuna } = input;
    
    // Base calculation
    let subtotal = PRICING.visitaBase + (PRICING.porEspacio * nEspacios);
    
    // Apply advanced editing markup
    const edicionMarkup = edicion === 'Avanzada' ? PRICING.edicionAvanzadaPct : 0;
    if (edicionMarkup > 0) {
        subtotal *= (1 + edicionMarkup);
    }
    
    // Apply embed markup
    const embedMarkup = embed ? PRICING.embedFijo : 0;
    if (embedMarkup > 0) {
        subtotal += embedMarkup;
    }
    
    // Apply urgent markup
    const urgenteMarkup = urgente ? PRICING.urgentePct : 0;
    if (urgenteMarkup > 0) {
        subtotal *= (1 + urgenteMarkup);
    }
    
    // Calculate displacement markup based on comuna
    const desplazamientoPct = calculateDisplacementMarkup(comuna);
    const desplazamientoMarkup = subtotal * desplazamientoPct;
    subtotal += desplazamientoMarkup;
    
    // Calculate delivery range (95% to 115% of subtotal)
    const min = Math.round((subtotal * 0.95) / 1000) * 1000;
    const max = Math.round((subtotal * 1.15) / 1000) * 1000;
    
    // Format lines for display
    const edicionLine = edicion === 'Avanzada' 
        ? `• Edición avanzada: +${Math.round(edicionMarkup * 100)}%`
        : '';
    
    const embedLine = embed 
        ? `• Embed web: $${embedMarkup.toLocaleString('es-CL')}`
        : '';
    
    const urgenteLine = urgente 
        ? `• Urgente: +${Math.round(urgenteMarkup * 100)}%`
        : '';
    
    const desplazamientoLine = desplazamientoPct > 0 
        ? `• Desplazamiento (${comuna}): +${Math.round(desplazamientoPct * 100)}%`
        : '';
    
    return {
        subtotal,
        visitaBase: PRICING.visitaBase,
        porEspacioTotal: PRICING.porEspacio * nEspacios,
        edicionLine,
        embedLine,
        urgenteLine,
        desplazamientoLine,
        desplazamientoPct,
        min,
        max,
        hostingAnual: PRICING.hostingAnual
    };
}

/**
 * Calculate displacement markup based on comuna
 */
function calculateDisplacementMarkup(comuna: string): number {
    for (const zona of PRICING.desplazamiento.zonas) {
        if (zona.match.test(comuna)) {
            return zona.pct;
        }
    }
    return 0; // No markup for unknown zonas
}

/**
 * Format price in Chilean Pesos
 */
export function formatCLP(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Format price range
 */
export function formatPriceRange(min: number, max: number): string {
    return `entre ${formatCLP(min)} y ${formatCLP(max)}`;
}

/**
 * Generate pricing summary text for customer
 */
export function generatePricingSummary(input: PricingInput, result: PricingResult): string {
    const { tipo, nEspacios, edicion, embed, urgente } = input;
    
    let summary = `Estimación Castello360:\n`;
    summary += `• Visita y logística: ${formatCLP(result.visitaBase)}\n`;
    summary += `• ${nEspacios} espacios: ${formatCLP(result.porEspacioTotal)}\n`;
    
    if (result.edicionLine) {
        summary += `${result.edicionLine}\n`;
    }
    
    if (result.embedLine) {
        summary += `${result.embedLine}\n`;
    }
    
    if (result.urgenteLine) {
        summary += `${result.urgenteLine}\n`;
    }
    
    if (result.desplazamientoLine) {
        summary += `${result.desplazamientoLine}\n`;
    }
    
    summary += `---------------------------\n`;
    summary += `Total estimado: ${formatPriceRange(result.min, result.max)} CLP\n`;
    summary += `Opcional: Hosting + soporte anual (link/embebido listo): ${formatCLP(result.hostingAnual)} CLP\n`;
    summary += `¿Agendamos? Puedo ofrecerte 2 fechas próximas.`;
    
    return summary;
}
