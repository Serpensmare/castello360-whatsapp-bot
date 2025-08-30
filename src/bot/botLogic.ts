import { whatsappAPI } from '../wa';
import { stateStore } from '../state';
import { classifyServiceType, extractContext, isNavigationCommand, getNavigationCommand } from '../nlp';
import { parseDate, parseNumber, extractURL, validateComuna, validateEmail, validateRUT } from '../validators';
import { calculatePricing, generatePricingSummary, PricingInput } from '../pricing';
import { leadManager } from '../lead';
import { environment } from '../config/environment';

export interface WAWebhookPayload {
    object: string;
    entry: Array<{
        id: string;
        changes: Array<{
            value: {
                messaging_product: string;
                metadata: {
                    display_phone_number: string;
                    phone_number_id: string;
                };
                contacts?: Array<{
                    profile: {
                        name: string;
                    };
                    wa_id: string;
                }>;
                messages?: Array<{
                    from: string;
                    id: string;
                    timestamp: string;
                    type: string;
                    text?: {
                        body: string;
                    };
                    image?: {
                        id: string;
                        caption?: string;
                    };
                    interactive?: {
                        type: 'button_reply' | 'list_reply';
                        button_reply?: {
                            id: string;
                            title: string;
                        };
                        list_reply?: {
                            id: string;
                            title: string;
                            description?: string;
                        };
                    };
                }>;
            };
            field: string;
        }>;
    }>;
}

export class BotLogic {
    /**
     * Main method to handle incoming webhook data
     */
    public async handleWebhook(webhookData: WAWebhookPayload): Promise<void> {
        try {
            for (const entry of webhookData.entry) {
                for (const change of entry.changes) {
                    if (change.field === 'messages') {
                        await this.processMessages(change.value.messages || []);
                    }
                }
            }
        } catch (error) {
            console.error('Error handling webhook:', error);
        }
    }

    /**
     * Process incoming messages
     */
    private async processMessages(messages: any[]): Promise<void> {
        for (const message of messages) {
            try {
                await this.processSingleMessage(message);
            } catch (error) {
                console.error('Error processing message:', error);
            }
        }
    }

    /**
     * Process a single incoming message
     */
    private async processSingleMessage(message: any): Promise<void> {
        const { from, id, type, text, image, interactive } = message;
        
        console.info(`Processing message from ${from}, type: ${type}`);

        // Send read receipt
        try {
            await whatsappAPI.sendReadReceipt(id);
        } catch (error) {
            console.warn('Could not send read receipt:', error);
        }

        // Handle different message types
        switch (type) {
            case 'text':
                await this.handleTextMessage(from, text?.body || '');
                break;
            case 'interactive':
                await this.handleInteractiveMessage(from, interactive);
                break;
            case 'image':
                await this.handleImageMessage(from, image);
                break;
            default:
                await this.handleUnknownMessage(from, type);
        }
    }

    /**
     * Handle text messages
     */
    private async handleTextMessage(from: string, text: string): Promise<void> {
        const state = stateStore.getState(from);
        
        // Check for navigation commands
        if (isNavigationCommand(text)) {
            const command = getNavigationCommand(text);
            await this.handleNavigationCommand(from, command);
            return;
        }

        // Process based on current step
        switch (state.currentStep) {
            case 'welcome':
                await this.handleWelcomeStep(from, text);
                break;
            case 'collecting_info':
                await this.handleInfoCollectionStep(from, text);
                break;
            case 'confirming_data':
                await this.handleDataConfirmationStep(from, text);
                break;
            case 'showing_pricing':
                await this.handlePricingStep(from, text);
                break;
            case 'collecting_contact':
                await this.handleContactCollectionStep(from, text);
                break;
            case 'scheduling':
                await this.handleSchedulingStep(from, text);
                break;
            default:
                await this.handleWelcomeStep(from, text);
        }
    }

    /**
     * Handle interactive messages (button clicks, list selections)
     */
    private async handleInteractiveMessage(from: string, interactive: any): Promise<void> {
        if (interactive.type === 'button_reply') {
            const buttonId = interactive.button_reply.id;
            await this.handleButtonClick(from, buttonId);
        } else if (interactive.type === 'list_reply') {
            const listId = interactive.list_reply.id;
            await this.handleListSelection(from, listId);
        }
    }

