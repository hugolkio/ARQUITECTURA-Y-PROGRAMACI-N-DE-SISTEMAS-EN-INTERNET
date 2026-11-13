# API REST bancaria con MongoDB

API para gestionar clientes, cuentas y movimientos de un banco (Express + MongoDB + TypeScript).
Todos los importes son enteros en céntimos (12,50 € = 1250).

## Requisitos

- Node.js 20.6 o superior (el `.env` se carga con `--env-file`)
- npm
- Una base de datos MongoDB (local o en Atlas)

## Configuración del `.env`

Copia el ejemplo y rellénalo:

```bash
cp .env.example .env
```

```
PORT=3001
MONGO_URI=mongodb://localhost:27017/
```

- `PORT`: puerto en el que escucha la API.
- `MONGO_URI`: cadena de conexión a MongoDB. La base de datos se llama `Banco`.

El `.env` no se sube al repositorio (está en `.gitignore`).

## Cómo levantar MongoDB

**Opción A: con Docker**

```bash
docker run -d --name mongo-banco -p 27017:27017 mongo:7
```

y usar `MONGO_URI=mongodb://localhost:27017/`.

**Opción B: MongoDB instalado en local**

Arranca `mongod` y usa la misma `MONGO_URI` de arriba.

**Opción C: MongoDB Atlas**

Crea un clúster gratuito y pon su cadena de conexión (`mongodb+srv://...`) en `MONGO_URI`.

Al arrancar, la API crea los índices únicos de `clientes.email`, `clientes.dni` y `cuentas.iban`.

## Instalar dependencias

```bash
npm install
```

## Arrancar el servidor

```bash
npm run dev
```

La API queda disponible en `http://localhost:3001` (o el puerto que hayas puesto en `PORT`).

## Endpoints

| Método | Ruta                       | Descripción                         |
|--------|----------------------------|-------------------------------------|
| POST   | `/clientes`                | Alta de cliente                     |
| GET    | `/clientes`                | Lista clientes (paginación)         |
| GET    | `/clientes/:id`            | Devuelve un cliente                 |
| PATCH  | `/clientes/:id`            | Modifica nombre o email             |
| POST   | `/cuentas`                 | Alta de cuenta (IBAN generado)      |
| GET    | `/cuentas`                 | Lista cuentas (filtros y paginación)|
| GET    | `/cuentas/:id`             | Cuenta con nombre y email del titular |
| PATCH  | `/cuentas/:id/estado`      | Cambia el estado de la cuenta       |
| GET    | `/cuentas/:id/movimientos` | Extracto con filtros y paginación   |
| POST   | `/cuentas/:id/ingresos`    | Ingresa dinero                      |
| POST   | `/cuentas/:id/retiradas`   | Retira dinero                       |
| POST   | `/transferencias`          | Transferencia entre dos cuentas (por IBAN) |
