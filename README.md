📚 API de Biblioteca

API REST para la gestión de una biblioteca, desarrollada con Node.js y Express.

✅ Requisitos previos
🟢 Node.js 18.11 o superior
📦 npm
🚀 Instalación
bash
npm install
▶️ Ejecución
bash
# Producción
npm start

# Desarrollo (recarga automática al guardar cambios)
npm run dev

🌐 Una vez iniciado, el servidor queda disponible en http://localhost:3000.

🗂️ Estructura del proyecto
src/
├── server.js            # Punto de entrada: inicia el servidor
├── app.js               # Configuración de Express y middlewares globales
├── data/
│   └── db.js            # Almacenamiento en memoria y contadores de id
├── routes/              # Definición de rutas y métodos HTTP
├── controllers/         # Lógica de negocio de cada endpoint
├── middlewares/         # cargarLibro, notFound, errorHandler
└── utils/
    └── helpers.js       # Validaciones y funciones auxiliares
🏗️ Arquitectura

El proyecto sigue una separación por capas:

Capa	Responsabilidad
🛣️ Routes	Mapean URLs y métodos HTTP a su controlador
🧠 Controllers	Contienen la lógica de negocio de cada endpoint
🛡️ Middlewares	Gestionan la carga de recursos, rutas inexistentes y errores
💾 Data	Persistencia en memoria (los datos se pierden al reiniciar el servidor)
🔧 Utils	Validaciones y utilidades compartidas
📝 Notas
⚠️ Los datos se almacenan en memoria, por lo que no persisten entre reinicios.
🚨 El middleware errorHandler centraliza la gestión de errores y notFound responde a rutas no definidas.
