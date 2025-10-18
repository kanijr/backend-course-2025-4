const { program } = require("commander");
const { XMLBuilder } = require("fast-xml-parser");
const fs = require("fs/promises");
const http = require("http");

program
  .requiredOption("-i, --input <path>", "Path to the input JSON file")
  .requiredOption("-h, --host <host>", "Server listen host")
  .requiredOption("-p, --port <number>", "Server listen port");

program.parse();
const options = program.opts();

const inputPath = options.input;

const { port, host } = options;

const server = http.createServer(async (req, res) => {
  try {
    const inputFile = await fs.readFile(inputPath, {
      encoding: "utf8",
      flag: "r",
    });
    const data = JSON.parse(inputFile);

    const fullUrl = new URL(req.url, `http://${host}:${port}`);
    const params = fullUrl.searchParams;
    const hasHumidity = params.get("humidity") === "true";

    let record = data.map(({ Rainfall, Pressure3pm, Humidity3pm }) => {
      const obj = { rainfall: Rainfall, pressure3pm: Pressure3pm };

      if (hasHumidity) obj.humidity = Humidity3pm;
      return obj;
    });

    if (params.has("min_rainfall")) {
      const minRainfall = params.get("min_rainfall");
      record = record.filter(({ rainfall }) => rainfall > minRainfall);
    }

    const xmlBuilder = new XMLBuilder({
      format: true,
    });
    const xmlData = xmlBuilder.build({ weather_data: { record } });

    res.writeHead(200, { "Content-Type": "application/xml" });
    res.end(xmlData);
  } catch (err) {
    if (err.code === "ENOENT") {
      console.error("Cannot find input file");
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Cannot find input file");
    } else {
      console.error("Error:", err.message);
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Server error: " + err.message);
    }
  }
});

server.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}/`);
});
