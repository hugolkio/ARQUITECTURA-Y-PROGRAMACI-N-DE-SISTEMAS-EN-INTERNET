import express from "express";
import librosRoutes from "./routes/libros.routes.js";
import prestamosRoutes from "./routes/prestamos.routes.js";
import estadisticasRoutes from "./routes/estadisticas.routes.js";


const app = express();

app.use(express.json()); //middleware

app.use("/libros", librosRoutes);
app.use("/prestamos", prestamosRoutes);
app.use("/estadisticas", estadisticasRoutes);

app.listen(3001, () => {
    console.log("Api de biblioteca funcionando en el puerto 3001")
})
