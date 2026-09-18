# 🚀 SETUP INITIAL DU PROJET - FILES DE CONFIGURATION

## 1. STRUCTURE MONOREPO (package.json root)

```json
{
  "name": "basketball-togo-platform",
  "version": "0.1.0",
  "description": "The central digital ecosystem for Togolese basketball",
  "private": true,
  "workspaces": [
    "apps/web",
    "apps/api",
    "apps/ai-service",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev --parallel",
    "dev:web": "turbo run dev --filter=web",
    "dev:api": "turbo run dev --filter=api",
    "build": "turbo run build",
    "test": "turbo run test",
    "test:watch": "turbo run test:watch",
    "lint": "turbo run lint",
    "format": "prettier --write \"**/*.{ts,tsx,json,md}\"",
    "db:migrate": "cd apps/api && prisma migrate dev",
    "db:push": "cd apps/api && prisma db push",
    "db:seed": "cd apps/api && ts-node prisma/seed.ts",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:logs": "docker-compose logs -f"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "turbo": "^1.10.0",
    "typescript": "^5.0.0"
  }
}
```

---

## 2. ENV VARIABLES (.env.example root)

```bash
# ============ DATABASE ============
DATABASE_URL="postgresql://user:password@localhost:5432/basketball_togo_db"
DIRECT_URL="postgresql://user:password@localhost:5432/basketball_togo_db"

# ============ BACKEND ============
NODE_ENV="development"
API_PORT=3000
API_URL="http://localhost:3000"
API_VERSION="v1"

# ============ FRONTEND ============
VITE_API_URL="http://localhost:3000/api"
VITE_APP_URL="http://localhost:5173"

# ============ AI SERVICE ============
AI_SERVICE_URL="http://localhost:8000"
AI_SERVICE_PORT=8000

# ============ DATABASE BACKUP ============
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD=""

# ============ JWT ============
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_EXPIRE="15m"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_REFRESH_EXPIRE="30d"

# ============ CLOUDINARY ============
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# ============ EMAIL ============
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_USER="apikey"
SMTP_PASSWORD="your-sendgrid-api-key"
SENDGRID_API_KEY="your-sendgrid-key"

# ============ SMS (Afrimotion for Togo) ============
AFRIMOTION_API_KEY="your-api-key"
AFRIMOTION_API_URL="https://api.afrimotion.com"

# ============ FIREBASE (Push Notifications) ============
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_CLIENT_EMAIL="your-client-email"

# ============ STRIPE ============
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# ============ OAUTH ============
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"

FACEBOOK_APP_ID="your-app-id"
FACEBOOK_APP_SECRET="your-app-secret"
FACEBOOK_CALLBACK_URL="http://localhost:3000/auth/facebook/callback"

# ============ MONITORING ============
SENTRY_DSN="https://your-sentry-dsn"
SENTRY_ENVIRONMENT="development"
LOGROCKET_ID="your-logrocket-id"

# ============ ANALYTICS ============
MIXPANEL_TOKEN="your-mixpanel-token"

# ============ CORS ============
CORS_ORIGIN="http://localhost:5173,http://localhost:3000"

# ============ RATE LIMITING ============
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ============ FILE UPLOADS ============
MAX_UPLOAD_SIZE=52428800
ALLOWED_FILE_TYPES="jpg,jpeg,png,gif,webp,mp4,mov"
```

---

## 3. DOCKER COMPOSE (docker-compose.yml)

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: basketball_togo_db
    environment:
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
      POSTGRES_DB: ${DB_NAME:-basketball_togo_db}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - basketball_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: basketball_togo_cache
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - basketball_network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # PgAdmin (Database UI)
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: basketball_togo_pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@example.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    networks:
      - basketball_network
    depends_on:
      - postgres

  # Backend API
  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    container_name: basketball_togo_api
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/basketball_togo_db
      REDIS_URL: redis://redis:6379
      NODE_ENV: development
      JWT_SECRET: ${JWT_SECRET}
      CLOUDINARY_CLOUD_NAME: ${CLOUDINARY_CLOUD_NAME}
      CLOUDINARY_API_KEY: ${CLOUDINARY_API_KEY}
      CLOUDINARY_API_SECRET: ${CLOUDINARY_API_SECRET}
    ports:
      - "3000:3000"
    networks:
      - basketball_network
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./apps/api/src:/app/src
    command: npm run dev

  # AI Service (Python)
  ai-service:
    build:
      context: ./apps/ai-service
      dockerfile: Dockerfile
    container_name: basketball_togo_ai
    environment:
      PYTHONUNBUFFERED: 1
      AI_SERVICE_PORT: 8000
    ports:
      - "8000:8000"
    networks:
      - basketball_network
    volumes:
      - ./apps/ai-service/src:/app/src
    command: uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

  # Frontend (Development)
  web:
    build:
      context: ./apps/web
      target: development
    container_name: basketball_togo_web
    ports:
      - "5173:5173"
    networks:
      - basketball_network
    environment:
      VITE_API_URL: http://api:3000/api
    volumes:
      - ./apps/web/src:/app/src
    depends_on:
      - api

