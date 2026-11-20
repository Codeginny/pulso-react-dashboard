import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { ApolloServer } from '@apollo/server';
import Database from 'better-sqlite3';
import { responder } from './asistente.js';
import { crearRepositorio, FILTROS_POR_DEFECTO, type Filtros, type OrdenClientes, type Region, type Repositorio } from './repositorio.js';
import { typeDefs } from './schema.js';

export interface Contexto {
  repo: Repositorio;
}

/** Busca data/pulso.db desde la raíz del repo o desde api/. */
export function rutaBaseDeDatos(): string {
  if (process.env.PULSO_DB) return process.env.PULSO_DB;
  const candidata = ['data/pulso.db', '../data/pulso.db'].map((r) => resolve(process.cwd(), r)).find(existsSync);
  if (!candidata) throw new Error('No encuentro data/pulso.db. Corré `npm run datos` o definí PULSO_DB.');
  return candidata;
}

export function abrirRepositorio(ruta = rutaBaseDeDatos()): Repositorio {
  return crearRepositorio(new Database(ruta, { readonly: true, fileMustExist: true }));
}

const filtros = (f?: Partial<Filtros> | null): Filtros => ({ ...FILTROS_POR_DEFECTO, ...f });

export const resolvers = {
  Query: {
    periodos: (_: unknown, __: unknown, { repo }: Contexto) => repo.periodos(),
    resumen: (_: unknown, args: { filtros?: Filtros }, { repo }: Contexto) => {
      const f = filtros(args.filtros);
      return { periodo: repo.infoPeriodo(f.periodo), kpis: repo.kpis(f), serie: repo.serie(f) };
    },
    segmentos: (_: unknown, { region }: { region: Region }, { repo }: Contexto) => repo.segmentos(region),
    clientes: (
      _: unknown,
      args: { region: Region; segmento?: string; busqueda?: string; orden: OrdenClientes; pagina: number; porPagina: number },
      { repo }: Contexto,
    ) => repo.clientes(args),
    cohortes: (_: unknown, a: { region: Region; desde: string; limite: number }, { repo }: Contexto) =>
      repo.cohortes(a.region, a.desde, a.limite),
    productos: (_: unknown, a: { filtros?: Filtros; limite: number }, { repo }: Contexto) => repo.productos(filtros(a.filtros), a.limite),
    paises: (_: unknown, a: { filtros?: Filtros; limite: number }, { repo }: Contexto) => repo.paises(filtros(a.filtros), a.limite),
    pareto: (_: unknown, { region }: { region: Region }, { repo }: Contexto) => repo.pareto(region),
    preguntar: (_: unknown, a: { pregunta: string; filtros?: Filtros }, { repo }: Contexto) =>
      responder(repo, a.pregunta.slice(0, 300), filtros(a.filtros)),
  },
};

export function crearServidor() {
  return new ApolloServer<Contexto>({
    typeDefs,
    resolvers,
    introspection: true,
  });
}
