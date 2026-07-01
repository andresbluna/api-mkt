# Instagram Integration — Documentación de API

> **Base URL:** `https://api-mkt.onrender.com`
>
> **Autenticación:** Todos los endpoints de `/instagram/publish/*` requieren un JWT en el header `Authorization: Bearer <token>`. Los endpoints de auth de Instagram **no** requieren JWT.

---

## Índice

1. [Obtener JWT (login de tu app)](#1-obtener-jwt-login-de-tu-app)
2. [Conectar cuenta de Instagram](#2-conectar-cuenta-de-instagram)
   - [Opción A — Redirect directo (móvil/webview)](#opción-a--redirect-directo-móvilwebview)
   - [Opción B — Obtener URL y redirigir manualmente](#opción-b--obtener-url-y-redirigir-manualmente)
3. [Callback de Meta (automático)](#3-callback-de-meta-automático)
4. [Verificar estado de conexión](#4-verificar-estado-de-conexión)
5. [Publicar imagen en Instagram](#5-publicar-imagen-en-instagram)
6. [Consultar estado de publicación](#6-consultar-estado-de-publicación)
7. [Eliminar publicación](#7-eliminar-publicación)
8. [Desconectar cuenta de Instagram](#8-desconectar-cuenta-de-instagram)
9. [Flujo completo de integración](#9-flujo-completo-de-integración)
10. [Errores comunes](#10-errores-comunes)

---

## 1. Obtener JWT (login de tu app)

Antes de llamar a cualquier endpoint protegido necesitas un JWT de tu propio sistema.

### `POST /auth/login`

```bash
curl -X POST https://api-mkt.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "tuPassword123"
  }'
```

**Respuesta exitosa `200`:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 42,
    "email": "usuario@ejemplo.com"
  }
}
```

> Guarda el `access_token`. Lo necesitas en el header de todos los endpoints de publicación.

---

## 2. Conectar cuenta de Instagram

El flujo es OAuth 2.0 con Instagram Login. El usuario debe autorizar tu app en Instagram.

### Opción A — Redirect directo (móvil/webview)

Abre esta URL en un webview o browser. Meta redirige al usuario a Instagram para autorizar.

### `GET /instagram/auth/login?userId={userId}`

```bash
# Solo para pruebas en curl — en producción el frontend abre esta URL en un browser/webview
curl -L "https://api-mkt.onrender.com/instagram/auth/login?userId=42"
```

| Parámetro | Tipo   | Descripción                              |
|-----------|--------|------------------------------------------|
| `userId`  | number | ID del usuario en **tu** base de datos   |

**Comportamiento:** El servidor redirige (302) directamente a Instagram para autorización. Cuando el usuario acepta, Meta llama al callback de tu backend y al finalizar redirige a `samapp://instagram-success?connected=true`.

---

### Opción B — Obtener URL y redirigir manualmente

Si prefieres manejar la redirección desde el frontend:

### `GET /instagram/auth/url?userId={userId}`

```bash
curl "https://api-mkt.onrender.com/instagram/auth/url?userId=42"
```

**Respuesta exitosa `200`:**

```json
{
  "url": "https://www.instagram.com/oauth/authorize?client_id=27207030892311846&redirect_uri=https%3A%2F%2Fapi-mkt.onrender.com%2Fauth%2Finstagram%2Fcallback&scope=instagram_business_basic%2Cinstagram_business_content_publish&state=42&response_type=code"
}
```

Luego en el frontend abre `response.url` en un webview/browser.

---

## 3. Callback de Meta (automático)

> ⚠️ **Este endpoint NO lo llamas tú.** Meta lo llama automáticamente después de que el usuario autoriza.

### `GET /auth/instagram/callback?code={code}&state={userId}`

- **URL registrada en Meta Developer Console:** `https://api-mkt.onrender.com/auth/instagram/callback`
- Cuando Meta llama este endpoint, el backend intercambia el `code` por un token de larga duración, obtiene el Instagram User ID y guarda la conexión en la base de datos.
- Al terminar, redirige al usuario a: `samapp://instagram-success?connected=true`

**Parámetros que envía Meta:**

| Parámetro | Descripción                                    |
|-----------|------------------------------------------------|
| `code`    | Authorization code de Instagram (uso único)    |
| `state`   | El `userId` que enviaste al iniciar el flujo   |

---

## 4. Verificar estado de conexión

Consulta si un usuario tiene su cuenta de Instagram conectada.

### `GET /instagram/auth/status/{userId}`

> No requiere JWT.

```bash
curl "https://api-mkt.onrender.com/instagram/auth/status/42"
```

**Respuesta — conectado `200`:**

```json
{
  "connected": true,
  "igUserId": "17841400455970"  ,
  "username": "mi_cuenta_ig",
  "expiresAt": "2026-08-30T17:04:16.501Z"
}
```

**Respuesta — no conectado `200`:**

```json
{
  "connected": false
}
```

> Usa `expiresAt` para avisarle al usuario cuando deba reconectar (el token dura ~60 días).

---

## 5. Publicar imagen en Instagram

Publica una imagen en la cuenta de Instagram del usuario autenticado.

### `POST /instagram/publish`

> **Requiere JWT** en el header `Authorization`.

```bash
curl -X POST https://api-mkt.onrender.com/instagram/publish \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://mi-servidor.com/images/foto.jpg",
    "caption": "Mi primera publicación via API 🚀 #marketing"
  }'
```

**Body (JSON):**

| Campo      | Tipo   | Requerido | Descripción                                       |
|------------|--------|-----------|---------------------------------------------------|
| `imageUrl` | string | ✅        | URL pública HTTPS de la imagen (JPEG o PNG, máx 8MB) |
| `caption`  | string | ✅        | Texto del post (máx 2200 caracteres)              |

**Requisitos de la imagen:**
- Debe ser públicamente accesible (Instagram la descarga desde esa URL)
- Protocolo HTTPS obligatorio
- Formato: JPEG o PNG
- Tamaño máximo: 8 MB
- Relación de aspecto: entre 4:5 y 1.91:1

**Respuesta exitosa `201`:**

```json
{
  "success": true,
  "mediaId": "17854360229135492"
}
```

> El proceso puede tardar 5-20 segundos porque el backend espera a que Instagram procese el container antes de publicar.

---

## 6. Consultar estado de publicación

Obtiene los metadatos de una publicación ya subida.

### `GET /instagram/publish/status/{mediaId}`

> **Requiere JWT** en el header `Authorization`.

```bash
curl "https://api-mkt.onrender.com/instagram/publish/status/17854360229135492" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Respuesta exitosa `200`:**

```json
{
  "id": "17854360229135492",
  "caption": "Mi primera publicación via API 🚀 #marketing",
  "media_type": "IMAGE",
  "media_url": "https://scontent.cdninstagram.com/...",
  "timestamp": "2026-07-01T21:04:16+0000",
  "like_count": 0,
  "comments_count": 0,
  "permalink": "https://www.instagram.com/p/ABC123xyz/"
}
```

---

## 7. Eliminar publicación

> ⚠️ **La Instagram Graph API no permite eliminar publicaciones** una vez publicadas. Este endpoint devuelve un error descriptivo. La eliminación solo es posible desde la app de Instagram directamente.

### `DELETE /instagram/publish/{mediaId}`

> **Requiere JWT.**

```bash
curl -X DELETE "https://api-mkt.onrender.com/instagram/publish/17854360229135492" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Respuesta `501`:**

```json
{
  "statusCode": 501,
  "message": "La Instagram Graph API no permite eliminar publicaciones ya publicadas. Elimina el contenido directamente desde la aplicación de Instagram."
}
```

---

## 8. Desconectar cuenta de Instagram

Elimina la conexión de Instagram del usuario de la base de datos.

### `DELETE /instagram/auth/disconnect/{userId}`

> No requiere JWT.

```bash
curl -X DELETE "https://api-mkt.onrender.com/instagram/auth/disconnect/42"
```

**Respuesta exitosa `200`:**

```json
{
  "success": true
}
```

---

## 9. Flujo completo de integración

Este es el orden correcto de llamadas para conectar y publicar:

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO DE CONEXIÓN                        │
└─────────────────────────────────────────────────────────────┘

1. Frontend verifica si el usuario ya tiene Instagram conectado
   GET /instagram/auth/status/{userId}
   → { connected: false }

2. Si no está conectado, abre el flujo OAuth
   Navegar a: GET /instagram/auth/login?userId={userId}
   (o pedir la URL con /instagram/auth/url y abrirla en webview)

3. Usuario autoriza en Instagram → Meta llama al callback automáticamente
   → Backend guarda la conexión en DB
   → Deep link: samapp://instagram-success?connected=true

4. App detecta el deep link y verifica el estado
   GET /instagram/auth/status/{userId}
   → { connected: true, igUserId: "...", username: "..." }

┌─────────────────────────────────────────────────────────────┐
│                   FLUJO DE PUBLICACIÓN                      │
└─────────────────────────────────────────────────────────────┘

1. Usuario hace login en tu app → obtiene JWT
   POST /auth/login

2. Publicar imagen
   POST /instagram/publish
   Authorization: Bearer {jwt}
   Body: { imageUrl, caption }

3. (Opcional) Verificar la publicación
   GET /instagram/publish/status/{mediaId}
   Authorization: Bearer {jwt}
```

---

## 10. Errores comunes

| Código HTTP | Mensaje                                            | Causa probable                                                              |
|-------------|---------------------------------------------------|-----------------------------------------------------------------------------|
| `400`       | Token inválido o expirado                          | El usuario necesita reconectar su cuenta (`/instagram/auth/login`)         |
| `400`       | Permisos insuficientes                             | La app de Meta no tiene aprobados los scopes necesarios                    |
| `400`       | URL de imagen no accesible por Instagram           | La imagen no es pública o no es HTTPS                                      |
| `400`       | El access token de Instagram ha expirado           | Han pasado ~60 días desde la conexión, el usuario debe reconectar          |
| `400`       | El contenedor de media tardó demasiado              | Reintenta la publicación en unos segundos                                   |
| `400`       | Límite de solicitudes excedido (rate limit)         | Demasiadas llamadas a la API de Meta en poco tiempo                        |
| `401`       | Unauthorized                                       | Falta el JWT o está expirado en endpoints de `/instagram/publish`          |
| `404`       | Usuario {id} no tiene Instagram conectado          | El usuario nunca conectó su cuenta o la desconectó                         |
| `501`       | La Instagram Graph API no permite eliminar...      | Comportamiento esperado, no es un error del frontend                       |

---

## Variables de entorno relevantes (para referencia)

```env
META_APP_ID=27207030892311846
META_REDIRECT_URI=https://api-mkt.onrender.com/auth/instagram/callback
META_GRAPH_VERSION=v25.0
```

> El `META_REDIRECT_URI` debe estar registrado **exactamente igual** en Meta Developer Console → Tu App → Instagram → OAuth Redirect URIs.
