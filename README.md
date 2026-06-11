# 🎌 AnimeHub

Aplicación web para descubrir, buscar y organizar anime. Permite explorar los estrenos de la temporada actual, buscar por título, ver rankings por género y gestionar listas personales (favoritos, visto y pendiente) con cuenta de usuario.

![Angular](https://img.shields.io/badge/Angular-21-dd0031?logo=angular)
![Firebase](https://img.shields.io/badge/Firebase-12-ffca28?logo=firebase)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript)

🌐 **[Ver en vivo → anime-hub-fa95f.web.app](https://anime-hub-fa95f.web.app)**

---

## ✨ Funcionalidades

| Sección | Descripción |
|---|---|
| 🏠 **Home** | Anime de la temporada actual con búsqueda rápida |
| 🔍 **Búsqueda** | Búsqueda por título con filtro por tipo (TV / Película) |
| 🏆 **Rankings** | Top anime filtrado por 13 géneros |
| 📋 **Detalle** | Info completa: sinopsis, personajes, plataformas de streaming |
| ⭐ **Favoritos** | Lista personal de favoritos (requiere login) |
| 👤 **Cuenta** | Dashboard con estadísticas y agenda semanal de emisión |

## 🛠️ Stack

- **Frontend:** Angular 21 con Standalone Components y Signals
- **Backend / Auth:** Firebase (Firestore + Google OAuth)
- **API de datos:** [Jikan API v4](https://jikan.moe/) (base de datos de MyAnimeList)
- **Tests:** Vitest
- **Formato:** Prettier

## 🚀 Instalación local

### Prerrequisitos

- Node.js 20+
- Angular CLI: `npm install -g @angular/cli`
- Una cuenta en [Firebase](https://console.firebase.google.com/)

### Pasos

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/anime-hub.git
   cd anime-hub
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Configura Firebase**

   Crea tu proyecto en [Firebase Console](https://console.firebase.google.com/) y activa:
   - **Authentication** → proveedor Google
   - **Firestore Database**

   Copia el archivo de ejemplo y rellena con tus credenciales:
   ```bash
   cp src/environments/environment.example.ts src/environments/environment.ts
   ```
   Abre `environment.ts` y pega los datos de tu app de Firebase.

4. **Arranca el servidor de desarrollo**
   ```bash
   ng serve
   ```
   Abre [http://localhost:4200](http://localhost:4200)

## 🧪 Tests

```bash
ng test
```

## 📁 Estructura del proyecto

```
src/
├── app/
│   ├── components/       # Componentes de página y UI
│   │   ├── landing/      # Pantalla de inicio animada
│   │   ├── home/         # Temporada actual
│   │   ├── search/       # Búsqueda con filtros
│   │   ├── anime-detail/ # Detalle de un anime
│   │   ├── rankings/     # Top por género
│   │   ├── favorites/    # Lista de favoritos del usuario
│   │   ├── account/      # Perfil y estadísticas
│   │   └── anime-card/   # Tarjeta reutilizable
│   ├── services/         # Lógica de negocio y acceso a datos
│   │   ├── jikan-api.ts  # Cliente de la API de anime
│   │   ├── auth.ts       # Autenticación Firebase
│   │   ├── favorites.ts  # Colección de favoritos en Firestore
│   │   ├── watched.ts    # Anime visto
│   │   └── watchlater.ts # Anime pendiente
│   ├── app.routes.ts     # Definición de rutas
│   └── app.config.ts     # Configuración de providers
└── environments/
    └── environment.example.ts  # Plantilla de configuración
```

## 📄 Licencia

MIT
