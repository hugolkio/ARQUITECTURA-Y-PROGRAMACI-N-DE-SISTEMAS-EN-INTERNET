const db = require("../data/db");

function obtener(req, res) {
  const total = db.libros.length;
  const disponibles = db.libros.filter((l) => l.disponible).length;

  const conteo = {};
  for (const l of db.libros) conteo[l.autor] = (conteo[l.autor] || 0) + 1;

  let autorConMasLibros = null;
  for (const [autor, cantidad] of Object.entries(conteo)) {
    if (!autorConMasLibros || cantidad > autorConMasLibros.cantidad) {
      autorConMasLibros = { autor, cantidad };
    }
  }

  res.status(200).json({
    totalLibros: total,
    disponibles,
    prestados: total - disponibles,
    autorConMasLibros,
  });
}

module.exports = { obtener };
