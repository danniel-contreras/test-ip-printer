const https = require("https");
const fs = require("fs");
const app = require("express")();
const cors = require("cors");

const { EscPos } = require("@tillpos/xml-escpos-helper");
const connectToPrinter = require("./connectToPrinter");
const { table, getBorderCharacters } = require("table");

/**
 *
 * @params template - the xml template
 * @params data - the dynamic data which ever to be printed
 *
 * @returns bytes - buffers stream
 */
const generateBuffer = (template, data) => {
  // Will add implementation here to generate buffer
  return EscPos.getBufferFromTemplate(template, data);
};

/**
 *
 * @params host - printer IP address
 * @params port - printer port
 * @params message - the buffer stream generated from `generateBuffer` function
 *
 * @return void
 */
const sendMessageToPrinter = async (host, port, message) => {
  try {
    await connectToPrinter(host, port, message);
  } catch (err) {
    console.log("some error", err);
  }
};

const options = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("certificate.pem"),
};

app.use(
  cors({
    origin: ["http://localhost:5173","http://localhost:5174", "https://coffee-place-sv.netlify.app"],
  })
);

https.createServer(options, app).listen(3000, () => {
  console.log("Listening on port 3000");
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/print", async (_, res) => {
  try {
    const template = fs.readFileSync("./ticket.xml", { encoding: "utf8" });

    const PRINTER = {
      device_name: "SEEDCODE",
      host: "192.168.0.100",
      port: 9100,
    };

    const versions = [
      ["Producto", "Precio", "Descuento", "Total"],
      ["Producto A", "10.00", "1.00", "9.00"],
      ["Producto B", "20.00", "2.00", "18.00"],
      ["Producto C", "30.00", "3.00", "27.00"],
    ];

    const tableData = table(versions, {
      border: getBorderCharacters("void"),
      drawHorizontalLine: () => true,
      columns: {
        0: { width: 15 }, // Ajusta el ancho de la columna "Producto"
        1: { width: 10 }, // Ajusta el ancho de la columna "Precio"
        2: { width: 10 }, // Ajusta el ancho de la columna "Descuento"
        3: { width: 10 }, // Ajusta el ancho de la columna "Total"
      },
      columnDefault: {
        wrapWord: true,
        paddingLeft: 0,
        paddingRight: 1,
      },
    });

    const sampleInputData = {
      title: "Hello World!",
      date: "07-08-2021",
      product1: "Cappuccino",
      price1: "10.00",
      discount1: "0.00",
      total1: "10.00",
      product2: "Latte",
      price2: "12.00",
      discount2: "0.00",
      total2: "12.00",
    };
    const message = generateBuffer(template, { tableData });
    await sendMessageToPrinter(PRINTER.host, PRINTER.port, message);

    res.send("success");
  } catch (err) {
    console.log(err);
    res.send("failed");
  }
});
