import { Router } from "express";
import { createCuenta, getCuentas, getCuentaWithID, changeEstadoCuenta, getMovimientos, createIngreso, createRetirada } from "../controllers/cuentas.controller.js";



const router = Router();


router.post("/", createCuenta);
router.get("/", getCuentas);
router.get("/:id", getCuentaWithID);
router.patch("/:id/estado", changeEstadoCuenta);
router.get("/:id/movimientos", getMovimientos);
router.post("/:id/ingresos", createIngreso);
router.post("/:id/retiradas", createRetirada);



export default router;
