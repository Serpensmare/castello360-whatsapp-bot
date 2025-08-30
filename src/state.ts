export interface TourLead {
    userPhone: string;
    currentStep: string;
    serviceType: string;
    answers: Record<string, any>;
    lastUpdated: Date;
    mediaUrls: string[];
    pricing?: any;
    confirmed: boolean;
}

export interface ConversationState {
    currentStep: string;
    serviceType: string;
    answers: Record<string, any>;
    lastUpdated: Date;
    mediaUrls: string[];
}

// In-memory store (easy to switch to Redis later)
class StateStore {
    private store: Map<string, TourLead> = new Map();
    
    /**
     * Get or create conversation state for a user
     */
    getState(userPhone: string): ConversationState {
        const lead = this.store.get(userPhone);
        if (!lead) {
            return {
                currentStep: 'welcome',
                serviceType: '',
                answers: {},
                lastUpdated: new Date(),
                mediaUrls: []
            };
        }
        
        return {
            currentStep: lead.currentStep,
            serviceType: lead.serviceType,
            answers: lead.answers,
            lastUpdated: lead.lastUpdated,
            mediaUrls: lead.mediaUrls
        };
    }
    
    /**
     * Update conversation state
     */
    updateState(userPhone: string, updates: Partial<ConversationState>): void {
        const existing = this.store.get(userPhone);
        const now = new Date();
        
        if (existing) {
            this.store.set(userPhone, {
                ...existing,
                ...updates,
                lastUpdated: now
            });
        } else {
            this.store.set(userPhone, {
                userPhone,
                currentStep: updates.currentStep || 'welcome',
                serviceType: updates.serviceType || '',
                answers: updates.answers || {},
                lastUpdated: now,
                mediaUrls: updates.mediaUrls || [],
                confirmed: false
            });
        }
    }
    
    /**
     * Set specific answer
     */
    setAnswer(userPhone: string, key: string, value: any): void {
        const state = this.getState(userPhone);
        const answers = { ...state.answers, [key]: value };
        this.updateState(userPhone, { answers });
    }
    
    /**
     * Get specific answer
     */
    getAnswer(userPhone: string, key: string): any {
        const state = this.getState(userPhone);
        return state.answers[key];
    }
    
    /**
     * Set current step
     */
    setStep(userPhone: string, step: string): void {
        this.updateState(userPhone, { currentStep: step });
    }
    
    /**
     * Set service type
     */
    setServiceType(userPhone: string, serviceType: string): void {
        this.updateState(userPhone, { serviceType });
    }
    
    /**
     * Add media URL
     */
    addMediaUrl(userPhone: string, url: string): void {
        const state = this.getState(userPhone);
        const mediaUrls = [...state.mediaUrls, url];
        this.updateState(userPhone, { mediaUrls });
    }
    
    /**
     * Set pricing information
     */
    setPricing(userPhone: string, pricing: any): void {
        const existing = this.store.get(userPhone);
        if (existing) {
            existing.pricing = pricing;
            existing.lastUpdated = new Date();
        }
    }
    
    /**
     * Mark lead as confirmed
     */
    confirmLead(userPhone: string): void {
        const existing = this.store.get(userPhone);
        if (existing) {
            existing.confirmed = true;
            existing.lastUpdated = new Date();
        }
    }
    
    /**
     * Get complete lead information
     */
    getLead(userPhone: string): TourLead | undefined {
        return this.store.get(userPhone);
    }
    
    /**
     * Get all leads (for admin purposes)
     */
    getAllLeads(): TourLead[] {
        return Array.from(this.store.values());
    }
    
    /**
     * Reset conversation state
     */
    resetState(userPhone: string): void {
        this.store.delete(userPhone);
    }
    
    /**
     * Get conversation summary
     */
    getConversationSummary(userPhone: string): string {
        const lead = this.store.get(userPhone);
        if (!lead) return 'No hay conversación activa';
        
        const { serviceType, answers } = lead;
        let summary = `Resumen de conversación:\n`;
        summary += `• Tipo de servicio: ${serviceType}\n`;
        
        Object.entries(answers).forEach(([key, value]) => {
            if (value && value !== '') {
                summary += `• ${key}: ${value}\n`;
            }
        });
        
        return summary;
    }
    
    /**
     * Clean up old conversations (older than 24 hours)
     */
    cleanupOldConversations(): void {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        for (const [userPhone, lead] of this.store.entries()) {
            if (lead.lastUpdated < oneDayAgo) {
                this.store.delete(userPhone);
            }
        }
    }
}

// Export singleton instance
export const stateStore = new StateStore();

// Cleanup old conversations every hour
setInterval(() => {
    stateStore.cleanupOldConversations();
}, 60 * 60 * 1000);
