const { error } = require("../utils/helpers");

function notFound(req, res) {
  error(res, 404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`);
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.type === "entity.parse.failed") {
    return error(res, 400, "El body no es un JSON válido");
  }
  console.error(err);
  error(res, 500, "Error interno del servidor");
}

module.exports = { notFound, errorHandler };