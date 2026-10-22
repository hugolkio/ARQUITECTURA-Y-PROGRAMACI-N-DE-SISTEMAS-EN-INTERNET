// "Base de datos" en memoria. Se comparte entre todos los módulos
// porque Node cachea los módulos: todos reciben el mismo objeto.
const db = {
  libros: [
    { id: 1, titulo: "Clean Code", autor: "Robert C. Martin", año: 2008, disponible: true },
    { id: 2, titulo: "El Quijote", autor: "Miguel de Cervantes", año: 1605, disponible: true },
    { id: 3, titulo: "Sapiens", autor: "Yuval Noah Harari", año: 2011, disponible: false },
  ],

  prestamos: [
    { id: 1, libroId: 3, usuario: "Ana", fechaPrestamo: "2026-10-01", fechaDevolucion: null },
  ],

  // Contadores independientes: nunca se reutilizan ids de libros borrados
  siguienteLibroId: 4,
  siguientePrestamoId: 2,
};

module.exports = db;