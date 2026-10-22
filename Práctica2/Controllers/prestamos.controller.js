const db = require("../data/db");
const { error, esTextoValido, hoy } = require("../utils/helpers");

const MAX_PRESTAMOS_POR_USUARIO = 2;

function listar(req, res) {
  res.status(200).json(db.prestamos);
}

function historialDeLibro(req, res) {
  res.status(200).json(db.prestamos.filter((p) => p.libroId === req.libro.id));
}

function prestar(req, res) {
  const { usuario } = req.body || {};
  const libro = req.libro;

  if (!esTextoValido(usuario)) {
    return error(res, 400, "El campo usuario es obligatorio y debe ser un texto no vacío");
  }
  if (!libro.disponible) {
    return error(res, 409, "El libro ya está prestado");
  }

  const nombre = usuario.trim();
  const activos = db.prestamos.filter(
    (p) => p.usuario.toLowerCase() === nombre.toLowerCase() && p.fechaDevolucion === null
  ).length;
  if (activos >= MAX_PRESTAMOS_POR_USUARIO) {
    return error(
      res,
      409,
      `${nombre} ya tiene ${MAX_PRESTAMOS_POR_USUARIO} libros prestados (límite alcanzado)`
    );
  }

  const prestamo = {
    id: db.siguientePrestamoId++,
    libroId: libro.id,
    usuario: nombre,
    fechaPrestamo: hoy(),
    fechaDevolucion: null,
  };
  db.prestamos.push(prestamo);
  libro.disponible = false;
  res.status(201).json(prestamo);
}

function devolver(req, res) {
  const libro = req.libro;

  if (libro.disponible) {
    return error(res, 409, "El libro no está prestado, no se puede devolver");
  }

  const prestamo = db.prestamos.find((p) => p.libroId === libro.id && p.fechaDevolucion === null);
  if (!prestamo) {
    return error(res, 404, "No se encontró un préstamo activo para este libro");
  }

  prestamo.fechaDevolucion = hoy();
  libro.disponible = true;
  res.status(200).json(prestamo);
}

module.exports = { listar, historialDeLibro, prestar, devolver };
