import { startStandaloneServer } from '@apollo/server/standalone';
import { abrirRepositorio, crearServidor } from './servidor.js';

const repo = abrirRepositorio();
const servidor = crearServidor();

const { url } = await startStandaloneServer(servidor, {
  listen: { port: Number(process.env.PORT ?? 4000) },
  context: async () => ({ repo }),
});

console.log(`API GraphQL de Pulso lista en ${url}`);
