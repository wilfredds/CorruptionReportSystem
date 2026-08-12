"use client";

import { createBrowserClient } from "@supabase/ssr";

import { publicSupabaseEnv } from "./env";
import type { Database } from "./types";

/**
 * The Supabase client for browser code — the staff login form, and any
 * dashboard component that needs live data.
 *
 * It carries the anon key, so everything it asks for is answered by the
 * database according to Row Level Security and the caller's session. A crew
 * member's browser can hold this client, type any query it likes into the
 * console, and still only get back what the policies in schema.sql allow.
 */
export function createClient() {
  const { url, anonKey } = publicSupabaseEnv();
  return createBrowserClient<Database>(url, anonKey);
}
