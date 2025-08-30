import axios from 'axios';
import { environment } from './config/environment';
import { TourLead } from './state';
import { PricingResult } from './pricing';

export interface LeadPayload {
    timestamp: string;
    userPhone: string;
    serviceType: string;
    answers: Record<string, any>;
    mediaUrls: string[];
    pricing?: PricingResult;
    confirmed: boolean;
    businessInfo: {
        name: string;
        phone: string;
        website: string;
    };
}

/**
 * Lead management system for Castello360
 * Sends lead data to Google Sheets webhook if configured
 */
export class LeadManager {
    private readonly googleSheetsUrl: string | null;

    constructor() {
        this.googleSheetsUrl = environment.GOOGLE_SHEETS_URL || null;
    }

    /**
     * Create lead payload from conversation state
     */
    createLeadPayload(lead: TourLead): LeadPayload {
        return {
            timestamp: new Date().toISOString(),
            userPhone: lead.userPhone,
            serviceType: lead.serviceType,
            answers: lead.answers,
            mediaUrls: lead.mediaUrls,
            pricing: lead.pricing,
            confirmed: lead.confirmed,
            businessInfo: {
                name: environment.BUSINESS_NAME,
                phone: environment.BUSINESS_PHONE,
                website: environment.BUSINESS_WEBSITE
            }
        };
    }