    /**
     * Handle button clicks
     */
    private async handleButtonClick(from: string, buttonId: string): Promise<void> {
        const state = stateStore.getState(from);
        
        switch (buttonId) {
            case 'restaurante':
            case 'venue_eventos':
            case 'airbnb_arriendo':
            case 'hotel':
            case 'otro':
                await this.handleServiceTypeSelection(from, buttonId);
                break;
            case 'agendar':
                await this.handleAgendarSelection(from);
                break;
            case 'editar_datos':
                await this.handleEditarDatosSelection(from);
                break;
            case 'hablar_humano':
                await this.handleHablarHumanoSelection(from);
                break;
            default:
                await this.handleUnknownButton(from, buttonId);
        }
    }

    /**
     * Handle list selections
     */
    private async handleListSelection(from: string, listId: string): Promise<void> {
        const state = stateStore.getState(from);
        
        // Handle specific list selections based on current step
        if (state.currentStep === 'collecting_info') {
            if (listId.startsWith('espacios_')) {
                const nEspacios = parseInt(listId.replace('espacios_', ''));
                stateStore.setAnswer(from, 'nEspacios', nEspacios);
                await this.continueInfoCollection(from);
            }
        }
    }

    /**
     * Handle image messages
     */
    private async handleImageMessage(from: string, image: any): Promise<void> {
        try {
            // Download and store media
            const mediaInfo = await whatsappAPI.downloadMedia(image.id);
            stateStore.addMediaUrl(from, mediaInfo.url);
            
            await whatsappAPI.sendTextMessage(
                from,
                '📸 ¡Perfecto! He recibido tu imagen. ' +
                'Puedo ver el espacio que quieres que fotografiemos. ' +
                'Continuemos con la cotización...'
            );
            
            // Continue with the current step
            const state = stateStore.getState(from);
            if (state.currentStep === 'collecting_info') {
                await this.continueInfoCollection(from);
            }
        } catch (error) {
            console.error('Error handling image message:', error);
            await whatsappAPI.sendTextMessage(
                from,
                '❌ Hubo un problema al procesar tu imagen. ' +
                'Por favor, continúa con la cotización o envía la imagen nuevamente.'
            );
        }
    }

    /**
     * Handle unknown message types
     */
    private async handleUnknownMessage(from: string, type: string): Promise<void> {
        await whatsappAPI.sendTextMessage(
            from,
            `Recibí un mensaje de tipo "${type}" que no puedo procesar aún. ` +
            'Por favor, envía un mensaje de texto o usa los botones disponibles.'
        );
    }

    /**
     * Handle welcome step
     */
    private async handleWelcomeStep(from: string, text: string): Promise<void> {
        // Try to classify service type from text
        const classification = classifyServiceType(text);
        const context = extractContext(text);
        
        if (classification.confidence > 0.3) {
            // Auto-detect service type
            await this.handleServiceTypeSelection(from, this.mapServiceTypeToButtonId(classification.type));
        } else {
            // Show welcome message with buttons
            await this.showWelcomeMessage(from);
        }
    }

