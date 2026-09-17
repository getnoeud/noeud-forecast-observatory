import "server-only";

import { Pool, types } from "pg";

// numeric/int8 arrive as strings by default so precision is never silently lost.
// Every rate in this schema is numeric(20,10); JS doubles hold those exactly
// enough for display, and we want plain numbers in the React tree.
types.setTypeParser(types.builtins.NUMERIC, (value) => Number(value));
types.setTypeParser(types.builtins.INT8, (value) => Number(value));
// Dates are calendar dates in the forecast domain, never instants. Keep the
// wire format so no timezone is applied on the way in.
types.setTypeParser(types.builtins.DATE, (value) => value);

const globalForPool = globalThis as unknown as {
  noeudObservatoryPool?: Pool;
  noeudObservatoryPoolOwner?: object;
};

// A fresh token per module evaluation. The pool survives re-renders (so dev
// hot-reload does not exhaust Supabase connections) but is rebuilt whenever
// this module itself is reloaded, so edits to the connection setup take effect
// without restarting the dev server.
const MODULE_TOKEN = {};

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super(
      "OBSERVATORY_DATABASE_URL is not set. Point it at the Supabase session pooler URI for the private noeud_forecast schema.",
    );
    this.name = "DatabaseNotConfiguredError";
  }
}

function createPool(): Pool {
  const connectionString = process.env.OBSERVATORY_DATABASE_URL?.trim();
  if (!connectionString) {
    throw new DatabaseNotConfiguredError();
  }

  // node-postgres reads `sslmode` out of the URI and lets it win over the ssl
  // object, so the parameter is stripped and TLS is configured explicitly.
  const url = new URL(connectionString);
  url.searchParams.delete("sslmode");

  return new Pool({
    connectionString: url.toString(),
    max: Number(process.env.OBSERVATORY_DB_POOL_MAX ?? 4),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 20_000,
    // Supabase terminates TLS with a certificate the local trust store does not
    // carry. The connection is still encrypted; only chain verification is off.
    ssl: { rejectUnauthorized: false },
    // The session pooler is incompatible with server-side prepared statements.
    statement_timeout: 25_000,
  });
}

export function pool(): Pool {
  if (
    globalForPool.noeudObservatoryPool &&
    globalForPool.noeudObservatoryPoolOwner !== MODULE_TOKEN
  ) {
    void globalForPool.noeudObservatoryPool.end().catch(() => undefined);
    globalForPool.noeudObservatoryPool = undefined;
  }
  if (!globalForPool.noeudObservatoryPool) {
    globalForPool.noeudObservatoryPool = createPool();
    globalForPool.noeudObservatoryPoolOwner = MODULE_TOKEN;
  }
  return globalForPool.noeudObservatoryPool;
}

export async function query<T>(text: string, params: unknown[] = []): Promise<T[]> {
  const result = await pool().query(text, params as never[]);
  return result.rows as T[];
}

export async function queryOne<T>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export type DataSourceStatus =
  | { state: "ok"; latencyMs: number; serverTime: string }
  | { state: "unconfigured" }
  | { state: "error"; message: string };

export async function probeDataSource(): Promise<DataSourceStatus> {
  if (!process.env.OBSERVATORY_DATABASE_URL?.trim()) {
    return { state: "unconfigured" };
  }
  const started = Date.now();
  try {
    const row = await queryOne<{ now: string }>("select now()::text as now");
    return { state: "ok", latencyMs: Date.now() - started, serverTime: row?.now ?? "" };
  } catch (error) {
    return { state: "error", message: error instanceof Error ? error.message : String(error) };
  }
}
