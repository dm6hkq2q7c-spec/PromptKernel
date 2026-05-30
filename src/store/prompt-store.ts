"use client";

import { create } from "zustand";
import { createDefaultCase, extractVariables, syncCaseVariables } from "@/lib/prompt";
import type { ApiConfig, EvaluationResponse, TestCase } from "@/lib/types";

export const DEFAULT_API_CONFIG: ApiConfig = {
  baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  apiKey: "",
  model: "qwen-plus"
};

const initialPrompt = `你是一位资深产品分析师。
对 {{product}} 进行面向 {{audience}} 的分析。
必须包括：
1. 简明的产品定位概述
2. 三个可衡量的优势
3. 两个风险或未知项
4. 用 {{tone}} 语气给出最终建议`;

type PromptState = {
  title: string;
  apiConfig: ApiConfig;
  settingsOpen: boolean;
  prompt: string;
  variables: string[];
  cases: TestCase[];
  results: EvaluationResponse | null;
  activeTab: "cases" | "kernel" | "diff";
  isRunning: boolean;
  error: string | null;
  setTitle: (title: string) => void;
  setApiConfig: (config: ApiConfig) => void;
  setSettingsOpen: (open: boolean) => void;
  setPrompt: (prompt: string) => void;
  setVariableValue: (caseId: string, name: string, value: string) => void;
  setActiveTab: (tab: PromptState["activeTab"]) => void;
  runEvaluation: () => Promise<void>;
};

const initialVariables = extractVariables(initialPrompt);

export const usePromptStore = create<PromptState>((set, get) => ({
  title: "未命名提示词",
  apiConfig: DEFAULT_API_CONFIG,
  settingsOpen: false,
  prompt: initialPrompt,
  variables: initialVariables,
  cases: createDefaultCase(initialVariables),
  results: null,
  activeTab: "cases",
  isRunning: false,
  error: null,
  setTitle: (title) => set({ title }),
  setApiConfig: (apiConfig) => set({ apiConfig }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  setPrompt: (prompt) => {
    const variables = extractVariables(prompt);
    set((state) => ({
      prompt,
      variables,
      cases: syncCaseVariables(state.cases, variables),
      results: null
    }));
  },
  setVariableValue: (caseId, name, value) =>
    set((state) => ({
      cases: state.cases.map((testCase) =>
        testCase.id === caseId ? { ...testCase, variables: { ...testCase.variables, [name]: value } } : testCase
      ),
      results: null
    })),
  setActiveTab: (activeTab) => set({ activeTab }),
  runEvaluation: async () => {
    const { prompt, apiConfig, cases } = get();
    if (!apiConfig.apiKey.trim()) {
      set({ error: "请先在 API 设置中填写 API Key。", settingsOpen: true });
      return;
    }

    set({ isRunning: true, error: null, activeTab: "cases" });
    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          config: apiConfig,
          case: { id: "case-1", variables: cases[0]?.variables || {} }
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Evaluation failed.");
      set({ results: data, activeTab: "diff" });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Evaluation failed." });
    } finally {
      set({ isRunning: false });
    }
  }
}));
