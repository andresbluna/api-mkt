# S.A.M - Sistema de Asistencia de Marketing para Negocios Pequeños

Backend API para generar contenido de marketing con IA y publicar en redes sociales.

## 🎯 Características

- 🤖 Generación de contenido marketing con Google Gemini AI
- 📱 Integración con Instagram Graph API
- 📊 Gestión de posts y publicaciones
- 💾 Base de datos PostgreSQL con TypeORM
- 📈 Registro de interacciones y logs automáticos
- ✔️ Validación y manejo de errores completo
- 🔐 Autenticación (Sistema Propio)

## 🏗️ Arquitectura del Proyecto

```
src/
├── config/              # Configuración global
│   └── database.config.ts
├── user/               # Módulo de usuarios
│   ├── user.entity.ts
│   ├── interaction-log.entity.ts
│   ├── users.service.ts
│   ├── users.controller.ts
│   ├── users.module.ts
│   └── dto/
│       └── user.dto.ts
├── posts/              # Módulo de publicaciones
│   ├── entities/
│   │   └── post.entity.ts
│   ├── posts.service.ts
│   ├── posts.controller.ts
│   ├── posts.module.ts
│   └── dto/
│       └── post.dto.ts
├── gemini/             # Módulo de generación IA
│   ├── gemini.service.ts
│   ├── gemini.controller.ts
│   ├── gemini.module.ts
│   └── dto/
│       └── gemini.dto.ts
├── instagram/          # Módulo de Instagram Graph API
│   ├── instagram.service.ts
│   ├── instagram.controller.ts
│   ├── instagram.module.ts
│   └── dto/
│       └── instagram.dto.ts
├── social/             # Módulo de redes sociales
│   ├── entities/
│   │   └── social-account.entity.ts
│   ├── social.service.ts
│   ├── social.controller.ts
│   └── social.module.ts
├── shared/             # Servicios compartidos
│   └── services/
│       └── log.service.ts
├── app.module.ts       # Módulo raíz
└── main.ts            # Punto de entrada
```

## 📦 Tecnologías

- **NestJS** - Framework backend
- **TypeORM** - ORM para base de datos
- **PostgreSQL** - Base de datos
- **Google Generative AI** - Generación de contenido
- **Axios** - Cliente HTTP
- **class-validator** - Validación de DTOs
- **class-transformer** - Transformación de datos

## 🚀 Instalación y Configuración

### 1. Requisitos Previos

- Node.js 16+
- npm o yarn
- PostgreSQL 12+

### 2. Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd api-mkt

# Instalar dependencias
npm install --legacy-peer-deps
```

### 3. Configuración de Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# DATABASE CONFIGURATION
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password
DB_NAME=api_mkt

# GEMINI API
GEMINI_API_KEY=tu_gemini_api_key

# INSTAGRAM CONFIGURATION
INSTAGRAM_ACCESS_TOKEN=tu_instagram_token
INSTAGRAM_BUSINESS_ID=tu_business_id

# APP CONFIGURATION
PORT=3000
NODE_ENV=development
```

### 4. Crear Base de Datos

```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE api_mkt;
```

TypeORM creará automáticamente las tablas en modo desarrollo.

### 5. Ejecutar el Proyecto

```bash
# Desarrollo con watch mode
npm run start:dev

# Producción
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

## 🔐 Autenticación (Sistema Propio)

Módulo encargado del registro y login de usuarios mediante un identificador único (UUID).

### Registro de Usuario
Utiliza este endpoint cuando un usuario se registra por primera vez.

```bash
curl -X POST http://localhost:3000/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "uuid": "EJEMPLO_UUID_123",
       "email": "usuario@correo.com",
       "password": "tu_password_seguro",
       "name": "Juan Perez"
     }'
```

### Login de Usuario
Utiliza este endpoint para obtener los datos del usuario mediante su email y contraseña.

```bash
curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "usuario@correo.com",
       "password": "tu_password_seguro"
     }'