    /**
     * Handle info collection step
     */
    private async handleInfoCollectionStep(from: string, text: string): Promise<void> {
        const state = stateStore.getState(from);
        const answers = state.answers;
        
        // Determine which field we're collecting based on current state
        if (!answers.comuna) {
            // Collecting comuna
            if (validateComuna(text).isValid) {
                stateStore.setAnswer(from, 'comuna', text);
                await this.askNextQuestion(from);
            } else {
                await whatsappAPI.sendTextMessage(
                    from,
                    'Por favor, ingresa una comuna o ciudad válida.'
                );
            }
        } else if (!answers.direccion) {
            // Collecting direccion (optional)
            stateStore.setAnswer(from, 'direccion', text);
            await this.askNextQuestion(from);
        } else if (!answers.fecha) {
            // Collecting fecha
            const parsedDate = parseDate(text);
            if (parsedDate.isValid) {
                stateStore.setAnswer(from, 'fecha', parsedDate.text);
                await this.askNextQuestion(from);
            } else {
                await whatsappAPI.sendTextMessage(
                    from,
                    'Por favor, ingresa una fecha válida. Puedes usar: "hoy", "mañana", "esta semana", "próxima semana" o DD/MM'
                );
            }
        } else if (!answers.link) {
            // Collecting link
            const urlInfo = extractURL(text);
            if (urlInfo.isValid || text.toLowerCase().includes('no') || text.toLowerCase().includes('ninguno')) {
                stateStore.setAnswer(from, 'link', urlInfo.url || 'No especificado');
                await this.askNextQuestion(from);
            } else {
                await whatsappAPI.sendTextMessage(
                    from,
                    'Por favor, ingresa un link válido o escribe "no" si no tienes uno.'
                );
            }
        } else if (!answers.nEspacios) {
            // Collecting nEspacios
            const numberInfo = parseNumber(text);
            if (numberInfo.isValid) {
                const nEspacios = numberInfo.value || (numberInfo.range ? numberInfo.range.min : 1);
                stateStore.setAnswer(from, 'nEspacios', nEspacios);
                await this.askNextQuestion(from);
            } else {
                await whatsappAPI.sendTextMessage(
                    from,
                    'Por favor, ingresa un número válido de espacios.'
                );
            }
        } else if (!answers.edicion) {
            // Collecting edicion
            if (text.toLowerCase().includes('básica') || text.toLowerCase().includes('basica')) {
                stateStore.setAnswer(from, 'edicion', 'Básica');
                await this.askNextQuestion(from);
            } else if (text.toLowerCase().includes('avanzada')) {
                stateStore.setAnswer(from, 'edicion', 'Avanzada');
                await this.askNextQuestion(from);
            } else {
                await whatsappAPI.sendTextMessage(
                    from,
                    'Por favor, elige entre "Básica" o "Avanzada".'
                );
            }
        } else if (!answers.embed) {
            // Collecting embed
            if (text.toLowerCase().includes('sí') || text.toLowerCase().includes('si') || text.toLowerCase().includes('yes')) {
                stateStore.setAnswer(from, 'embed', true);
                await this.askNextQuestion(from);
            } else if (text.toLowerCase().includes('no')) {
                stateStore.setAnswer(from, 'embed', false);
                await this.askNextQuestion(from);
            } else {
                await whatsappAPI.sendTextMessage(
                    from,
                    'Por favor, responde "sí" o "no".'
                );
            }
        } else if (!answers.urgente) {
            // Collecting urgente
            if (text.toLowerCase().includes('urgente') || text.toLowerCase().includes('urgent')) {
                stateStore.setAnswer(from, 'urgente', true);
                await this.askNextQuestion(from);
            } else if (text.toLowerCase().includes('normal')) {
                stateStore.setAnswer(from, 'urgente', false);
                await this.askNextQuestion(from);
            } else {
                await whatsappAPI.sendTextMessage(
                    from,
                    'Por favor, elige entre "Normal" o "Urgente".'
                );
            }
        } else if (!answers.presupuesto) {
            // Collecting presupuesto (optional)
            if (text.toLowerCase().includes('no') || text.toLowerCase().includes('ninguno')) {
                stateStore.setAnswer(from, 'presupuesto', 'No especificado');
            } else {
                stateStore.setAnswer(from, 'presupuesto', text);
            }
            await this.askNextQuestion(from);
        } else {
            // All basic info collected, show summary
            await this.showDataSummary(from);
        }
    }

    /**
     * Show welcome message with service type buttons
     */
    private async showWelcomeMessage(from: string): Promise<void> {
        stateStore.setStep(from, 'welcome');
        
        await whatsappAPI.sendInteractiveButtons(
            from,
            '¡Hola! Soy el asistente de Castello360. Te ayudo a cotizar tu Tour 360.\n\nElige una opción:',
            [
                { id: 'restaurante', title: 'Restaurante' },
                { id: 'venue_eventos', title: 'Venue / Eventos' },
                { id: 'airbnb_arriendo', title: 'Airbnb / Arriendo' },
                { id: 'hotel', title: 'Hotel' },
                { id: 'otro', title: 'Otro' }
            ]
        );
    }

    /**
     * Handle service type selection
     */
    private async handleServiceTypeSelection(from: string, buttonId: string): Promise<void> {
        const serviceType = this.mapButtonIdToServiceType(buttonId);
        stateStore.setServiceType(from, serviceType);
        stateStore.setStep(from, 'collecting_info');
        
        await whatsappAPI.sendTextMessage(
            from,
            `Perfecto, has seleccionado: ${serviceType}\n\n` +
            'Ahora necesito algunos datos para cotizar tu tour 360. ' +
            'Empecemos con lo básico:'
        );
        
        await this.askNextQuestion(from);
    }

