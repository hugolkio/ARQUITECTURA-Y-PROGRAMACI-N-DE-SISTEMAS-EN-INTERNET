# API de Biblioteca (estilo 02APIcomponetize)

API REST con Express + TypeScript. Datos en memoria (se pierden al reiniciar).

## Ejecución
```bash
npm install
npm run dev        # http://localhost:3001
npm run typecheck
```

## Estructura
```
src/
├── index.ts                         # Arranque de Express y montaje de rutas
├── models/libros.model.ts           # Tipos LibroT y PrestamoT
├── data/libros.data.ts              # Arrays en memoria + changeLibros / changePrestamos
├── routes/                          # libros, prestamos, estadisticas
└── controllers/                     # Lógica de cada endpoint
```

## Endpoints
| Método | Ruta | Descripción |
|---|---|---|
| GET | /libros | Listar libros |
| POST | /libros | Crear (`titulo`, `autor`, `año`) |
| GET | /libros/:id | Obtener |
| PUT | /libros/:id | Reemplazar |
| PATCH | /libros/:id | Modificar campos |
| DELETE | /libros/:id | Borrar (solo si no está prestado) |
| GET | /libros/:id/prestamos | Historial del libro |
| POST | /libros/:id/prestar | Prestar (`usuario`, máx. 2 activos) |
| POST | /libros/:id/devolver | Devolver |
| GET | /prestamos | Listar préstamos |
| GET | /estadisticas | Estadísticas |
