import { defineConfig } from "vite";
// JSX clássico: as telas usam React como global (ver src/global-react.ts).
export default defineConfig({ esbuild: { jsxFactory: "React.createElement", jsxFragment: "React.Fragment" }, build: { chunkSizeWarningLimit: 900 } });
