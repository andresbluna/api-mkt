#!/bin/bash
# Script de verificación del proyecto S.A.M

echo "🔍 Verificando proyecto S.A.M..."
echo ""

# Verificar Node.js
echo "✓ Versión de Node.js:"
node --version
echo ""

# Verificar npm
echo "✓ Versión de npm:"
npm --version
echo ""

# Verificar que las dependencias estén instaladas
echo "✓ Verificando modules instalados..."
if [ -d "node_modules" ]; then
    echo "   node_modules existe ✓"
else
    echo "   ⚠️ node_modules no encontrado. Ejecuta: npm install --legacy-peer-deps"
fi
echo ""

# Verificar que .env existe
echo "✓ Verificando variables de entorno..."
if [ -f ".env" ]; then
    echo "   .env existe ✓"
else
    echo "   ⚠️ .env no encontrado. Ejecuta: cp .env.example .env"
fi
echo ""

# Verificar archivos importantes
echo "✓ Verificando archivos del proyecto..."
FILES=(
    "src/app.module.ts"
    "src/main.ts"
    "src/config/database.config.ts"
    "src/user/users.service.ts"
    "src/user/users.controller.ts"
    "src/posts/posts.service.ts"
    "src/posts/posts.controller.ts"
    "src/gemini/gemini.service.ts"
    "src/instagram/instagram.service.ts"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✓ $file"
    else
        echo "   ✗ $file (FALTA!)"
    fi
done
echo ""

# Intentar compilar
echo "🔨 Compilando proyecto..."
npm run build
if [ $? -eq 0 ]; then
    echo "✓ Compilación exitosa"
else
    echo "✗ Error en compilación"
    exit 1
fi
echo ""

echo "✅ Verificación completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Configurar .env con tus credenciales"
echo "2. Crear base de datos: createdb api_mkt"
echo "3. Ejecutar: npm run start:dev"

