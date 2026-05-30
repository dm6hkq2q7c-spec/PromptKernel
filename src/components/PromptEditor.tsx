"use client";

import Editor, { type OnMount } from "@monaco-editor/react";
import { Play, Search } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { usePromptStore } from "@/store/prompt-store";

type MonacoEditor = Parameters<OnMount>[0];
type Monaco = Parameters<OnMount>[1];

export function PromptEditor() {
  const { title, apiConfig, prompt, variables, cases, isRunning, error, setTitle, setPrompt, runEvaluation } = usePromptStore();
  const editorRef = useRef<MonacoEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationRef = useRef<string[]>([]);
  const tokenCount = useMemo(() => Math.max(1, Math.round(prompt.trim().split(/\s+/).filter(Boolean).length * 1.35)), [prompt]);

  const highlightVariables = () => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;
    const modelRef = editor.getModel();
    if (!modelRef) return;

    const decorations = modelRef.findMatches("\\{\\{\\s*[a-zA-Z_][\\w.-]*\\s*\\}\\}", false, true, false, null, true).map((match) => ({
      range: match.range,
      options: {
        inlineClassName: "variable-token",
        hoverMessage: { value: "提示词变量" }
      }
    }));
    decorationRef.current = editor.deltaDecorations(decorationRef.current, decorations);
  };

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    monaco.editor.defineTheme("promptkernel-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "e4e4e7", background: "09090b" },
        { token: "comment", foreground: "71717a" }
      ],
      colors: {
        "editor.background": "#09090b",
        "editor.foreground": "#e4e4e7",
        "editorLineNumber.foreground": "#3f3f46",
        "editorLineNumber.activeForeground": "#a1a1aa",
        "editorCursor.foreground": "#60a5fa",
        "editor.selectionBackground": "#2563eb55",
        "editor.lineHighlightBackground": "#18181b66",
        "editorGutter.background": "#09090b"
      }
    });
    monaco.editor.setTheme("promptkernel-dark");
    highlightVariables();
  };

  useEffect(() => {
    highlightVariables();
  }, [prompt]);

  return (
    <section className="flex min-h-0 flex-col border-r border-zinc-800 bg-zinc-950">
      <header className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/40 px-3 py-2">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="h-8 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 text-sm font-medium tracking-tight text-zinc-100 outline-none transition-all focus:border-zinc-700 focus:bg-zinc-950 focus:ring-1 focus:ring-blue-500/50"
          aria-label="Prompt title"
        />
        <span className="hidden max-w-[160px] truncate rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1.5 font-mono text-[11px] text-zinc-400 sm:inline">
          {apiConfig.model}
        </span>
        <button
          type="button"
          onClick={runEvaluation}
          disabled={isRunning}
          className="inline-flex h-8 items-center gap-2 rounded-md border border-blue-400/20 bg-blue-600 px-3 text-xs font-medium text-white outline-none transition-all duration-200 ease-out hover:bg-blue-500 focus:ring-1 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRunning ? <span className="h-3 w-3 animate-spin rounded-full border border-white/40 border-t-white" /> : <Search className="h-3.5 w-3.5" />}
          分析并运行
        </button>
      </header>

      {error ? <div className="border-b border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{error}</div> : null}

      <div className="min-h-0 flex-1">
        <Editor
          value={prompt}
          onChange={(value) => setPrompt(value || "")}
          onMount={handleMount}
          language="markdown"
          theme="promptkernel-dark"
          options={{
            minimap: { enabled: false },
            glyphMargin: false,
            folding: false,
            lineNumbersMinChars: 3,
            overviewRulerLanes: 0,
            renderLineHighlight: "line",
            scrollBeyondLastLine: false,
            fontFamily: "JetBrains Mono, SFMono-Regular, Consolas, monospace",
            fontSize: 13,
            lineHeight: 22,
            padding: { top: 12, bottom: 12 },
            wordWrap: "on",
            quickSuggestions: false,
            tabSize: 2
          }}
        />
      </div>

      <footer className="flex h-9 items-center justify-between border-t border-zinc-800 bg-zinc-900/40 px-3 text-[11px] text-zinc-500">
        <span className="font-mono">{tokenCount} Tokens</span>
        <span className="font-mono">{variables.length} Variables</span>
        <span className="inline-flex items-center gap-1 font-mono text-zinc-400">
          <Play className="h-3 w-3" />
          {isRunning ? "Running" : cases.length ? "Ready" : "Idle"}
        </span>
      </footer>
    </section>
  );
}
