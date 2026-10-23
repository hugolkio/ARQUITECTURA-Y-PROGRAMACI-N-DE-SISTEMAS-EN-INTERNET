const { Router } = require("express");
const estadisticas = require("../controllers/estadisticas.controller");

const router = Router();

router.get("/", estadisticas.obtener);

module.exports = router;
