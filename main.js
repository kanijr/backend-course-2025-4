const { program } = require("commander");
const fs = require("fs");
const http = require("http");

program
  .requiredOption("-i, --input <path>", "Path to the input JSON file")
  .requiredOption("-h, --host <host>", "Server host")
  .requiredOption("-p, --port <number>", "Server port");

program.parse();
const options = program.opts();

const inputPath = options.input;

fs.access(inputPath, (err) => {
  if (err) {
    console.log(err.code === "ENOENT" ? "Cannot find input file" : err);
    process.exit(1);
  }
});

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Server is running!\n");
});

const { port, host } = options;

server.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}/`);
});
