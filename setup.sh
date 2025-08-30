#!/bin/bash

echo "🚀 Configurando Bot de WhatsApp para Castello360..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js 18+ primero."
    echo "   Visita: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Se requiere Node.js versión 18+. Versión actual: $(node -v)"
    exit 1
fi

echo "✅ Node.js versión: $(node -v)"

# Install dependencies
echo "📦 Instalando dependencias..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creando archivo .env desde la plantilla..."
    cp env.example .env
    echo "✅ Archivo .env creado!"
    echo "⚠️  Por favor edita el archivo .env con tus credenciales de WhatsApp Business API"
else
    echo "✅ Archivo .env ya existe"
fi

# Create temp directories
echo "📁 Creando directorios temporales..."
mkdir -p temp/images temp/video temp/audio temp/documents temp/other

# Build the project
echo "🔨 Construyendo proyecto TypeScript..."
npm run build

echo ""
echo "🎉 ¡Configuración completada! Aquí están los siguientes pasos:"
echo ""
echo "1. 📝 Edita el archivo .env con tus credenciales de WhatsApp Business API:"
echo "   - META_WABA_TOKEN"
echo "   - WABA_PHONE_NUMBER_ID"
echo "   - WABA_VERIFY_TOKEN"
echo "   - BASE_URL (tu dominio o ngrok URL)"
echo ""
echo "2. 🌐 Configura el webhook en Meta Developer Console:"
echo "   - URL: https://tu-dominio.com/webhook"
echo "   - Token de verificación: mismo valor que WABA_VERIFY_TOKEN"
echo "   - Suscríbete al campo 'messages'"
echo ""
echo "3. 🚀 Inicia tu bot:"
echo "   npm start"
echo ""
echo "4. 🧪 Prueba localmente con ngrok:"
echo "   ngrok http 3000"
echo ""
echo "5. 📱 Envía un mensaje a tu número de WhatsApp Business (+56971219394)"
echo ""
echo "📚 Revisa README.md para instrucciones detalladas!"
echo ""
echo "🎯 ¡Tu bot de Castello360 está listo para manejar cotizaciones de tours 360°!"
