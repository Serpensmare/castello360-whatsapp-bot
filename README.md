# 🤖 Castello360 WhatsApp Bot

Bot de WhatsApp Business para Castello360 que guía a los clientes para cotizar tours 360° según sus necesidades específicas.

## ✨ Características

- **Clasificación automática** de tipos de servicio (Restaurante, Venue/Eventos, Airbnb/Arriendo, Hotel, Otro)
- **Recolección inteligente** de información con validaciones
- **Cálculo automático** de precios en CLP con desglose detallado
- **Gestión de leads** con almacenamiento en memoria y opción de Google Sheets
- **Soporte multimedia** para fotos, planos y links
- **Interfaz en español chileno** con botones interactivos
- **Máquina de estados** para conversaciones fluidas
- **API completa** para gestión administrativa

## 🚀 Instalación y Configuración

### 1. Requisitos Previos

- **Node.js 18+** instalado
- **Cuenta de WhatsApp Business API** configurada
- **Credenciales de Meta Developer Console**

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Copia el archivo de ejemplo y configura tus credenciales:

```bash
cp env.example .env
```

Edita `.env` con tus valores reales:

```env
# WhatsApp Cloud API Configuration
WHATSAPP_TOKEN=tu_token_de_acceso_aqui
PHONE_NUMBER_ID=tu_phone_number_id_aqui
VERIFY_TOKEN=myverify123

# Server Configuration
PORT=3000

# Castello360 Business Info
BUSINESS_NAME=Castello360
BUSINESS_PHONE=+56971219394
BUSINESS_WEBSITE=https://castello360.com
```

### 4. Construir y Ejecutar

```bash
# Construir el proyecto
npm run build

# Ejecutar en producción
npm start

# Ejecutar en desarrollo
npm run dev
```

## 🌐 Configuración del Webhook en Meta

### PASO 1: Instalar ngrok globalmente
```bash
npm install -g ngrok
```

### PASO 2: Iniciar el servidor
```bash
npm start
```

### PASO 3: En otra terminal, ejecutar ngrok
```bash
npm run ngrok
```