volumes:
  postgres_data:
  redis_data:

networks:
  basketball_network:
    driver: bridge
```

---

## 4. BACKEND SETUP (apps/api/)

### package.json

```json
{
  "name": "basketball-api",
  "version": "0.1.0",
  "description": "NestJS API for Basketball Togo Platform",
  "author": "Your Team",
  "license": "MIT",
  "scripts": {
    "prebuild": "rimraf dist",
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "dev": "npm run start:dev",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:push": "prisma db push",
    "prisma:reset": "prisma migrate reset",
    "prisma:seed": "ts-node prisma/seed.ts"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/jwt": "^11.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/swagger": "^7.0.0",
    "@nestjs/throttler": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "bcrypt": "^5.1.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "cloudinary": "^1.33.0",
    "dotenv": "^16.3.0",
    "helmet": "^7.0.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "passport-local": "^1.0.0",
    "redis": "^4.6.0",
    "reflect-metadata": "^0.1.13",
    "rimraf": "^5.0.1",
    "rxjs": "^7.8.0",
    "swagger-ui-express": "^5.0.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/bcrypt": "^5.0.0",
    "@types/express": "^4.17.17",
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0",
    "@types/passport-jwt": "^3.0.8",
    "@types/supertest": "^6.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "jest": "^29.5.0",
    "prettier": "^3.0.0",
    "prisma": "^5.0.0",
    "supertest": "^6.3.3",
    "ts-jest": "^29.1.0",
    "ts-loader": "^9.4.2",
    "ts-node": "^10.9.1",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.0.0"
  }
}
```

### tsconfig.json (Backend)

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "lib": ["ES2020"],
    "declaration": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitAny": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "paths": {
      "@/*": ["src/*"],
      "@config/*": ["src/config/*"],
      "@modules/*": ["src/modules/*"],
      "@common/*": ["src/common/*"],
      "@database/*": ["src/database/*"],
      "@integrations/*": ["src/integrations/*"],
      "@utils/*": ["src/utils/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test", "**/*spec.ts"]
}
```

### .eslintrc.js (Backend)

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
    ],
  },
};
```

---

## 5. FRONTEND SETUP (apps/web/)

### package.json

```json
{
  "name": "basketball-web",
  "version": "0.1.0",
  "description": "React frontend for Basketball Togo Platform",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:cov": "vitest --coverage"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.16.0",
    "zustand": "^4.4.1",
    "axios": "^1.5.0",
    "react-query": "^3.39.3",
    "@tanstack/react-query": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "clsx": "^2.0.0",
    "react-hot-toast": "^2.4.1",
    "date-fns": "^2.30.0",
    "react-hook-form": "^7.47.0",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.0",
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "@heroicons/react": "^2.0.18",
    "lucide-react": "^0.263.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.1.0",
    "vite": "^5.0.0",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "prettier": "^3.0.0",
    "tailwindcss": "^3.3.0",
    "postcss": "^8.4.31",
    "autoprefixer": "^10.4.16",
    "vitest": "^0.34.0",
    "@vitest/ui": "^0.34.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "jsdom": "^22.1.0",
    "playwright": "^1.39.0",
    "@playwright/test": "^1.39.0"
  }
}
```

### vite.config.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@store': path.resolve(__dirname, './src/store'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@styles': path.resolve(__dirname, './src/styles'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api/v1'),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': [
            'react',
            'react-dom',
            'react-router-dom',
            'zustand',
          ],
          'ui': [
            '@heroicons/react',
            'lucide-react',
          ],
        },
      },
    },
  },
})
```

