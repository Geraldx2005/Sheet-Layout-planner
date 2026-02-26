import PresetHolder from "./components/presets/PresetHolder";
import Panel from "./components/Panel";
import { RefreshProvider } from "./context/RefreshContext";

export default function App() {
  return (
    <main className="h-[100dvh] overflow-hidden sm:h-auto sm:overflow-auto min-h-screen bg-nero-900 flex flex-wrap-reverse items-center justify-start select-none">
      <RefreshProvider>
        <PresetHolder />
        <Panel />
      </RefreshProvider>
    </main>
  );
}
