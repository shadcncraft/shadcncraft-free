import "@shadcncraft/json-render/styles.css";
import "@shadcncraft/json-render/theme.css";
import "./host.css";

import { defineRegistry, JSONUIProvider, Renderer } from "@json-render/react";
import { components } from "@shadcncraft/json-render";
import { catalog } from "@shadcncraft/json-render/catalog";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

const documents = import.meta.glob(
  "/node_modules/@shadcncraft/json-render/examples/**/*.json",
  {
    eager: true,
    import: "default",
  }
);
const names = Object.keys(documents)
  .map((key) => key.replace(/^.*\/examples\//, "").replace(/\.json$/, ""))
  .sort((a, b) =>
    a.startsWith("pages/") === b.startsWith("pages/")
      ? a.localeCompare(b)
      : a.startsWith("pages/")
        ? -1
        : 1
  );
const load = (name) =>
  documents[`/node_modules/@shadcncraft/json-render/examples/${name}.json`];

const { registry } = defineRegistry(catalog, { components });
window.__actions = [];

function App() {
  const params = new URLSearchParams(location.search);
  const [name, setName] = useState(params.get("doc") ?? "pages/product-landing");
  const [spec, setSpec] = useState(() => load(name));
  const [dark, setDark] = useState(params.get("theme") === "dark");
  const [log, setLog] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  useEffect(() => {
    // Hooks for browser checks: render any document, read the action log.
    window.__render = (next) => {
      setSpec(next);
      setVersion((v) => v + 1);
    };
    window.__theme = setDark;
  }, []);

  const record = (action) => async (params) => {
    window.__actions.push({ action, params });
    setLog(`${action} ${JSON.stringify(params)}`);
  };
  const handlers = Object.fromEntries(
    [
      "startTrial",
      "choosePlan",
      "subscribe",
      "sendContact",
      "dismissBanner",
      "signIn",
    ].map((a) => [a, record(a)])
  );

  return (
    <>
      <div className="demo-bar">
        <select
          aria-label="Document"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setSpec(load(event.target.value));
            setVersion((v) => v + 1);
          }}
        >
          {names.map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
        <label>
          <input
            type="checkbox"
            checked={dark}
            onChange={(e) => setDark(e.target.checked)}
          />{" "}
          Dark
        </label>
      </div>
      <main id="page" data-version={version}>
        <JSONUIProvider
          key={version}
          registry={registry}
          initialState={spec.state ?? {}}
          handlers={handlers}
        >
          <Renderer spec={spec} registry={registry} />
        </JSONUIProvider>
      </main>
      <div className="demo-log">{log}</div>
    </>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