### tsconfig.json (Frontend)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Paths */
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@pages/*": ["src/pages/*"],
      "@hooks/*": ["src/hooks/*"],
      "@store/*": ["src/store/*"],
      "@services/*": ["src/services/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"],
      "@styles/*": ["src/styles/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## 6. AI SERVICE SETUP (apps/ai-service/)

### requirements.txt

```
fastapi==0.103.1
uvicorn[standard]==0.23.2
python-multipart==0.0.6
python-dotenv==1.0.0
Pillow==10.0.0
numpy==1.24.3
scikit-learn==1.3.0
opencv-python==4.8.0.76
requests==2.31.0
pydantic==2.3.0
aiohttp==3.8.5
```

### main.py

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from src.routes import theme_routes, match_routes, recommendation_routes

load_dotenv()

app = FastAPI(
    title="Basketball Togo AI Service",
    description="AI microservice for theme analysis, match summarization, and recommendations",
    version="0.1.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(theme_routes.router, prefix="/api/v1/theme", tags=["Theme"])
app.include_router(match_routes.router, prefix="/api/v1/matches", tags=["Matches"])
app.include_router(recommendation_routes.router, prefix="/api/v1/recommendations", tags=["Recommendations"])

@app.get("/health")
async def health():
    return {"status": "ok", "service": "ai-service"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

## 7. GITHUB ACTIONS CI/CD (.github/workflows/ci.yml)

```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Format check
        run: npx prettier --check "**/*.{ts,tsx,json,md}"

      - name: Type check
        run: npx tsc --noEmit

      - name: Unit tests
        run: npm run test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run npm audit
        run: npm audit --audit-level=moderate

      - name: OWASP Dependency Check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          path: '.'
          format: 'JSON'

  build:
    needs: [lint-and-test, security-scan]
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build API
        run: npm run build --filter=api

      - name: Build Web
        run: npm run build --filter=web

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: |
            apps/api/dist
            apps/web/dist
```

---

## 8. PRETTIER CONFIG (.prettierrc)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

---

## 9. GITIGNORE (.gitignore)

```
# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage
/.nyc_output

# Production
/dist
/build

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Database
*.sqlite
*.sqlite3
.prisma/client

# Cache
.turbo

# Python
__pycache__/
*.py[cod]
*$py.class
.venv
venv/
env/

# OS
Thumbs.db
.AppleDouble
.LSOverride
```

---

## 🚀 COMMANDES POUR DÉMARRER

### 1. Clone et Setup Initial

```bash
# Clone le repo
git clone <repo-url>
cd basketball-togo-platform

# Copier les env files
cp .env.example .env.local

# Installer dépendances monorepo
npm install

# Générer Prisma client
npm run prisma:generate

# Lancer les services Docker
npm run docker:up

# Attendre que les services soient up
sleep 30

# Migrer la database
npm run db:migrate

# Seed la database (optionnel)
npm run db:seed
```

### 2. Démarrer le développement

```bash
# Terminal 1: Tous les services
npm run dev

# OU Terminal séparé pour chaque:
npm run dev:web
npm run dev:api
# Le ai-service démarre via docker-compose
```

### 3. Vérifier que tout fonctionne

```bash
# Frontend
curl http://localhost:5173

# API
curl http://localhost:3000/api/v1/health

# AI Service
curl http://localhost:8000/health

# Database (PgAdmin)
open http://localhost:5050
# Email: admin@example.com
# Password: admin
```

---

## 🔧 TROUBLESHOOTING

### Port already in use
```bash
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>
```

### Database connection error
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# View logs
docker logs basketball_togo_db

# Reset database (CAREFUL!)
npm run prisma:reset
```

### Build errors
```bash
# Clean node_modules
rm -rf node_modules
npm install

# Clear Prisma cache
rm -rf node_modules/.prisma
npm run prisma:generate
```

---

## ✅ PRE-COMMIT CHECKLIST

Avant de committer:

```bash
# Format code
npm run format

# Lint
npm run lint

# Type check
npx tsc --noEmit

# Tests
npm run test

# Build
npm run build
```

ou en une commande:

```bash
npm run lint && npm run format && npm run test && npm run build
```

---

## 📚 DOCUMENTATION LINKS

- NestJS: https://docs.nestjs.com
- Prisma: https://www.prisma.io/docs
- React: https://react.dev
- Vite: https://vitejs.dev
- FastAPI: https://fastapi.tiangolo.com
- TypeScript: https://www.typescriptlang.org/docs

**Tout est prêt pour commencer le développement! 🚀**