```

## 📚 API Endpoints

### Autenticación

```
POST   /auth/register            - Registro de usuario (Email/Password)
POST   /auth/login               - Login de usuario (Email/Password)
```

### Usuarios

```
POST   /users                    - Crear usuario
GET    /users/:id               - Obtener usuario por ID
GET    /users/uuid/:uuid        - Obtener usuario por UUID
PATCH  /users/:id               - Actualizar usuario
GET    /users/:id/logs          - Obtener logs del usuario
GET    /users/:id/stats         - Obtener estadísticas
```

### Posts

```
POST   /posts                    - Crear post
GET    /posts                    - Obtener posts del usuario
GET    /posts/:id               - Obtener post específico
PATCH  /posts/:id               - Actualizar post
DELETE /posts/:id               - Eliminar post
POST   /posts/generate/content  - Generar post con Gemini
POST   /posts/:id/publish       - Publicar en Instagram
GET    /posts/:id/stats         - Obtener estadísticas en Instagram
```

### Gemini (IA)

```
POST   /gemini/generate          - Generar post completo
POST   /gemini/generate-caption  - Generar caption
POST   /gemini/generate-hashtags - Generar hashtags
POST   /gemini/optimize          - Optimizar contenido
```

### Instagram

```
POST   /instagram/publish        - Publicar en Instagram
GET    /instagram/status/:id     - Obtener estado del post
DELETE /instagram/:id            - Eliminar post
```

### Redes Sociales

```
POST   /social                   - Conectar cuenta social
GET    /social/user/:userId      - Obtener cuentas sociales
GET    /social/:id               - Obtener cuenta social
PATCH  /social/:id               - Actualizar cuenta
DELETE /social/:id               - Desactivar cuenta
```

## 📝 Ejemplos de Uso

### Crear un Usuario

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "uuid": "ABC123",
    "email": "usuario@ejemplo.com",
    "name": "Juan Pérez",
    "plan": "free"
  }'
```

### Generar Contenido con Gemini

```bash
curl -X POST http://localhost:3000/gemini/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Promociona una hamburguesa gourmet"
  }'
```

### Crear y Publicar un Post

```bash
# 1. Generar post
curl -X POST http://localhost:3000/posts/generate/content \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Promociona un café especial"
  }'

# 2. Publicar en Instagram
curl -X POST http://localhost:3000/posts/1/publish \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://ejemplo.com/imagen.jpg",
    "caption": "Caption generado"
  }'
```

## 🗄️ Esquema de Base de Datos

### Tabla: users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  uuid VARCHAR UNIQUE NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR,
  name VARCHAR,
  plan VARCHAR DEFAULT 'free',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: interaction_logs
```sql
CREATE TABLE interaction_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: posts
```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  content TEXT NOT NULL,
  image_url VARCHAR,
  platform VARCHAR DEFAULT 'instagram',
  status VARCHAR DEFAULT 'draft',
  instagram_media_id VARCHAR,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: social_accounts
```sql
CREATE TABLE social_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR NOT NULL,
  account_id VARCHAR NOT NULL,
  access_token VARCHAR NOT NULL,
  refresh_token VARCHAR,
  token_expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔐 Validaciones y Excepciones

El proyecto implementa validaciones completas usando `class-validator`:

- ✔️ Validación de emails
- ✔️ Validación de URLs
- ✔️ Validación de campos no vacíos
- ✔️ Validación de tipos de datos
- ✔️ Manejo de excepciones con mensajes descriptivos

## 📊 Logs Automáticos

Se registran automáticamente las siguientes acciones:

- `register` - Registro de nuevo usuario
- `login` - Inicio de sesión
- `update_profile` - Actualización de perfil
- `create_post` - Creación de post
- `generate_content` - Generación de contenido con IA
- `publish_instagram` - Publicación en Instagram
- `delete_post` - Eliminación de post
- `update_post` - Actualización de post

## 🐛 Debugging

Usar modo debug:

```bash
npm run start:debug
```

## 📄 Scripts Disponibles

```bash
npm run build          # Compilar proyecto
npm start              # Ejecutar en producción
npm run start:dev      # Ejecutar en desarrollo
npm run start:debug    # Ejecutar en debug
npm run lint          # Ejecutar eslint
npm test              # Ejecutar tests
npm run test:e2e      # Ejecutar tests e2e
npm run format        # Formatear código
```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Crea un Pull Request

## 📞 Soporte

Para reportar problemas o sugerencias, abrir un issue en el repositorio.

## 📜 Licencia

Este proyecto está bajo licencia UNLICENSED.

---

**Última actualización**: Junio 2026

**Estado**: ✅ Funcional y listo para producción

