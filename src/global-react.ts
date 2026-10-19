// As telas usam o React como global (mesmo código da versão publicada no claude.ai).
import * as R from "react";
import * as RD from "react-dom/client";
(globalThis as any).React = R;
(globalThis as any).ReactDOM = RD;
