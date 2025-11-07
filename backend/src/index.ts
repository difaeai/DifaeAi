import * as dotenv from 'dotenv';
import { createServer } from './server.js';

dotenv.config();

const port = Number(process.env.PORT || 4000);

async function start() {
  const app = createServer();

  app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start backend server', error);
  process.exit(1);
});
