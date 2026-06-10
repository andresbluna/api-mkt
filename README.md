# S.A.M - Sistema de Asistencia de Marketing para Negocios Pequeños

🚀 Backend API para generar contenido de marketing con IA Gemini y publicar automáticamente en Instagram.

## ✨ Características Principales

- ✅ Generación inteligente de contenido con Google Gemini AI
- ✅ Publicación automática en Instagram Graph API
- ✅ Gestión completa de posts y publicaciones
- ✅ Base de datos PostgreSQL con TypeORM ORM
- ✅ Registro automático de logs y auditoría
- ✅ Validación completa de entrada de datos
- ✅ Manejo robusto de excepciones
- ✅ Arquitectura modular y escalable
- ✅ Integración con Firebase Authentication

## 🏗️ Estructura del Proyecto

El proyecto está organizado en módulos independientes:

```
src/
├── config/              # Configuración global
├── user/               # Gestión de usuarios
├── posts/              # Gestión de publicaciones
├── gemini/             # Integración con IA Google Gemini
├── instagram/          # Integración con Instagram Graph API
├── social/             # Gestión de redes sociales
├── shared/             # Servicios compartidos
├── app.module.ts       # Módulo principal
└── main.ts            # Punto de entrada
```

## 📋 Requisitos Previos

- Node.js 16+ 
- npm o yarn
- PostgreSQL 12+
- Cuenta de Google Cloud con Gemini API
- Token de Instagram Graph API

## 🚀 Instalación Rápida

```bash
# 1. Instalar dependencias
npm install --legacy-peer-deps

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 3. Crear base de datos
createdb api_mkt

# 4. Ejecutar
npm run start:dev
```

**API ejecutándose**: http://localhost:3000

## 🔧 Variables de Entorno

Crear `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password
DB_NAME=api_mkt

GEMINI_API_KEY=tu_api_key
INSTAGRAM_ACCESS_TOKEN=tu_token
INSTAGRAM_BUSINESS_ID=tu_id

PORT=3000
NODE_ENV=development
```

## 📚 Documentación PARA TU PUTA MADRE

- **[DOCUMENTATION.md](.github/git/DOCUMENTATION.md)** - Documentación técnica completa
- **[API_EXAMPLES.md](.github/git/API_EXAMPLES.md)** - Ejemplos de uso con cURL

## 🔌 Endpoints Rápidos

**Usuarios**: `POST/GET/PATCH /users`  
**Posts**: `POST/GET/PATCH/DELETE /posts`  
**IA**: `POST /gemini/generate`  
**Instagram**: `POST /instagram/publish`

## 📝 Ejemplo Rápido

```bash
# Generar post con IA
curl -X POST http://localhost:3000/posts/generate/content \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Café artesanal"}'
```

## 🛠️ Scripts

```bash
npm run start:dev      # Desarrollo
npm run build         # Compilar
npm start             # Producción
npm run lint          # Linter
```

## ✅ Status

- ✅ **Compilación**: Sin errores
- ✅ **Módulos integrados**: GeminiModule, InstagramModule, PostsModule, UsersModule
- ✅ **Base de datos**: TypeORM configurado
- ✅ **DTOs**: Validaciones implementadas
- ✅ **Logs**: Servicio automático

## 📄 Licencia

UNLICENSED

---

**Status**: ✅ Listo para producción  
**Versión**: 1.0.0  
**Actualizado**: Junio 2026
