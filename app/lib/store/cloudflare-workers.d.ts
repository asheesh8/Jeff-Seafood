/**
 * `cloudflare:workers` is provided by the workerd runtime and does not exist
 * when building for Node or Vercel, where the import throws and is caught.
 * Declared here so both targets type-check without pulling
 * @cloudflare/workers-types into the global scope, which would replace the DOM
 * globals a Next.js build expects.
 */
declare module 'cloudflare:workers' {
  export const env: Record<string, unknown> | undefined;
}
