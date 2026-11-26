import { Router } from "express"; //mini servidor donde agrupa rutas
import { createLibro, deleteLibro, getLibros, getLibroWithID, replaceLibro, changeLibro } from "../controllers/libros.controller.js";
import { devolverLibro, getHistorialLibro, prestarLibro } from "../controllers/prestamos.controller.js";


const router = Router();


router.get("/", getLibros);
router.post("/", createLibro);
router.get("/:id", getLibroWithID);
router.put("/:id", replaceLibro);
router.patch("/:id", changeLibro);
router.delete("/:id", deleteLibro);

router.get("/:id/prestamos", getHistorialLibro);
router.post("/:id/prestar", prestarLibro);
router.post("/:id/devolver", devolverLibro);


export default router;
