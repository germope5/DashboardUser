# User Dashboard (React + Vite + TypeScript)

Proyecto de ejemplo para un pequeño **dashboard de usuarios** construido con React, Vite y TypeScript.
Se consumen datos de la API pública `https://jsonplaceholder.typicode.com/users` y se muestran en una lista filtrable.

## Requisitos

- Node.js 20.19+ o 22.12+ (recomendado por Vite)
- npm (gestor de paquetes)

## Instalación

```bash
npm install
```

## Scripts disponibles

- `npm run dev`  
  Levanta el servidor de desarrollo de Vite.

- `npm run build`  
  Genera el build de producción. Ejecuta primero `tsc -b` para validar los tipos y luego `vite build`.

- `npm run preview`  
  Sirve localmente el build de producción generado en `dist/`.

- `npm run lint`  
  Ejecuta ESLint sobre el código fuente.

## Estructura principal

- `src/main.tsx`  
  Punto de entrada de la aplicación; monta el árbol de React en el DOM.

- `src/App.tsx`  
  Componente raíz de la aplicación.

- `src/UserDashboard.tsx`  
  Componente que contiene la lógica del dashboard de usuarios (fetch de datos, filtro, listado, etc.).

## Notas sobre tipado en `UserDashboard.tsx`

El archivo `src/UserDashboard.tsx` se ha mantenido **sin modificar su lógica**, pero:

- Se añadió la directiva `// @ts-nocheck` al principio del archivo para desactivar la comprobación de tipos solo en ese componente.
- De esta forma, se evita que TypeScript marque errores de tipado derivados de inferencias estrictas (por ejemplo, arrays inferidos como `never[]`), sin alterar el comportamiento del componente.

Si en el futuro se quisieran tipos estrictos en ese componente, se podría:

1. Eliminar `// @ts-nocheck`.
2. Definir una interfaz `User` con las propiedades que devuelve la API (`id`, `name`, `email`, etc.).
3. Tipar adecuadamente los estados (`useState<User[]>`, `useState<User[] | null>`, etc.) y las props del componente hijo `UserItem`.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
