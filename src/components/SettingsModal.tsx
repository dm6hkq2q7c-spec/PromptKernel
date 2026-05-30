"use client";

import { AlertCircle, CheckCircle2, Plug, Settings, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { ApiConfig } from "@/lib/types";
import { DEFAULT_API_CONFIG, usePromptStore } from "@/store/prompt-store";

const STORAGE_KEY = "prompt_kernel_config";

type TestState = {
  status: "idle" | "loading" | "success" | "error";
  message: string;
};

export function SettingsModal() {
  const { apiConfig, settingsOpen, setApiConfig, setSettingsOpen } = usePromptStore();
  const [draft, setDraft] = useState<ApiConfig>(apiConfig);
  const [testState, setTestState] = useState<TestState>({ status: "idle", message: "" });

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setDraft(DEFAULT_API_CONFIG);
      setApiConfig(DEFAULT_API_CONFIG);
      setSettingsOpen(true);
      return;
    }

    try {
      const parsed = JSON.parse(saved) as Partial<ApiConfig>;
      const next = {
        baseUrl: parsed.baseUrl || DEFAULT_API_CONFIG.baseUrl,
        apiKey: parsed.apiKey || "",
        model: parsed.model || DEFAULT_API_CONFIG.model
      };
      setDraft(next);
      setApiConfig(next);
      if (!next.apiKey) setSettingsOpen(true);
    } catch {
      setSettingsOpen(true);
    }
  }, [setApiConfig, setSettingsOpen]);

  useEffect(() => {
    setDraft(apiConfig);
  }, [apiConfig]);

  const updateDraft = (key: keyof ApiConfig, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setTestState({ status: "idle", message: "" });
  };

  const save = (close = true) => {
    const normalized = {
      baseUrl: draft.baseUrl.trim().replace(/\/+$/, "") || DEFAULT_API_CONFIG.baseUrl,
      apiKey: draft.apiKey.trim(),
      model: draft.model.trim() || DEFAULT_API_CONFIG.model
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    setApiConfig(normalized);
    setDraft(normalized);
    if (close) setSettingsOpen(false);
    return normalized;
  };

  const testConnection = async () => {
    const config = save(false);
    setTestState({ status: "loading", message: "正在向 /chat/completions 发送最小请求。" });
    try {
      const response = await fetch("/api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Connection failed.");
      setTestState({ status: "success", message: "Base URL、API Key 与 Model Name 已通过一次真实请求验证。" });
    } catch (error) {
      setTestState({ status: "error", message: error instanceof Error ? error.message : "连接失败，请检查 Base URL、Key 或模型名。" });
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setSettingsOpen(true)}
        className="fixed right-3 top-2 z-30 inline-flex h-8 items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/90 px-3 text-xs font-medium tracking-tight text-zinc-200 backdrop-blur transition-all hover:border-blue-500/50 hover:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
      >
        <Settings className="h-3.5 w-3.5" />
        API 设置
      </button>

      {settingsOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold tracking-tight">API 设置</h2>
                <p className="mt-1 text-xs text-zinc-500">使用 OpenAI 兼容接口连接你的模型服务。</p>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-all hover:bg-zinc-900 hover:text-zinc-200"
                aria-label="Close settings"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-4">
              <label className="block">
                <span className="text-xs font-medium text-zinc-400">Base URL</span>
                <input
                  value={draft.baseUrl}
                  onChange={(event) => updateDraft("baseUrl", event.target.value)}
                  className="mt-1 h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-zinc-400">API Key</span>
                <input
                  type="password"
                  value={draft.apiKey}
                  onChange={(event) => updateDraft("apiKey", event.target.value)}
                  placeholder="sk-..."
                  className="mt-1 h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-zinc-400">Model Name</span>
                <input
                  value={draft.model}
                  onChange={(event) => updateDraft("model", event.target.value)}
                  className="mt-1 h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                />
              </label>

              {testState.message ? <ConnectionNotice state={testState} /> : null}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-zinc-800 px-4 py-3">
              <button
                type="button"
                onClick={testConnection}
                disabled={testState.status === "loading"}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-200 transition-all hover:border-blue-500/50 hover:text-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plug className="h-3.5 w-3.5" />
                {testState.status === "loading" ? "Testing..." : "Test Connection"}
              </button>
              <button
                type="button"
                onClick={() => save(true)}
                className="inline-flex h-9 items-center rounded-md border border-blue-400/20 bg-blue-600 px-4 text-xs font-medium text-white transition-all hover:bg-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              >
                保存设置
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ConnectionNotice({ state }: { state: TestState }) {
  const success = state.status === "success";
  const Icon = success ? CheckCircle2 : state.status === "error" ? AlertCircle : Plug;
  const cls = success
    ? "border-blue-500/25 bg-blue-500/10 text-blue-200"
    : state.status === "error"
      ? "border-rose-500/25 bg-rose-500/10 text-rose-200"
      : "border-zinc-800 bg-zinc-900 text-zinc-400";

  return (
    <div className={`flex gap-3 rounded-md border px-3 py-2 text-xs ${cls}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <div className="font-medium">{success ? "连接已验证" : state.status === "error" ? "需要处理" : "正在测试"}</div>
        <div className="mt-1 leading-5 opacity-80">{state.message}</div>
      </div>
    </div>
  );
}
