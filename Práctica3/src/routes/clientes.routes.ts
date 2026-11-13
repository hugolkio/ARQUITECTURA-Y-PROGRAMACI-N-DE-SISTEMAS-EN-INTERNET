import { Router } from "express";
import { getClientes, getClienteWithID, createCliente, changeCliente } from "../controllers/clientes.controller.js";



const router = Router();


router.get("/", getClientes);
router.get("/:id", getClienteWithID);
router.post("/", createCliente);
router.patch("/:id", changeCliente);



export default router;
