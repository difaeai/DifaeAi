import http from "node:http";
import { parse } from "node:url";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const port = Number(process.env.PORT ?? 3000);

app
  .prepare()
  .then(() => {
    const server = http.createServer((req, res) => {
      const parsedUrl = parse(req.url ?? "", true);
      handle(req, res, parsedUrl);
    });

    server.listen(port, () => {
      // Hosting platform is responsible for logging readiness.
    });
  })
  .catch((err) => {
    console.error("Error starting server", err);
    process.exit(1);
  });