### PASO 4: Configurar webhook en Meta Developer Console
1. Ve a [Meta Developer Console](https://developers.facebook.com/)
2. Navega a tu app de WhatsApp Business
3. Ve a la sección Webhooks
4. **Callback URL**: Copia la URL HTTPS de ngrok y agrega `/webhook`
   - Ejemplo: `https://abc123.ngrok.io/webhook`
5. **Verify Token**: Usa el mismo valor que `VERIFY_TOKEN` en tu `.env`
   - Ejemplo: `myverify123`
6. Haz clic en **"Verify and save"**

### PASO 5: Suscribirse a Eventos
1. En la misma sección, haz clic en **"Manage"**
2. Marca la casilla **"messages"**
3. Haz clic en **"Save"**

## 📱 Flujo de Conversación

### Inicio
El bot envía un mensaje de bienvenida con botones interactivos:
- **Restaurante**
- **Venue / Eventos** 
- **Airbnb / Arriendo**
- **Hotel**
- **Otro**

### Recolección de Información
El bot recolecta secuencialmente:

1. **Comuna o ciudad** en Chile
2. **Dirección o referencia** (opcional)
3. **Fecha tentativa** de la sesión
4. **Link del lugar** (web, Google Maps, Airbnb, Instagram)
5. **Número de espacios/ambientes**
6. **Tipo de edición** (Básica o Avanzada)
7. **Necesidad de embed** para web
8. **Plazo de entrega** (Normal o Urgente)
9. **Presupuesto referencial** (opcional)
10. **Nombre y cargo**
11. **Correo electrónico**
12. **Tipo de documento** (Factura o Boleta)
13. **Razón social y RUT** (si es factura)

### Cotización
- **Cálculo automático** basado en la fórmula de precios
- **Desglose detallado** con todos los componentes
- **Rango de precios** (95% - 115% del subtotal)
- **Opcional**: Hosting y soporte anual ($250.000 CLP)

### Agendamiento
- **Opciones de fechas** (próximos días hábiles)
- **Confirmación final** del cliente
- **Envío automático** a Google Sheets (si está configurado)

## 💰 Lógica de Precios

### Fórmula Base
```
subtotal = visitaBase + (porEspacio × nEspacios)
```

### Recargos Aplicados
- **Edición Avanzada**: +25%
- **Embed web**: +$20.000 CLP
- **Urgente**: +20%
- **Desplazamiento**: Según comuna (0% - 12%)

### Zonas de Desplazamiento
- **Las Condes, Providencia, Ñuñoa, Santiago**: 0%
- **Maipú, La Florida, Puente Alto, Huechuraba, Quilicura**: 5%
- **Colina, Lampa, Padre Hurtado, Talagante, Peñaflor**: 8%
- **Valparaíso, Viña del Mar, Rancagua, Quillota**: 12%

### Rango Final
```
entrega = [subtotal × 0.95, subtotal × 1.15]
redondeado a múltiplos de $1.000
```

## 🔧 API Endpoints

### Webhook WhatsApp
```
GET /webhook - Verificación del webhook
POST /webhook - Recepción de mensajes
```

### Endpoints de Prueba
```
GET /test - Verificar que el servidor funciona
GET /health - Estado del servidor
```

### Gestión de Leads (Admin)
```
GET /admin/leads - Listar todos los leads
GET /admin/leads/:phone - Obtener lead específico
GET /admin/leads/export/csv - Exportar leads a CSV
POST /admin/leads/:phone/confirm - Confirmar lead
DELETE /admin/leads/:phone - Eliminar lead
```

## 🧪 Pruebas Locales

### Verificar que el servidor funciona
```bash
# Health check
curl http://localhost:3000/health

# Test endpoint
curl http://localhost:3000/test
```

### Verificar webhook
```bash
# Simular verificación de webhook
curl "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=myverify123&hub.challenge=test123"
```

## 📊 Gestión de Leads

### Ver Leads Activos
```bash
curl http://localhost:3000/admin/leads
```

### Exportar a CSV
```bash
curl http://localhost:3000/admin/leads/export/csv -o leads.csv
```

### Confirmar Lead
```bash
curl -X POST http://localhost:3000/admin/leads/+56971219394/confirm
```

## 🔒 Comandos de Navegación

Los usuarios pueden usar estos comandos en cualquier momento:
- **"menú"** - Volver al inicio
- **"atrás"** - Pregunta anterior
- **"reiniciar"** - Empezar de nuevo
- **"humano"** - Hablar con representante

## 📱 Tipos de Mensajes Soportados

- **Texto** - Respuestas y comandos
- **Botones interactivos** - Selecciones múltiples
- **Listas** - Opciones numeradas
- **Imágenes** - Fotos y planos del lugar
- **Links** - Detección automática de URLs

## 🌍 Integración con Google Sheets

Si configuras `GOOGLE_SHEETS_URL`, el bot enviará automáticamente:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "userPhone": "+56971219394",
  "serviceType": "Restaurante",
  "answers": { ... },
  "mediaUrls": [ ... ],
  "pricing": { ... },
  "confirmed": true,
  "businessInfo": { ... }
}
```

## 🚨 Solución de Problemas

### Webhook no verificado
- Verifica que `VERIFY_TOKEN` coincida con Meta Developer Console
- Asegúrate de que la URL del webhook sea accesible
- Confirma que estés usando la URL HTTPS de ngrok

### Mensajes no recibidos
- Confirma que el webhook esté suscrito al campo `messages`
- Revisa los logs del servidor para errores
- Verifica que el endpoint sea HTTPS (requerido por WhatsApp)

### Errores de API
- Confirma que `WHATSAPP_TOKEN` sea válido
- Verifica que `PHONE_NUMBER_ID` sea correcto
- Asegúrate de que la versión de la API sea compatible

### Debug Mode
```bash
NODE_ENV=development npm run dev
```

## 📚 Estructura del Proyecto

```
src/
├── config/          # Configuración del entorno
├── bot/            # Lógica principal del bot
├── core/           # Servicios core
├── utils/          # Utilidades y validadores
├── wa.ts           # Helper de WhatsApp API
├── pricing.ts      # Lógica de precios
├── state.ts        # Gestión de estado
├── nlp.ts          # Procesamiento de lenguaje natural
├── lead.ts         # Gestión de leads
└── server.ts       # Servidor Express

# Archivos principales
├── index.js        # Servidor principal para webhook verification
├── package.json    # Dependencias y scripts
├── .env            # Variables de entorno (crear desde env.example)
└── README.md       # Esta documentación
```

## 🔄 Migración a Redis

Para migrar de memoria a Redis:

1. Instala Redis y el cliente de Node.js
2. Modifica `src/state.ts` para usar Redis en lugar de Map
3. Actualiza las operaciones de estado para ser asíncronas

## 📄 Licencia

MIT License - Libre para uso comercial y personal.

## 🤝 Soporte

Para soporte técnico o consultas sobre el bot:
- 📧 Email: soporte@castello360.com
- 📞 Teléfono: +56971219394
- 🌐 Website: https://castello360.com

---

**¡El bot de Castello360 está listo para revolucionar tu proceso de cotización de tours 360°! 🚀**
