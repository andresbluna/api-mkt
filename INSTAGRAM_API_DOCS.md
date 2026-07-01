# Instagram Integration — Documentación de API

> **Base URL:** `https://api-mkt.onrender.com`
>
> **Flujo OAuth:** Instagram API with **Facebook Login** (no Instagram Login).
> El usuario autoriza via Facebook, que tiene vinculada la cuenta de Instagram Business/Creator.
>
> **Autenticación:** Los endpoints de `/instagram/publish/*` requieren JWT en `Authorization: Bearer <token>`. Los endpoints de auth de Instagram **no** requieren JWT.

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

El flujo utiliza **Facebook Login** (OAuth 2.0 via Facebook). El usuario autoriza con su cuenta de Facebook que tiene vinculada la página con Instagram Business/Creator.

> ⚠️ **Requisito previo:** La cuenta de Instagram Business o Creator del usuario debe estar vinculada a una **Página de Facebook**. Si no lo está, el flujo fallará en el paso de obtención del Instagram Business Account.

### Opción A — Redirect directo (móvil/webview)

El servidor redirige directamente al **Facebook Login dialog**. Úsalo abriendo la URL en un webview o browser nativo.

### `GET /instagram/auth/login?userId={userId}`

```bash
# Solo para pruebas — en producción abrir esta URL en un browser/webview
curl -L "https://api-mkt.onrender.com/instagram/auth/login?userId=42"
```

| Parámetro | Tipo   | Descripción                             |
|-----------|--------|-----------------------------------------|
| `userId`  | number | ID del usuario en **tu** base de datos  |

**Comportamiento:**
1. El servidor redirige (302) al Facebook Login dialog
2. El usuario inicia sesión con Facebook y autoriza los permisos
3. Meta llama automáticamente al callback de tu backend
4. El backend obtiene el Instagram Business Account via la Página de Facebook
5. Al finalizar, redirige a `samapp://instagram-success?connected=true`

---

### Opción B — Obtener URL y redirigir manualmente

Si el frontend necesita controlar cuándo abrir el flujo:

### `GET /instagram/auth/url?userId={userId}`

```bash
curl "https://api-mkt.onrender.com/instagram/auth/url?userId=42"
```

**Respuesta exitosa `200`:**

```json
{
  "url": "https://www.facebook.com/v25.0/dialog/oauth?client_id=27207030892311846&redirect_uri=https%3A%2F%2Fapi-mkt.onrender.com%2Fauth%2Finstagram%2Fcallback&scope=pages_show_list%2Cpages_read_engagement%2Cinstagram_basic%2Cinstagram_content_publish&state=42&response_type=code"
}
```

Luego abre `response.url` en un webview/browser. El usuario verá el diálogo de Facebook para autorizar los permisos.

**Permisos que se solicitan al usuario:**
- `pages_show_list` — ver las páginas de Facebook que administra
- `pages_read_engagement` — leer datos de la página
- `instagram_basic` — acceder a la cuenta de Instagram Business vinculada
- `instagram_content_publish` — publicar contenido en Instagram

---

## 3. Callback de Meta (automático)

> ⚠️ **Este endpoint NO lo llamas tú.** Meta lo llama automáticamente tras la autorización del usuario.

### `GET /auth/instagram/callback?code={code}&state={userId}`

- **URL registrada en Meta Developer Console:** `https://api-mkt.onrender.com/auth/instagram/callback`
- **Sección donde registrarla:** App → Facebook Login → Settings → Valid OAuth Redirect URIs

**Qué hace el backend al recibir el callback:**
1. Intercambia el `code` por un User Access Token de corta duración
2. Intercambia por un User Token de larga duración (~60 días)
3. Obtiene las Páginas de Facebook del usuario (`/me/accounts`) → devuelve page access tokens **permanentes**
4. Obtiene el Instagram Business Account vinculado a la primera página
5. Guarda en DB: `igUserId`, `pageId`, `pageAccessToken` (permanente)
6. Redirige a `samapp://instagram-success?connected=true`

**Parámetros que envía Meta:**

