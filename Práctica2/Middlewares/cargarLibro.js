const db = require("../data/db");
const { error } = require("../utils/helpers");

// Valida :id y carga el libro en req.libro
function cargarLibro(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return error(res, 400, "El id debe ser un número entero");

  const libro = db.libros.find((l) => l.id === id);
  if (!libro) return error(res, 404, `No existe un libro con id ${id}`);

  req.libro = libro;
  next();
}

module.exports = cargarLibro;