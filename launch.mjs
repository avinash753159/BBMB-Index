import { createServer } from 'vite';
import { exec } from 'child_process';

const server = await createServer({ server: { open: false } });
await server.listen();
const info = server.resolvedUrls.local[0];
console.log(`\n  Dashboard running at: ${info}\n`);
exec(`start "" "${info}"`);
