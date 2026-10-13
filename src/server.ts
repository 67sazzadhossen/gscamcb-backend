import { Server } from 'node:http';
import app from './app';
import config from './app/config';
import { prisma } from '../prisma/lib/prisma';
let server: Server | undefined;
let shuttingDown = false;
const shutdown = (exitCode: number) => {
  if (shuttingDown) return;
  shuttingDown = true;
  const timeout = setTimeout(() => process.exit(1), 10_000);
  timeout.unref();
  const disconnect = async () => {
    try {
      await prisma.$disconnect();
      process.exit(exitCode);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  };
  if (server)
    server.close(() => {
      void disconnect();
    });
  else void disconnect();
};
process.on('SIGTERM', () => shutdown(0));
process.on('SIGINT', () => shutdown(0));
process.on('unhandledRejection', (error) => {
  console.error(error);
  shutdown(1);
});
process.on('uncaughtException', (error) => {
  console.error(error);
  shutdown(1);
});
async function main() {
  await prisma.$connect();
  if (shuttingDown) return;
  server = app.listen(config.port, () =>
    console.log(`App listening on port ${config.port}`),
  );
  server.on('error', (error) => {
    console.error(error);
    shutdown(1);
  });
}
main().catch((error: unknown) => {
  console.error('Server startup failed:', error);
  shutdown(1);
});
