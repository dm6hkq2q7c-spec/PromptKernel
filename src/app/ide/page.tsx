import { DebuggerPanel } from "@/components/DebuggerPanel";
import { PromptEditor } from "@/components/PromptEditor";
import { SettingsModal } from "@/components/SettingsModal";

export default function IdePage() {
  return (
    <main className="h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <SettingsModal />
      <div className="grid h-full grid-cols-1 lg:grid-cols-[45%_55%]">
        <PromptEditor />
        <DebuggerPanel />
      </div>
    </main>
  );
}
