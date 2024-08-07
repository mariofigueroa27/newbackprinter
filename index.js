const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const sql = require("mssql");

app.use(cors());
// Configuración de conexión a la base de datos
const config = { 
  user: "operador",
  password: "Fabrica2024$",
  server: "srvcsmp003.database.windows.net",
  database: "csmpbd03",
  options: {
    trustServerCertificate: true, // Cambia a false si no estás usando TLS
  },
};

// Middleware para parsear el cuerpo de las solicitudes
app.use(bodyParser.json());

// Ruta para obtener todas las naves espaciales
app.get("/api/ships", async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query("SELECT * FROM dbo.hu_ship");
    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener naves espaciales:", err.message);
    res.status(500).send("Error del servidor");
  } finally {
    sql.close();
  }
});

// Ruta para obtener las últimas 10 órdenes de servicio
app.get("/api/service-orders", async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query(
      "SELECT * FROM dbo.hu_service_order ORDER BY registered_at DESC"
    );
    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener las órdenes de servicio:", err.message);
    res.status(500).send("Error del servidor");
  } finally {
    sql.close();
  }
});

// Ruta para obtener los viajes de una nave espacial específica
app.get("/api/:idship/travels", async (req, res) => {
  const idShip = req.params.idship;
  try {
    await sql.connect(config);
    const result = await sql.query(
      `SELECT * FROM dbo.hu_travel WHERE ship_id = ${idShip}`
    );
    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener los viajes:", err.message);
    res.status(500).send("Error del servidor");
  } finally {
    sql.close();
  }
});

// Ruta para obtener los vehículos de un viaje específico
app.get("/api/:travel_id/:service_order_id/vehicles", async (req, res) => {
  const { travel_id, service_order_id, vehicle_id } = req.params;
  try {
    await sql.connect(config);
    const result = await sql.query(
      `SELECT o.*, v.labelled_date
      FROM dbo.operacion_roro o
      INNER JOIN dbo.hu_vehicle v ON o.vehicle_id = v.id
      WHERE o.travel_id = ${travel_id} AND o.service_order_id = ${service_order_id}`
    );
    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener los vehículos:", err.message);
    res.status(500).send("Error del servidor");
  } finally {
    sql.close();
  }
});

/*
// Ruta para el método PUT
app.put("/api/actualizar-vehiculos", async (req, res) => {
  try {
    // Lista de IDs recibida en la solicitud
    const listaIds = req.body.ids;

    // Conexión a la base de datos
    await sql.connect(config);

    // Iterar sobre la lista de IDs y actualizar los registros correspondientes en la base de datos
    for (const id of listaIds) {
      const result =
        await sql.query`UPDATE dbo.hu_vehicle SET labelled_date = GETDATE() WHERE id = ${id}`;
      console.log(
        `Registros actualizados para el ID ${id}: ${result.rowsAffected}`
      );
    }

    // Cerrar la conexión a la base de datos
    await sql.close();

    res.send("Registros actualizados correctamente");
  } catch (error) {
    console.error("Error al actualizar los registros:", error.message);
    res.status(500).send("Error al actualizar los registros");
  }
});
*/

// Ruta para el método PUT
app.put("/api/actualizar-vehiculos", async (req, res) => {
  try {
    // Lista de IDs recibida en la solicitud
    const listaIds = req.body.ids;

    // Tamaño del lote para procesamiento por partes
    const batchSize = 10; // Ajusta según tu caso
    const totalBatches = Math.ceil(listaIds.length / batchSize);

    // Conexión a la base de datos
    await sql.connect(config);

    // Función para actualizar un lote de IDs
    const actualizarLote = async (ids) => {
      // Convertir la lista de IDs en una cadena separada por comas
      const idsString = ids.join(",");
      const query = `UPDATE dbo.hu_vehicle SET labelled_date = GETDATE() WHERE id IN (${idsString})`;
      const result = await sql.query(query);
      console.log(`Registros actualizados para los IDs ${idsString}: ${result.rowsAffected}`);
    };

    // Procesar los IDs en lotes
    for (let i = 0; i < totalBatches; i++) {
      const batch = listaIds.slice(i * batchSize, (i + 1) * batchSize);
      await actualizarLote(batch);
    }

    // Cerrar la conexión a la base de datos
    await sql.close();

    res.send("Registros actualizados correctamente");
  } catch (error) {
    console.error("Error al actualizar los registros:", error.message);
    res.status(500).send("Error al actualizar los registros");
  }
});

// Puerto en el que se ejecutará el servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