    /**
     * Send lead to Google Sheets webhook
     */
    async sendToGoogleSheets(lead: TourLead): Promise<boolean> {
        if (!this.googleSheetsUrl) {
            console.info('Google Sheets webhook not configured, skipping lead submission');
            return false;
        }

        try {
            const payload = this.createLeadPayload(lead);
            
            console.info('Sending lead to Google Sheets:', {
                userPhone: lead.userPhone,
                serviceType: lead.serviceType,
                confirmed: lead.confirmed
            });

            const response = await axios.post(this.googleSheetsUrl, payload, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // 10 second timeout
            });

            if (response.status === 200) {
                console.info('Lead successfully sent to Google Sheets');
                return true;
            } else {
                console.warn('Google Sheets webhook returned non-200 status:', response.status);
                return false;
            }
        } catch (error: any) {
            console.error('Error sending lead to Google Sheets:', {
                error: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
            return false;
        }
    }

    /**
     * Format lead data for display
     */
    formatLeadSummary(lead: TourLead): string {
        const { serviceType, answers, confirmed, lastUpdated } = lead;
        
        let summary = `📋 Resumen del Lead:\n\n`;
        summary += `• Tipo de servicio: ${serviceType}\n`;
        summary += `• Estado: ${confirmed ? '✅ Confirmado' : '⏳ Pendiente'}\n`;
        summary += `• Última actualización: ${lastUpdated.toLocaleString('es-CL')}\n\n`;
        
        summary += `📝 Respuestas:\n`;
        Object.entries(answers).forEach(([key, value]) => {
            if (value && value !== '') {
                const formattedKey = this.formatAnswerKey(key);
                summary += `• ${formattedKey}: ${value}\n`;
            }
        });
        
        if (lead.mediaUrls.length > 0) {
            summary += `\n📎 Archivos adjuntos: ${lead.mediaUrls.length}\n`;
            lead.mediaUrls.forEach((url, index) => {
                summary += `  ${index + 1}. ${url}\n`;
            });
        }
        
        if (lead.pricing) {
            summary += `\n💰 Cotización:\n`;
            summary += `• Rango estimado: $${lead.pricing.min.toLocaleString('es-CL')} - $${lead.pricing.max.toLocaleString('es-CL')} CLP\n`;
            summary += `• Hosting anual: $${lead.pricing.hostingAnual.toLocaleString('es-CL')} CLP\n`;
        }
        
        return summary;
    }

    /**
     * Format answer keys for better readability
     */
    private formatAnswerKey(key: string): string {
        const keyMap: Record<string, string> = {
            'comuna': 'Comuna/Ciudad',
            'direccion': 'Dirección',
            'fecha': 'Fecha tentativa',
            'link': 'Link del lugar',
            'nEspacios': 'Número de espacios',
            'edicion': 'Tipo de edición',
            'embed': 'Embed para web',
            'urgente': 'Urgencia',
            'presupuesto': 'Presupuesto referencial',
            'nombre': 'Nombre y cargo',
            'correo': 'Correo electrónico',
            'telefono': 'Teléfono',
            'factura': 'Tipo de documento',
            'razonSocial': 'Razón social',
            'rut': 'RUT',
            'aforo': 'Aforo aproximado',
            'horarioBaja': 'Horario de baja afluencia',
            'zonasRestringidas': 'Zonas con acceso restringido',
            'metros': 'Metros cuadrados',
            'montaje': 'Estado del montaje',
            'iluminacion': 'Iluminación especial',
            'linkAviso': 'Link del aviso',
            'piso': 'Piso y acceso',
            'tiposHabitacion': 'Tipos de habitación',
            'areasComunes': 'Áreas comunes',
            'ocupacion': 'Ocupación actual'
        };
        
        return keyMap[key] || key.charAt(0).toUpperCase() + key.slice(1);
    }

    /**
     * Export all leads to CSV format
     */
    exportToCSV(leads: TourLead[]): string {
        if (leads.length === 0) {
            return 'No hay leads para exportar';
        }
        
        const headers = [
            'Timestamp',
            'Teléfono',
            'Tipo de Servicio',
            'Comuna',
            'Dirección',
            'Fecha',
            'Espacios',
            'Edición',
            'Embed',
            'Urgente',
            'Presupuesto',
            'Nombre',
            'Correo',
            'Factura',
            'Razón Social',
            'RUT',
            'Confirmado',
            'Media URLs'
        ];
        
        const csvRows = [headers.join(',')];
        
        leads.forEach(lead => {
            const row = [
                lead.lastUpdated.toISOString(),
                lead.userPhone,
                lead.serviceType,
                lead.answers.comuna || '',
                lead.answers.direccion || '',
                lead.answers.fecha || '',
                lead.answers.nEspacios || '',
                lead.answers.edicion || '',
                lead.answers.embed || '',
                lead.answers.urgente || '',
                lead.answers.presupuesto || '',
                lead.answers.nombre || '',
                lead.answers.correo || '',
                lead.answers.factura || '',
                lead.answers.razonSocial || '',
                lead.answers.rut || '',
                lead.confirmed ? 'Sí' : 'No',
                lead.mediaUrls.join(';') || ''
            ];
            
            // Escape commas and quotes in CSV
            const escapedRow = row.map(cell => {
                if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
                    return `"${cell.replace(/"/g, '""')}"`;
                }
                return cell;
            });
            
            csvRows.push(escapedRow.join(','));
        });
        
        return csvRows.join('\n');
    }

    /**
     * Get lead statistics
     */
    getLeadStats(leads: TourLead[]): {
        total: number;
        confirmed: number;
        pending: number;
        byServiceType: Record<string, number>;
        byDate: Record<string, number>;
    } {
        const stats = {
            total: leads.length,
            confirmed: 0,
            pending: 0,
            byServiceType: {} as Record<string, number>,
            byDate: {} as Record<string, number>
        };
        
        leads.forEach(lead => {
            if (lead.confirmed) {
                stats.confirmed++;
            } else {
                stats.pending++;
            }
            
            // Count by service type
            stats.byServiceType[lead.serviceType] = (stats.byServiceType[lead.serviceType] || 0) + 1;
            
            // Count by date (YYYY-MM-DD)
            const dateKey = lead.lastUpdated.toISOString().split('T')[0];
            stats.byDate[dateKey] = (stats.byDate[dateKey] || 0) + 1;
        });
        
        return stats;
    }
}

// Export singleton instance
export const leadManager = new LeadManager();