| Parámetro | Descripción                                  |
|-----------|----------------------------------------------|
| `code`    | Authorization code de Facebook (uso único)   |
| `state`   | El `userId` que enviaste al iniciar el flujo |

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
  "igUserId": "17841400455970",
  "pageId": "102938471856234"
}
```

**Respuesta — no conectado `200`:**

```json
{
  "connected": false
}
```

> Los page access tokens son **permanentes** (no expiran mientras el usuario no revoque los permisos), por eso no hay `expiresAt` en la respuesta.

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

| Campo      | Tipo   | Requerido | Descripción                                          |
|------------|--------|-----------|------------------------------------------------------|
| `imageUrl` | string | ✅        | URL pública HTTPS de la imagen (JPEG o PNG, máx 8MB) |
| `caption`  | string | ✅        | Texto del post (máx 2200 caracteres)                 |

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

> El proceso puede tardar 5-20 segundos. El backend crea el container, espera a que Instagram lo procese (status `FINISHED`) y luego lo publica.

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

```
┌─────────────────────────────────────────────────────────────────┐
│                      FLUJO DE CONEXIÓN                          │
│              (Instagram API with Facebook Login)                 │
└─────────────────────────────────────────────────────────────────┘

1. Verificar si el usuario ya tiene Instagram conectado
   GET /instagram/auth/status/{userId}
   → { connected: false }

2. Si no está conectado, iniciar el flujo OAuth
   Abrir en browser/webview: GET /instagram/auth/login?userId={userId}
   (o pedir la URL con GET /instagram/auth/url?userId={userId} y abrirla)

3. El usuario ve el Facebook Login dialog y autoriza los permisos
   (pages_show_list, pages_read_engagement, instagram_basic, instagram_content_publish)

4. Meta llama automáticamente al callback del backend
   GET https://api-mkt.onrender.com/auth/instagram/callback?code=...&state={userId}
   → Backend obtiene: short token → long token → páginas FB → Instagram Business ID
   → Guarda en DB: igUserId, pageId, pageAccessToken (permanente)
   → Redirige a: samapp://instagram-success?connected=true

5. La app detecta el deep link y verifica el estado
   GET /instagram/auth/status/{userId}
   → { connected: true, igUserId: "...", pageId: "..." }

┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE PUBLICACIÓN                          │
└─────────────────────────────────────────────────────────────────┘

1. Usuario hace login en tu app → obtiene JWT
   POST /auth/login

2. Publicar imagen
   POST /instagram/publish
   Authorization: Bearer {jwt}
   Body: { imageUrl, caption }
   → Respuesta: { success: true, mediaId: "..." }

3. (Opcional) Verificar la publicación
   GET /instagram/publish/status/{mediaId}
   Authorization: Bearer {jwt}
```

---

## 10. Errores comunes

| Código HTTP | Mensaje                                                  | Causa probable                                                                         |
|-------------|----------------------------------------------------------|----------------------------------------------------------------------------------------|
| `400`       | Token inválido o expirado                                | El usuario revocó los permisos en Facebook. Debe reconectar su cuenta.                |
| `400`       | Permisos insuficientes                                   | La app de Meta no tiene aprobados los scopes. Verificar en Meta Developer Console.    |
| `400`       | URL de imagen no accesible por Instagram                 | La imagen no es pública o no es HTTPS                                                  |
| `400`       | El contenedor de media tardó demasiado                   | Reintenta la publicación en unos segundos                                              |
| `400`       | Límite de solicitudes excedido (rate limit)              | Demasiadas llamadas a la API de Meta en poco tiempo                                    |
| `400`       | La página no tiene cuenta de Instagram Business vinculada | El usuario debe vincular su Instagram a su Página de Facebook antes de conectar        |
| `400`       | El usuario no administra ninguna página de Facebook      | El usuario no tiene páginas de FB. Debe crear una y vincular Instagram.                |
| `400`       | No se pudo obtener el access_token                       | El `redirect_uri` no coincide exactamente con el registrado en Meta Developer Console  |
| `401`       | Unauthorized                                             | Falta el JWT o está expirado en endpoints de `/instagram/publish`                     |
| `404`       | Usuario {id} no tiene Instagram conectado                | El usuario nunca conectó su cuenta o fue desconectado                                  |
| `501`       | La Instagram Graph API no permite eliminar...            | Comportamiento esperado, no es un error del frontend                                   |

---

## Configuración requerida en Meta Developer Console

```
App → Facebook Login → Settings → Valid OAuth Redirect URIs:
  https://api-mkt.onrender.com/auth/instagram/callback

App → Permissions and Features → Aprobados:
  ✅ pages_show_list
  ✅ pages_read_engagement
  ✅ instagram_basic
  ✅ instagram_content_publish
```

> El `redirect_uri` debe ser **exactamente igual** al de arriba (mismo protocolo, dominio, path y sin trailing slash). Cualquier diferencia causa `Invalid redirect_uri`.
