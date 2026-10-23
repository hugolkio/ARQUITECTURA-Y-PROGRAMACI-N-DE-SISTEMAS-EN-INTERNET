const error = (res, status, mensaje) => res.status(status).json({ error: mensaje });

const esTextoValido = (v) => typeof v === "string" && v.trim() !== "";
const esAñoValido = (v) => Number.isInteger(v);


const leerAño = (body) => (body.año !== undefined ? body.año : body.anio);

const hoy = () => new Date().toISOString().slice(0, 10);

module.exports = { error, esTextoValido, esAñoValido, leerAño, hoy };
