# 📚 API de Biblioteca (TypeScript)

API REST para la gestión de una biblioteca, desarrollada con Node.js, Express y TypeScript.

## Requisitos previos
- Node.js 20 o superior
- npm

## Instalación
```bash
npm install
```

## Ejecución
```bash
# Desarrollo (recarga automática al guardar)
npm run dev

# Producción
npm run build
npm start

# Solo comprobar tipos
npm run typecheck
```
El servidor queda disponible en http://localhost:3000.

## Estructura
```
src/
├── server.ts            # Punto de entrada
├── app.ts               # Configuración de Express y middlewares globales
├── types/index.ts       # Interfaces (Libro, Prestamo, Db) y tipado de req.libro
├── data/db.ts           # Almacenamiento en memoria
├── routes/              # Rutas y métodos HTTP
├── controllers/         # Lógica de cada endpoint
├── middlewares/         # cargarLibro, notFound, errorHandler
└── utils/helpers.ts     # Validaciones (type guards) y utilidades
```

## Endpoints
| Método | Ruta | Descripción |
|---|---|---|
| GET | /libros | Listar libros |
| POST | /libros | Crear libro (`titulo`, `autor`, `año`) |
| GET | /libros/:id | Obtener libro |
| PUT | /libros/:id | Reemplazar libro |
| PATCH | /libros/:id | Modificar campos |
| DELETE | /libros/:id | Borrar (solo si no está prestado) |
| GET | /libros/:id/prestamos | Historial del libro |
| POST | /libros/:id/prestar | Prestar (`usuario`, máx. 2 activos) |
| POST | /libros/:id/devolver | Devolver |
| GET | /prestamos | Listar préstamos |
| GET | /estadisticas | Estadísticas |

Los datos viven en memoria y se pierden al reiniciar.
