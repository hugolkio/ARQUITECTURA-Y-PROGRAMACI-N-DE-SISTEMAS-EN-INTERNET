const db = require("../data/db");
const { error, esTextoValido, esAñoValido, leerAño } = require("../utils/helpers");

const existeDuplicado = (titulo, autor, ignorarId = null) =>
  db.libros.some(
    (l) =>
      l.id !== ignorarId &&
      l.titulo.trim().toLowerCase() === titulo.trim().toLowerCase() &&
      l.autor.trim().toLowerCase() === autor.trim().toLowerCase()
  );

function listar(req, res) {
  res.status(200).json(db.libros);
}

function obtener(req, res) {
  res.status(200).json(req.libro);
}

function crear(req, res) {
  const body = req.body || {};
  const { titulo, autor } = body;
  const año = leerAño(body);

  if (!esTextoValido(titulo) || !esTextoValido(autor) || año === undefined) {
    return error(res, 400, "Los campos titulo, autor y año son obligatorios");
  }
  if (!esAñoValido(año)) {
    return error(res, 400, "El año debe ser un número entero");
  }
  if (existeDuplicado(titulo, autor)) {
    return error(res, 409, "Ya existe un libro con el mismo título y autor");
  }

  const nuevo = {
    id: db.siguienteLibroId++,
    titulo: titulo.trim(),
    autor: autor.trim(),
    año,
    disponible: true,
  };
  db.libros.push(nuevo);
  res.status(201).json(nuevo);
}

// PUT: reemplazo completo (todos los campos obligatorios).
// "disponible" lo gestionan /prestar y /devolver, por lo que se ignora aquí.
function reemplazar(req, res) {
  const body = req.body || {};
  const { titulo, autor } = body;
  const año = leerAño(body);
  const libro = req.libro;

  if (body.id !== undefined && body.id !== libro.id) {
    return error(res, 400, "No se puede modificar el id de un libro");
  }
  if (!esTextoValido(titulo) || !esTextoValido(autor) || año === undefined) {
    return error(res, 400, "PUT requiere los campos titulo, autor y año");
  }
  if (!esAñoValido(año)) {
    return error(res, 400, "El año debe ser un número entero");
  }
  if (existeDuplicado(titulo, autor, libro.id)) {
    return error(res, 409, "Ya existe otro libro con el mismo título y autor");
  }

  libro.titulo = titulo.trim();
  libro.autor = autor.trim();
  libro.año = año;
  res.status(200).json(libro);
}

// PATCH: solo los campos enviados
function modificar(req, res) {
  const body = req.body || {};
  const libro = req.libro;

  if (body.id !== undefined && body.id !== libro.id) {
    return error(res, 400, "No se puede modificar el id de un libro");
  }

  const nuevoAño = leerAño(body);
  const hayCambios =
    body.titulo !== undefined || body.autor !== undefined || nuevoAño !== undefined;
  if (!hayCambios) {
    return error(res, 400, "Debes enviar al menos un campo: titulo, autor o año");
  }

  if (body.titulo !== undefined && !esTextoValido(body.titulo)) {
    return error(res, 400, "El titulo debe ser un texto no vacío");
  }
  if (body.autor !== undefined && !esTextoValido(body.autor)) {
    return error(res, 400, "El autor debe ser un texto no vacío");
  }
  if (nuevoAño !== undefined && !esAñoValido(nuevoAño)) {
    return error(res, 400, "El año debe ser un número entero");
  }

  const titulo = body.titulo !== undefined ? body.titulo.trim() : libro.titulo;
  const autor = body.autor !== undefined ? body.autor.trim() : libro.autor;

  if (existeDuplicado(titulo, autor, libro.id)) {
    return error(res, 409, "Ya existe otro libro con el mismo título y autor");
  }

  libro.titulo = titulo;
  libro.autor = autor;
  if (nuevoAño !== undefined) libro.año = nuevoAño;
  res.status(200).json(libro);
}

function borrar(req, res) {
  if (!req.libro.disponible) {
    return error(res, 409, "No se puede borrar un libro que está prestado");
  }
  // splice modifica el array original (importante porque se comparte vía db)
  const indice = db.libros.findIndex((l) => l.id === req.libro.id);
  db.libros.splice(indice, 1);
  res.status(204).send();
}

module.exports = { listar, obtener, crear, reemplazar, modificar, borrar };
