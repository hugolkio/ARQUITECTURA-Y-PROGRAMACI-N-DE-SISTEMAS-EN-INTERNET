const { Router } = require("express");
const prestamos = require("../controllers/prestamos.controller");

const router = Router();

router.get("/", prestamos.listar);

module.exports = router;