    /**
     * Ask the next question based on current progress
     */
    private async askNextQuestion(from: string): Promise<void> {
        const state = stateStore.getState(from);
        const answers = state.answers;
        
        if (!answers.comuna) {
            await whatsappAPI.sendTextMessage(
                from,
                '¿En qué comuna o ciudad se encuentra el lugar?'
            );
        } else if (!answers.direccion) {
            await whatsappAPI.sendTextMessage(
                from,
                '¿Puedes darme la dirección o una referencia del lugar? (opcional)'
            );
        } else if (!answers.fecha) {
            await whatsappAPI.sendTextMessage(
                from,
                '¿Para cuándo necesitas el tour 360?\n\n' +
                'Puedes decir: "hoy", "mañana", "esta semana", "próxima semana" o una fecha específica como "15/12"'
            );
        } else if (!answers.link) {
            await whatsappAPI.sendTextMessage(
                from,
                '¿Tienes algún link del lugar? (web, Google Maps, Airbnb, Instagram)\n\n' +
                'Si no tienes, escribe "no" o "ninguno"'
            );
        } else if (!answers.nEspacios) {
            await this.askForEspacios(from);
        } else if (!answers.edicion) {
            await whatsappAPI.sendInteractiveButtons(
                from,
                '¿Qué tipo de edición necesitas?',
                [
                    { id: 'basica', title: 'Básica' },
                    { id: 'avanzada', title: 'Avanzada (retoques y branding)' }
                ]
            );
        } else if (!answers.embed) {
            await whatsappAPI.sendInteractiveButtons(
                from,
                '¿Necesitas el embed listo para tu web?',
                [
                    { id: 'si_embed', title: 'Sí' },
                    { id: 'no_embed', title: 'No' }
                ]
            );
        } else if (!answers.urgente) {
            await whatsappAPI.sendInteractiveButtons(
                from,
                '¿Cuál es el plazo de entrega que necesitas?',
                [
                    { id: 'normal', title: 'Normal (48-72h)' },
                    { id: 'urgente', title: 'Urgente (<24h)' }
                ]
            );
        } else if (!answers.presupuesto) {
            await whatsappAPI.sendTextMessage(
                from,
                '¿Tienes un presupuesto referencial en mente? (opcional)\n\n' +
                'Si no tienes uno específico, escribe "no" o "ninguno"'
            );
        } else if (!answers.nombre) {
            await whatsappAPI.sendTextMessage(
                from,
                '¿Cuál es tu nombre y cargo?'
            );
        } else if (!answers.correo) {
            await whatsappAPI.sendTextMessage(
                from,
                '¿Cuál es tu correo electrónico?'
            );
        } else if (!answers.factura) {
            await whatsappAPI.sendInteractiveButtons(
                from,
                '¿Necesitas factura o boleta?',
                [
                    { id: 'boleta', title: 'Boleta' },
                    { id: 'factura', title: 'Factura' }
                ]
            );
        } else {
            // All basic info collected, show summary
            await this.showDataSummary(from);
        }
    }

    /**
     * Ask for number of spaces/rooms
     */
    private async askForEspacios(from: string): Promise<void> {
        const state = stateStore.getState(from);
        const serviceType = state.serviceType;
        
        let message = '¿Cuántos espacios o ambientes necesitas que fotografiemos?';
        
        if (serviceType === 'Restaurante' || serviceType === 'Venue / Eventos' || serviceType === 'Hotel') {
            message += '\n\nPuedes elegir de la lista o escribir un número específico.';
            
            await whatsappAPI.sendListMessage(
                from,
                message,
                'Seleccionar Cantidad',
                [
                    {
                        title: 'Cantidad de Espacios',
                        rows: [
                            { id: 'espacios_1', title: '1 espacio', description: 'Un solo ambiente' },
                            { id: 'espacios_2', title: '2 espacios', description: 'Dos ambientes' },
                            { id: 'espacios_3', title: '3 espacios', description: 'Tres ambientes' },
                            { id: 'espacios_4', title: '4 espacios', description: 'Cuatro ambientes' },
                            { id: 'espacios_5', title: '5+ espacios', description: 'Cinco o más ambientes' }
                        ]
                    }
                ]
            );
        } else {
            await whatsappAPI.sendTextMessage(from, message);
        }
    }

