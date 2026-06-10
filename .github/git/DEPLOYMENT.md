# 🚀 Guía de Despliegue - S.A.M Backend

## Opciones de Despliegue

### 1️⃣ HEROKU (Recomendado para inicio)

#### Requisitos
- Cuenta de Heroku
- Heroku CLI instalado
- Git configurado

#### Pasos

```bash
# 1. Crear app en Heroku
heroku create tu-app-name

# 2. Crear base de datos PostgreSQL en Heroku
heroku addons:create heroku-postgresql:hobby-dev

# 3. Agregar variables de entorno
heroku config:set GEMINI_API_KEY=tu_clave
heroku config:set INSTAGRAM_ACCESS_TOKEN=tu_token
heroku config:set INSTAGRAM_BUSINESS_ID=tu_id
heroku config:set NODE_ENV=production

# 4. Deploy
git push heroku main

# 5. Ver logs
heroku logs --tail
```

### 2️⃣ AWS EC2

#### Requisitos
- Cuenta AWS
- Instancia EC2 (t3.micro gratuito)
- Domain registrado (opcional)

#### Pasos

```bash
# 1. Conectarse a la instancia
ssh -i "tu-clave.pem" ec2-user@your-instance.amazonaws.com

# 2. Instalar Node.js
curl -fsSL https://rpm.nodesource.com/setup_16.x | sudo bash -
sudo yum install -y nodejs

# 3. Instalar PostgreSQL
sudo yum install -y postgresql-server-devel

# 4. Clonar repositorio
git clone tu-repo.git
cd api-mkt

# 5. Instalar dependencias y compilar
npm install --legacy-peer-deps
npm run build

# 6. Iniciar con PM2 (gestor de procesos)
npm install -g pm2
pm2 start dist/main.js --name "sam-api"
pm2 startup
pm2 save

# 7. Configurar Nginx como proxy
sudo yum install -y nginx
# Editar /etc/nginx/nginx.conf...
sudo systemctl restart nginx
```

### 3️⃣ DOCKER (Production-Ready)

#### Dockerfile

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY ../.. .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

#### Docker Compose

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USERNAME: postgres
      DB_PASSWORD: postgres
      DB_NAME: api_mkt
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      INSTAGRAM_ACCESS_TOKEN: ${INSTAGRAM_ACCESS_TOKEN}
      INSTAGRAM_BUSINESS_ID: ${INSTAGRAM_BUSINESS_ID}
    depends_on:
      - postgres

  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: api_mkt
    volumes:
      - postgres_data:/var/lib/postgresql/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf

volumes:
  postgres_data:
```

#### Ejecutar con Docker

```bash
docker-compose up -d
```

### 4️⃣ RAILWAY.APP

```bash
# 1. Login
railway login

# 2. Link proyecto
railway link

# 3. Agregar variables
railway variables

# 4. Deploy
railway up
```

### 5️⃣ VERCEL (Solo frontend, pero puedes usar serverless)

No recomendado para GraphQL/REST con DB

### 6️⃣ RENDER

```bash
# 1. Crear web service en render.com
# 2. Conectar repositorio GitHub
# 3. Configurar:
Build Command: npm install --legacy-peer-deps && npm run build
Start Command: npm run start:prod
# 4. Agregar variables de entorno
# 5. Deploy
```

---

## ✅ Checklist Previo a Desplegar

- ✅ Variables de entorno configuradas
- ✅ Base de datos remota creada
- ✅ `npm run build` sin errores
- ✅ Tests pasando (si existen)
- ✅ Credenciales API validadas
- ✅ CORS configurado si es necesario
- ✅ Rate limiting implementado
- ✅ Logging configurado
- ✅ Backups de BD planificados

---

## 🔐 Variables de Entorno en Producción

```env
# Base de Datos
DB_HOST=your-db-host.RDS.amazonaws.com
DB_PORT=5432
DB_USERNAME=admin
DB_PASSWORD=strong_password
DB_NAME=api_mkt_prod

# APIs
GEMINI_API_KEY=sk-xxxxx
INSTAGRAM_ACCESS_TOKEN=IGQVJ...
INSTAGRAM_BUSINESS_ID=17841xxxx

# App
PORT=3000
NODE_ENV=production

# Security
JWT_SECRET=super_secret_key_long_string
```

---

## 📊 Monitoreo en Producción

```bash
# PM2 Monitoring
pm2 monit

# Logs
pm2 logs sam-api

# Restart automático
pm2 restart sam-api --cron "0 0 * * *"

# Health check
curl http://localhost:3000/health
```

---

## 🚨 Troubleshooting

### Error: "Cannot find module"
```bash
npm install --legacy-peer-deps
npm run build
```

### Error: "Database connection failed"
```bash
# Verificar credenciales en .env
# Verificar que BD está corriendo
# Verificar firewall/security groups
```

### Error: "401 Unauthorized Instagram"
```bash
# Token expirado, regenerar desde Meta Developer Console
# Verificar permisos en Token Settings
```

### Error: "Gemini API key invalid"
```bash
# Verificar API key en Google Cloud Console
# Verificar que Generative AI API está habilitada
```

---

## 📈 Mejoras Post-Despliegue

1. **Monitoring**: Agregar New Relic o DataDog
2. **Logging**: Winston o Bunyan
3. **Caché**: Redis para sesiones
4. **CDN**: CloudFlare para assets
5. **Backup**: Automatizar backups diarios
6. **CI/CD**: GitHub Actions
7. **Metrics**: Prometheus + Grafana

---

## 🎯 Recomendaciones Finales

**Para Desarrollo**: `npm run start:dev` en local  
**Para Testing**: Docker Compose  
**Para Producción**: Docker + Kubernetes o Railway/Render  
**Para MVP**: Heroku gratuito  

---

Última actualización: Junio 2026

