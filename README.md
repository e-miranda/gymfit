# FitMaster AI & Algorithmic Gym Platform

Plataforma integral de gestión y entrenamiento inteligente para gimnasios con soporte multi-rol (**Atleta**, **Entrenador** y **Administrador**), generación de rutinas biomecánicas diferenciadas por sexo (2 a 6 días), cálculo clínico de IMC, modo enfoque activo en gimnasio, gráficas de progreso 1RM y tienda flash de suplementos con notificaciones ocasionales.

## Características principales

- **Multi-rol:** Vistas independientes para **Atleta** (simulador móvil / web), **Entrenador (Head Coach)** y **Administrador**.
- **Rutinas adaptativas (2 a 6 días):** Motor híbrido con **Google Gemini AI** y respaldo algorítmico local que filtra ejercicios según lesiones activas (`lesion_rodilla`, `molestia_hombro`, `lumbar`), objetivo y biomecánica por sexo (incluyendo Día 5 y Día 6).
- **Perfil antropométrico e IMC:** Registro de peso y altura con clasificación detallada OMS (Delgadez Severa/Moderada/Aceptable, Normopeso, Sobrepeso y Obesidad Clase I, II y III).
- **Modo Enfoque Activo & Gamificación:** Cronómetro de descanso, registro de peso/RPE, estimación de 1RM, mapa de consistencia y sistema de estrellas por niveles.
- **Tienda de Suplementos & Ofertas Flash:** Catálogo promocional (Creatina Creapure®, Whey Isolate, Pre-Workout, Recuperación Nocturna, BCAA) con apartado en mostrador, código de retiro y notificaciones flash periódicas.

## Requisitos previos

- **Node.js** `20+` (recomendado `22.x`)
- **npm** `10+`
- Una clave de API de Google Gemini (`GEMINI_API_KEY`) — opcional (si no se define, el sistema usa automáticamente el motor algorítmico local).

## Instalación y ejecución local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/TU_USUARIO/fitmaster-gym-platform.git
   cd fitmaster-gym-platform
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   Copia `.env.example` a `.env` y completa tus credenciales (el archivo `.env` está ignorado en `.gitignore` para no exponer secretos):
   ```bash
   cp .env.example .env
   ```
   Variables en `.env`:
   ```env
   GEMINI_API_KEY="tu_api_key_de_gemini"
   APP_URL="http://localhost:3000"
   ```

4. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

5. **Compilar y ejecutar en producción:**
   ```bash
   npm run lint
   npm run build
   NODE_ENV=production npm start
   ```

## Scripts disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia Vite con el middleware de API en el puerto `3000`. |
| `npm run dev:server` | Inicia el servidor Express (`server.ts`) en modo desarrollo con `tsx`. |
| `npm run lint` | Verifica tipos de TypeScript (`tsc --noEmit`). |
| `npm run build` | Genera el bundle de producción en `dist/`. |
| `npm start` | Ejecuta el servidor de producción (`node server.ts`). |

## Cómo publicar en GitHub

1. Crea un nuevo repositorio vacío en [GitHub](https://github.com/new) (sin README ni `.gitignore`, ya están incluidos).
2. Inicializa Git y sube el código:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit FitMaster Gym Platform"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   git push -u origin main
   ```
3. **GitHub Actions (CI):** El flujo `.github/workflows/ci.yml` ejecutará automáticamente `npm run lint` y `npm run build` en cada `push` o `pull_request` a `main`.
4. **Despliegue externo (opcional):** Puedes conectar este repositorio a **Render**, **Railway**, **Fly.io** o **Google Cloud Run** usando:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `NODE_ENV=production npm start`
   - **Variables de entorno:** `GEMINI_API_KEY` (si usas IA generativa) y `NODE_ENV=production`.
