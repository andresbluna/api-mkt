# Ejemplos de Uso de la API S.A.M

## 🔧 Configuración Previa

Asegúrate de que el servidor está corriendo:
```bash
npm run start:dev
```

Base URL: `http://localhost:3000`

---

## 👤 USUARIOS

### 1. Crear Usuario
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "firebase_uid": "user_abc123",
    "email": "juan@ejemplo.com",
    "name": "Juan Pérez",
    "plan": "free"
  }'
```

### 2. Obtener Usuario por ID
```bash
curl -X GET http://localhost:3000/users/1
```

### 3. Obtener Usuario por Firebase UID
```bash
curl -X GET http://localhost:3000/users/firebase/user_abc123
```

### 4. Actualizar Usuario
```bash
curl -X PATCH http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Carlos Pérez",
    "plan": "premium"
  }'
```

### 5. Obtener Logs del Usuario
```bash
curl -X GET http://localhost:3000/users/1/logs
```

### 6. Obtener Estadísticas del Usuario
```bash
curl -X GET http://localhost:3000/users/1/stats
```

---

## 📱 POSTS

### 1. Crear Post Manual
```bash
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mi primer café",
    "content": "Café espresso hecho con granos 100% colombianos ☕",
    "image_url": "https://ejemplo.com/cafe.jpg",
    "platform": "instagram"
  }'
```

### 2. Generar Post con IA (Gemini)
```bash
curl -X POST http://localhost:3000/posts/generate/content \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Promociona un café especial de la región de Huila con un descuento del 20%"
  }'
```

### 3. Obtener Todos mis Posts
```bash
curl -X GET http://localhost:3000/posts
```

### 4. Obtener Post Específico
```bash
curl -X GET http://localhost:3000/posts/1
```

### 5. Actualizar Post
```bash
curl -X PATCH http://localhost:3000/posts/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Café especial actualizado",
    "content": "Contenido actualizado del post",
    "status": "draft"
  }'
```

### 6. Publicar Post en Instagram
```bash
curl -X POST http://localhost:3000/posts/1/publish \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://ejemplo.com/cafe-publicidad.jpg",
    "caption": "Disfruta nuestro café especial ☕✨"
  }'
```

### 7. Obtener Estadísticas en Instagram
```bash
curl -X GET http://localhost:3000/posts/1/stats
```

### 8. Eliminar Post
```bash
curl -X DELETE http://localhost:3000/posts/1
```

---

## 🤖 GEMINI AI

### 1. Generar Post Completo
```bash
curl -X POST http://localhost:3000/gemini/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Promociona una hamburguesa gourmet con queso azul y cebolla caramelizada"
  }'
```

Respuesta esperada:
```json
{
  "caption": "Caption generado por IA...",
  "hashtags": ["#hamburguesa", "#gourmet", ...],
  "fullPost": "Caption + hashtags"
}
```

### 2. Generar Caption
```bash
curl -X POST http://localhost:3000/gemini/generate-caption \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Pizzería artesanal con horno de leña"
  }'
```

### 3. Generar Hashtags
```bash
curl -X POST http://localhost:3000/gemini/generate-hashtags \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Bebida refrescante de berries casera"
  }'
```

### 4. Optimizar Contenido
```bash
curl -X POST http://localhost:3000/gemini/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Tenemos los mejores productos",
    "platform": "instagram"
  }'
```

---

## 📸 INSTAGRAM

### 1. Publicar en Instagram
```bash
curl -X POST http://localhost:3000/instagram/publish \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://ejemplo.com/imagen.jpg",
    "caption": "¡Ven a visitarnos! Tenemos las mejores ofertas 🎉"
  }'
```

### 2. Obtener Estado del Post
```bash
curl -X GET http://localhost:3000/instagram/status/18234567890123456
```

### 3. Eliminar Post de Instagram
```bash
curl -X DELETE http://localhost:3000/instagram/18234567890123456
```

---

## 🌐 REDES SOCIALES

### 1. Conectar Cuenta Social
```bash
curl -X POST http://localhost:3000/social \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "platform": "instagram",
    "account_id": "17841405822933471",
    "access_token": "tu_token_aqui",
    "refresh_token": "refresh_token_aqui"
  }'