    /**
     * Continue info collection after receiving an answer
     */
    private async continueInfoCollection(from: string): Promise<void> {
        const state = stateStore.getState(from);
        
        // Check if we have all required info
        const requiredFields = ['comuna', 'fecha', 'nEspacios', 'edicion', 'embed', 'urgente'];
        const hasAllRequired = requiredFields.every(field => state.answers[field]);
        
        if (hasAllRequired) {
            await this.showDataSummary(from);
        } else {
            await this.askNextQuestion(from);
        }
    }

    /**
     * Show data summary for confirmation
     */
    private async showDataSummary(from: string): Promise<void> {
        const state = stateStore.getState(from);
        const answers = state.answers;
        
        stateStore.setStep(from, 'confirming_data');
        
        const summary = `Perfecto. Resumen:\n` +
            `• Tipo: ${state.serviceType}\n` +
            `• Comuna: ${answers.comuna}\n` +
            `• Dirección/ref: ${answers.direccion || 'No especificada'}\n` +
            `• Fecha tentativa: ${answers.fecha}\n` +
            `• Espacios/ambientes: ${answers.nEspacios}\n` +
            `• Edición: ${answers.edicion}\n` +
            `• Embed web: ${answers.embed ? 'Sí' : 'No'}\n` +
            `• Urgencia: ${answers.urgente ? 'Urgente' : 'Normal'}\n\n` +
            `¿Está bien? Responde "sí" para cotizar o "editar" para cambiar algo.`;
        
        await whatsappAPI.sendTextMessage(from, summary);
    }

    /**
     * Handle data confirmation step
     */
    private async handleDataConfirmationStep(from: string, text: string): Promise<void> {
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes('sí') || lowerText.includes('si') || lowerText.includes('yes') || lowerText.includes('ok')) {
            await this.calculateAndShowPricing(from);
        } else if (lowerText.includes('editar') || lowerText.includes('edit') || lowerText.includes('cambiar')) {
            await this.handleEditarDatosSelection(from);
        } else {
            await whatsappAPI.sendTextMessage(
                from,
                'Por favor, responde "sí" para continuar con la cotización o "editar" si quieres cambiar algo.'
            );
        }
    }

    /**
     * Calculate and show pricing
     */
    private async calculateAndShowPricing(from: string): Promise<void> {
        const state = stateStore.getState(from);
        const answers = state.answers;
        
        stateStore.setStep(from, 'showing_pricing');
        
        // Calculate pricing
        const pricingInput: PricingInput = {
            tipo: state.serviceType,
            nEspacios: answers.nEspacios,
            edicion: answers.edicion,
            embed: answers.embed,
            urgente: answers.urgente,
            comuna: answers.comuna
        };
        
        const pricing = calculatePricing(pricingInput);
        stateStore.setPricing(from, pricing);
        
        // Show pricing summary
        const pricingText = generatePricingSummary(pricingInput, pricing);
        
        await whatsappAPI.sendInteractiveButtons(
            from,
            pricingText,
            [
                { id: 'agendar', title: 'Agendar' },
                { id: 'editar_datos', title: 'Editar datos' },
                { id: 'hablar_humano', title: 'Hablar con humano' }
            ]
        );
    }

    /**
     * Handle pricing step
     */
    private async handlePricingStep(from: string, text: string): Promise<void> {
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes('agendar') || lowerText.includes('agenda') || lowerText.includes('sí') || lowerText.includes('si')) {
            await this.handleAgendarSelection(from);
        } else if (lowerText.includes('editar') || lowerText.includes('edit')) {
            await this.handleEditarDatosSelection(from);
        } else if (lowerText.includes('humano') || lowerText.includes('persona')) {
            await this.handleHablarHumanoSelection(from);
        } else {
            await whatsappAPI.sendTextMessage(
                from,
                'Por favor, elige una opción:\n' +
                '• "Agendar" para continuar\n' +
                '• "Editar datos" para cambiar algo\n' +
                '• "Hablar con humano" para contacto directo'
            );
        }
    }

    /**
     * Handle agendar selection
     */
    private async handleAgendarSelection(from: string): Promise<void> {
        stateStore.setStep(from, 'collecting_contact');
        
        await whatsappAPI.sendTextMessage(
            from,
            '¡Excelente! Ahora necesito algunos datos de contacto para agendar tu sesión.\n\n' +
            '¿Cuál es tu nombre y cargo?'
        );
    }

    /**
     * Handle editar datos selection
     */
    private async handleEditarDatosSelection(from: string): Promise<void> {
        stateStore.setStep(from, 'collecting_info');
        
        await whatsappAPI.sendTextMessage(
            from,
            'Perfecto, vamos a editar los datos. ¿Qué quieres cambiar?\n\n' +
            'Puedes escribir "reiniciar" para empezar desde cero, o decirme qué campo específico quieres modificar.'
        );
    }

    /**
     * Handle hablar humano selection
     */
    private async handleHablarHumanoSelection(from: string): Promise<void> {
        await whatsappAPI.sendTextMessage(
            from,
            '¡Por supuesto! Un representante de Castello360 se pondrá en contacto contigo pronto.\n\n' +
            `📞 Teléfono: ${environment.BUSINESS_PHONE}\n` +
            `🌐 Website: ${environment.BUSINESS_WEBSITE}\n\n` +
            'Mientras tanto, he guardado tu información para que no tengas que repetirla. ' +
            '¡Gracias por tu interés en nuestros tours 360! 🎉'
        );
        
        // Mark lead as confirmed and send to Google Sheets
        const lead = stateStore.getLead(from);
        if (lead) {
            stateStore.confirmLead(from);
            await leadManager.sendToGoogleSheets(lead);
        }
    }

    /**
     * Handle contact collection step
     */
    private async handleContactCollectionStep(from: string, text: string): Promise<void> {
        const state = stateStore.getState(from);
        const answers = state.answers;
        
        if (!answers.nombre) {
            stateStore.setAnswer(from, 'nombre', text);
            await whatsappAPI.sendTextMessage(
                from,
                '¿Cuál es tu correo electrónico?'
            );
        } else if (!answers.correo) {
            if (validateEmail(text).isValid) {
                stateStore.setAnswer(from, 'correo', text);
                await whatsappAPI.sendInteractiveButtons(
                    from,
                    '¿Necesitas factura o boleta?',
                    [
                        { id: 'boleta', title: 'Boleta' },
                        { id: 'factura', title: 'Factura' }
                    ]
                );
            } else {
                await whatsappAPI.sendTextMessage(
                    from,
                    'Por favor, ingresa un correo electrónico válido.'
                );
            }
        } else if (!answers.factura) {
            if (text.toLowerCase().includes('factura')) {
                stateStore.setAnswer(from, 'factura', 'Factura');
                await whatsappAPI.sendTextMessage(
                    from,
                    'Perfecto. Para la factura necesito:\n\n' +
                    '¿Cuál es la razón social?'
                );
            } else {
                stateStore.setAnswer(from, 'factura', 'Boleta');
                await this.proceedToScheduling(from);
            }
        } else if (!answers.razonSocial && answers.factura === 'Factura') {
            stateStore.setAnswer(from, 'razonSocial', text);
            await whatsappAPI.sendTextMessage(
                from,
                '¿Cuál es el RUT de la empresa?'
            );
        } else if (!answers.rut && answers.factura === 'Factura') {
            if (validateRUT(text).isValid) {
                stateStore.setAnswer(from, 'rut', text);
                await this.proceedToScheduling(from);
            } else {
                await whatsappAPI.sendTextMessage(
                    from,
                    'Por favor, ingresa un RUT válido en formato 12345678-9'
                );
            }
        }
    }

    /**
     * Proceed to scheduling step
     */
    private async proceedToScheduling(from: string): Promise<void> {
        stateStore.setStep(from, 'scheduling');
        
        // Generate available dates (next 2-3 business days)
        const availableDates = this.generateAvailableDates();
        
        await whatsappAPI.sendTextMessage(
            from,
            '¡Perfecto! Ahora vamos a agendar tu sesión.\n\n' +
            'Te puedo ofrecer estas fechas:\n' +
            availableDates.map(date => `• ${date.toLocaleDateString('es-CL', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
            })}`).join('\n') +
            '\n\n¿Cuál te funciona mejor? O si prefieres otra fecha, dímelo.'
        );
    }

    /**
     * Handle scheduling step
     */
    private async handleSchedulingStep(from: string, text: string): Promise<void> {
        const parsedDate = parseDate(text);
        
        if (parsedDate.isValid) {
            stateStore.setAnswer(from, 'fechaAgendada', parsedDate.text);
            
            // Mark lead as confirmed
            stateStore.confirmLead(from);
            
            // Send confirmation message
            await whatsappAPI.sendTextMessage(
                from,
                '🎉 ¡Perfecto! Tu sesión ha sido agendada.\n\n' +
                `📅 Fecha: ${parsedDate.text}\n` +
                '📍 Lugar: Te contactaremos para coordinar la dirección exacta\n' +
                '⏰ Hora: Te enviaremos la hora específica por WhatsApp\n\n' +
                '¡Gracias por elegir Castello360! Nuestro equipo se pondrá en contacto contigo pronto para confirmar todos los detalles.\n\n' +
                'Si tienes alguna pregunta, no dudes en escribirnos. ¡Hasta pronto! 🚀'
            );
            
            // Send to Google Sheets
            const lead = stateStore.getLead(from);
            if (lead) {
                await leadManager.sendToGoogleSheets(lead);
            }
        } else {
            await whatsappAPI.sendTextMessage(
                from,
                'No pude entender esa fecha. Por favor, usa una de las opciones que te di o escribe la fecha en formato DD/MM.'
            );
        }
    }

    /**
     * Handle navigation commands
     */
    private async handleNavigationCommand(from: string, command: 'menu' | 'back' | 'reset' | 'human' | null): Promise<void> {
        switch (command) {
            case 'menu':
                await this.showWelcomeMessage(from);
                break;
            case 'back':
                await this.goBackOneStep(from);
                break;
            case 'reset':
                stateStore.resetState(from);
                await this.showWelcomeMessage(from);
                break;
            case 'human':
                await this.handleHablarHumanoSelection(from);
                break;
            default:
                await whatsappAPI.sendTextMessage(
                    from,
                    'No entiendo ese comando. Puedes usar:\n' +
                    '• "menú" para volver al inicio\n' +
                    '• "atrás" para la pregunta anterior\n' +
                    '• "reiniciar" para empezar de nuevo\n' +
                    '• "humano" para hablar con alguien'
                );
        }
    }

    /**
     * Go back one step in the conversation
     */
    private async goBackOneStep(from: string): Promise<void> {
        const state = stateStore.getState(from);
        const answers = state.answers;
        
        // Remove the last answer and go back
        const lastAnswerKey = Object.keys(answers).pop();
        if (lastAnswerKey) {
            delete answers[lastAnswerKey];
            stateStore.updateState(from, { answers });
        }
        
        await this.askNextQuestion(from);
    }

    /**
     * Handle unknown button
     */
    private async handleUnknownButton(from: string, buttonId: string): Promise<void> {
        console.warn(`Unknown button ID: ${buttonId}`);
        await whatsappAPI.sendTextMessage(
            from,
            'No reconozco esa opción. Por favor, usa los botones disponibles o escribe tu respuesta.'
        );
    }

    /**
     * Generate available dates for scheduling
     */
    private generateAvailableDates(): Date[] {
        const dates: Date[] = [];
        const today = new Date();
        let currentDate = new Date(today);
        
        // Skip weekends and add 2-3 business days
        let businessDaysAdded = 0;
        while (businessDaysAdded < 3) {
            currentDate.setDate(currentDate.getDate() + 1);
            
            // Skip weekends (0 = Sunday, 6 = Saturday)
            if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
                dates.push(new Date(currentDate));
                businessDaysAdded++;
            }
        }
        
        return dates;
    }

    /**
     * Map button ID to service type
     */
    private mapButtonIdToServiceType(buttonId: string): string {
        const mapping: Record<string, string> = {
            'restaurante': 'Restaurante',
            'venue_eventos': 'Venue / Eventos',
            'airbnb_arriendo': 'Airbnb / Arriendo',
            'hotel': 'Hotel',
            'otro': 'Otro'
        };
        
        return mapping[buttonId] || 'Otro';
    }

    /**
     * Map service type to button ID
     */
    private mapServiceTypeToButtonId(serviceType: string): string {
        const mapping: Record<string, string> = {
            'Restaurante': 'restaurante',
            'Venue / Eventos': 'venue_eventos',
            'Airbnb / Arriendo': 'airbnb_arriendo',
            'Hotel': 'hotel',
            'Otro': 'otro'
        };
        
        return mapping[serviceType] || 'otro';
    }
}