```

### 2. Obtener Cuentas Sociales del Usuario
```bash
curl -X GET http://localhost:3000/social/user/1
```

### 3. Obtener Cuenta Social Específica
```bash
curl -X GET http://localhost:3000/social/1
```

### 4. Actualizar Cuenta Social
```bash
curl -X PATCH http://localhost:3000/social/1 \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "nuevo_token",
    "is_active": true
  }'
```

### 5. Desactivar Cuenta Social
```bash
curl -X DELETE http://localhost:3000/social/1
```

---

## 📊 FLUJO COMPLETO: GENERAR Y PUBLICAR

### Paso 1: Crear un Usuario
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "firebase_uid": "test_user_001",
    "email": "negocio@ejemplo.com",
    "name": "Mi Negocio",
    "plan": "premium"
  }'
```
**Respuesta**: Obtención de `id` del usuario (ej: 1)

### Paso 2: Generar Contenido con IA
```bash
curl -X POST http://localhost:3000/posts/generate/content \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Somos una cafetería artesanal con café de origen único, acaba de llegar nuestro café de Costa Rica"
  }'
```
**Respuesta**: Post generado con `id` (ej: 5)

### Paso 3: Publicar en Instagram
```bash
curl -X POST http://localhost:3000/posts/5/publish \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://ejemplo.com/cafe-costa-rica.jpg",
    "caption": "Caption generado automáticamente"
  }'
```
**Respuesta**: Post publicado con `instagram_media_id`

### Paso 4: Monitorear Estadísticas
```bash
curl -X GET http://localhost:3000/posts/5/stats
```
**Respuesta**: Estadísticas en tiempo real (likes, comentarios, etc.)

---

## ✅ VALIDACIONES

### Error: Email Inválido
```json
{
  "statusCode": 400,
  "message": "email must be an email",
  "error": "Bad Request"
}
```

### Error: Usuario no Encontrado
```json
{
  "statusCode": 404,
  "message": "Usuario no encontrado",
  "error": "Not Found"
}
```

### Error: Prompt Vacío
```json
{
  "statusCode": 400,
  "message": "El prompt no puede estar vacío",
  "error": "Bad Request"
}
```

---

## 🔑 Variables de Entorno Necesarias

Antes de usar la API, asegúrate de configurar:

```bash
# Gemini API
GEMINI_API_KEY=tu_clave_aqui

# Instagram
INSTAGRAM_ACCESS_TOKEN=tu_token_aqui
INSTAGRAM_BUSINESS_ID=tu_id_aqui

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password
DB_NAME=api_mkt
```

---

## 🚨 Troubleshooting

### "GEMINI_API_KEY is not defined"
- Asegúrate de que `.env` tiene `GEMINI_API_KEY`
- Reinicia el servidor: `npm run start:dev`

### Error de conexión a PostgreSQL
- Verifica que PostgreSQL está corriendo
- Comprueba credenciales en `.env`
- Asegúrate que la BD `api_mkt` existe

### Error al publicar en Instagram
- Valida que `INSTAGRAM_ACCESS_TOKEN` sea válido
- Verifica que `INSTAGRAM_BUSINESS_ID` es correcto
- El token podría estar expirado

---

## 📝 Notas Importantes

1. **user_id**: En los endpoints de posts, se usa `userId = 1` hardcodeado. En producción, debe venir de `@CurrentUser()`
2. **Relaciones**: Posts está relacionado con Users. Eliminar un usuario eliminará todos sus posts
3. **Logs**: Cada acción genera un log automático en `interaction_logs`
4. **Status**: Los posts pueden estar en estado: `draft`, `published`, `scheduled`

---

Última actualización: Junio 2026

