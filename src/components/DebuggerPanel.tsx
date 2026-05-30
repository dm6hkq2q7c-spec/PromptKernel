"use client";

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  GitCompareArrows,
  Info,
  TestTube2
} from "lucide-react";
import { useMemo, useState } from "react";
import type { EvaluationResponse, KernelRisk } from "@/lib/types";
import { usePromptStore } from "@/store/prompt-store";

const tabs = [
  { id: "cases", label: "固定用例", icon: TestTube2 },
  { id: "kernel", label: "内核评分", icon: BarChart3 },
  { id: "diff", label: "优化对比", icon: GitCompareArrows }
] as const;

const kernelDimensionLabel: Record<string, string> = {
  simplicity: "K - 简单直接",
  verifiability: "E - 可验证",
  reproducibility: "R - 可复现",
  narrowness: "N - 范围收敛",
  explicitness: "E - 约束明确",
  structure: "L - 结构清晰"
};

const kernelFrameworkGuide = [
  { key: "K", label: "Keep it simple", desc: "一个提示词只解决一个清晰目标，避免把多个任务塞进同一次请求。" },
  { key: "E", label: "Easy to verify", desc: "定义可检查的成功标准，例如数量、格式、字段、边界条件。" },
  { key: "R", label: "Reproducible", desc: "减少“最新、当前、近期”等时间敏感表达，固定输入和参考范围。" },
  { key: "N", label: "Narrow scope", desc: "控制任务范围，让模型在更小的空间里稳定输出。" },
  { key: "E", label: "Explicit constraints", desc: "明确说明不要做什么、输出上限是什么、必须遵守哪些限制。" },
  { key: "L", label: "Logical structure", desc: "按背景、任务、约束、输出格式组织信息，减少模型猜测。" }
];

export function DebuggerPanel() {
  const { activeTab, setActiveTab } = usePromptStore();

  return (
    <section className="flex min-h-0 flex-col bg-zinc-950">
      <nav className="flex items-center gap-1 border-b border-zinc-800 bg-zinc-900/40 px-3 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium tracking-tight transition-all duration-200 ease-out ${
                active ? "bg-zinc-800 text-zinc-50" : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        {activeTab === "cases" ? <FixedCaseTab /> : null}
        {activeTab === "kernel" ? <KernelTab /> : null}
        {activeTab === "diff" ? <DiffTab /> : null}
      </div>
    </section>
  );
}

function FixedCaseTab() {
  const { variables, cases, results, isRunning, setVariableValue } = usePromptStore();
  const fixedCase = cases[0];
  const [open, setOpen] = useState("original");
  const originalOutput = results?.results.find((item) => item.caseId === "original")?.output || "";
  const optimizedOutput = results?.results.find((item) => item.caseId === "optimized")?.output || "";

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50">
        <div className="border-b border-zinc-800 px-3 py-2">
          <div className="text-xs font-medium text-zinc-300">固定用例参数</div>
          <div className="mt-1 text-[11px] text-zinc-500">
            {variables.length ? "变量值固定，用于对比 Prompt 优化前后的输出变化。" : "当前 Prompt 没有变量，输入天然固定，直接对比优化前后输出。"}
          </div>
        </div>
        <div className="p-3">
          {variables.length ? (
            <div className="space-y-2">
              {variables.map((variable) => (
                <label key={variable} className="grid grid-cols-[104px_1fr] items-center gap-2">
                  <span className="truncate font-mono text-[11px] text-zinc-500">{`{{${variable}}}`}</span>
                  <input
                    value={fixedCase?.variables[variable] || ""}
                    onChange={(event) => setVariableValue("case-1", variable, event.target.value)}
                    className="h-8 rounded-md border border-zinc-800 bg-zinc-950 px-2 text-xs text-zinc-200 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                  />
                </label>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-500">无变量参数。</div>
          )}
        </div>
      </div>

      {results?.optimizedPrompt ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50">
          <div className="border-b border-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300">自动生成的优化版 Prompt</div>
          <pre className="max-h-56 overflow-auto whitespace-pre-wrap p-3 font-mono text-xs leading-6 text-zinc-300">{results.optimizedPrompt}</pre>
        </div>
      ) : null}

      <div className="space-y-2">
        {isRunning ? <CaseSkeleton /> : null}
        <OutputCard id="original" title="输出 1：当前 Prompt" output={originalOutput} open={open} setOpen={setOpen} />
        <OutputCard id="optimized" title="输出 2：优化版 Prompt" output={optimizedOutput} open={open} setOpen={setOpen} />
      </div>
    </div>
  );
}

function OutputCard({
  id,
  title,
  output,
  open,
  setOpen
}: {
  id: string;
  title: string;
  output: string;
  open: string;
  setOpen: (id: string) => void;
}) {
  const expanded = open === id;

  return (
    <article className="rounded-lg border border-zinc-800 bg-zinc-900/50">
      <button
        type="button"
        onClick={() => setOpen(expanded ? "" : id)}
        className="flex w-full items-center justify-between px-3 py-2 text-left transition-all hover:bg-zinc-900"
      >
        <span className="text-xs font-medium text-zinc-200">{title}</span>
        <span className="flex items-center gap-2 text-[11px] text-zinc-500">
          {output ? "输出就绪" : "未运行"}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </span>
      </button>
      {expanded ? (
        <pre className="whitespace-pre-wrap border-t border-zinc-800 p-3 font-mono text-xs leading-6 text-zinc-300">
          {output || "运行分析后将在此显示输出。"}
        </pre>
      ) : null}
    </article>
  );
}

function KernelTab() {
  const { results, isRunning } = usePromptStore();
  if (isRunning) return <KernelSkeleton />;
  const kernel = results?.kernel;

  if (!kernel) {
    return <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-xs text-zinc-500">暂无评测数据，第一次运行后将对当前 Prompt 进行 KERNEL 评分，并自动生成优化版 Prompt。</div>;
  }

  const weakest = Object.entries(kernel.dimensions).sort((a, b) => a[1] - b[1]).slice(0, 2);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <div className="text-xs text-zinc-500">当前 Prompt 内核总分</div>
            <div className="text-4xl font-semibold tracking-tight text-zinc-50">{kernel.score}</div>
          </div>
          <div className="max-w-[220px] text-right text-[11px] leading-5 text-zinc-500">
            优先补强：{weakest.map(([name]) => kernelDimensionLabel[name] ?? name).join("、")}
          </div>
        </div>
        <div className="space-y-2">
          {Object.entries(kernel.dimensions).map(([name, value]) => (
            <div key={name} className="grid grid-cols-[160px_1fr_36px] items-center gap-2">
              <span className="text-xs text-zinc-400">{kernelDimensionLabel[name] ?? name}</span>
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full rounded-full bg-blue-500 transition-all duration-200 ease-out" style={{ width: `${value}%` }} />
              </div>
              <span className="text-right font-mono text-[11px] text-zinc-500">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {kernel.risks.map((risk, index) => (
          <RiskItem key={`${risk.title}-${index}`} risk={risk} />
        ))}
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="mb-3 text-xs font-medium text-zinc-300">KERNEL 框架说明</div>
        <div className="space-y-2">
          {kernelFrameworkGuide.map((item) => (
            <div key={`${item.key}-${item.label}`} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-zinc-800 font-mono text-[11px] font-bold text-blue-400">{item.key}</span>
              <div>
                <div className="text-xs font-medium text-zinc-300">{item.label}</div>
                <div className="mt-0.5 text-[11px] leading-5 text-zinc-500">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DiffTab() {
  const { results } = usePromptStore();
  const originalOutput = results?.results.find((item) => item.caseId === "original")?.output || "";
  const optimizedOutput = results?.results.find((item) => item.caseId === "optimized")?.output || "";
  const metrics = useMemo(() => getComparisonMetrics(results, originalOutput, optimizedOutput), [results, originalOutput, optimizedOutput]);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
        <div className="text-xs font-medium text-zinc-300">输出 1 vs 输出 2</div>
        <div className="mt-1 text-[11px] text-zinc-500">固定同一组参数，对比 Prompt 优化前后的 KERNEL 总分变化与 token 变化。</div>

        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <MetricCard title="内核总分变化" value={`${formatSigned(metrics.kernelScoreDelta)} 分`} delta={metrics.kernelScoreDelta} upText="优化后提升" neutralText="评分持平" />
          <MetricCard title="Token 变化" value={`${formatSigned(metrics.tokenDelta)} tokens`} delta={metrics.tokenDelta} upText="优化后变长" neutralText="Token 持平" />
        </div>
      </div>

      {originalOutput || optimizedOutput ? (
        <div className="grid gap-3 xl:grid-cols-2">
          <OutputPane title="输出 1：当前 Prompt" output={originalOutput} />
          <OutputPane title="输出 2：优化版 Prompt" output={optimizedOutput} />
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-xs text-zinc-500">运行分析后将展示输出 1 与输出 2。</div>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  delta,
  neutralText,
  upText
}: {
  title: string;
  value: string;
  delta: number;
  neutralText: string;
  upText: string;
}) {
  const positive = delta > 0;
  const negative = delta < 0;
  const Icon = positive ? ArrowUpRight : negative ? ArrowDownRight : ArrowRight;
  const tone = positive
    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
    : negative
      ? "border-red-500/25 bg-red-500/10 text-red-300"
      : "border-zinc-800 bg-zinc-950 text-zinc-300";
  const label = positive ? upText : negative ? (title === "Token 变化" ? "优化后变短" : "优化后下降") : neutralText;

  return (
    <div className={`rounded-md border px-3 py-3 ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] opacity-70">{title}</div>
          <div className="mt-1 font-mono text-xl font-semibold tracking-tight">{value}</div>
        </div>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-current/20 bg-current/10">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-1 text-[11px] leading-5 opacity-80">{label}</div>
    </div>
  );
}

function OutputPane({ title, output }: { title: string; output: string }) {
  return (
    <section className="min-h-[420px] rounded-lg border border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300">{title}</div>
      <pre className="max-h-[620px] overflow-auto whitespace-pre-wrap p-3 font-mono text-xs leading-6 text-zinc-300">{output || "暂无输出。"}</pre>
    </section>
  );
}

function RiskItem({ risk }: { risk: KernelRisk }) {
  const meta = getRiskMeta(risk.level);
  const Icon = meta.icon;

  return (
    <article className={`rounded-lg border bg-zinc-900/50 p-3 ${meta.className}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-current/20 bg-current/10">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="rounded border border-current/20 px-1.5 py-0.5 text-[10px] font-medium uppercase">{meta.label}</span>
            <span className="text-[11px] text-zinc-500">{meta.action}</span>
          </div>
          <h3 className="text-xs font-medium text-zinc-100">{risk.title}</h3>
          <p className="m-0 mt-1 text-xs leading-5 text-zinc-500">{risk.detail}</p>
        </div>
      </div>
    </article>
  );
}

function getRiskMeta(level: KernelRisk["level"]) {
  if (level === "high") {
    return {
      label: "阻断项",
      action: "先修复，否则输出稳定性会明显受影响",
      icon: AlertTriangle,
      className: "border-rose-500/25 text-rose-300"
    };
  }
  if (level === "medium") {
    return {
      label: "优化项",
      action: "建议本轮迭代处理",
      icon: Info,
      className: "border-amber-500/25 text-amber-300"
    };
  }
  return {
    label: "观察项",
    action: "当前可接受，后续按需调整",
    icon: CheckCircle2,
    className: "border-blue-500/25 text-blue-300"
  };
}

function getComparisonMetrics(results: EvaluationResponse | null, originalOutput: string, optimizedOutput: string) {
  if (results?.comparison) return results.comparison;
  return {
    kernelScoreDelta: results?.optimizedKernel && results.kernel ? results.optimizedKernel.score - results.kernel.score : 0,
    tokenDelta: estimateTokens(optimizedOutput) - estimateTokens(originalOutput)
  };
}

function estimateTokens(value: string) {
  if (!value.trim()) return 0;
  const latinWords = value.match(/[A-Za-z0-9_]+/g)?.length || 0;
  const cjkChars = value.match(/[\u4e00-\u9fff]/g)?.length || 0;
  return Math.max(1, Math.round(latinWords + cjkChars * 0.6));
}

function formatSigned(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

function CaseSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 2 }, (_, index) => (
        <div key={index} className="h-20 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
          <div className="skeleton mb-3 h-3 w-28 rounded" />
          <div className="skeleton h-3 w-full rounded" />
        </div>
      ))}
    </div>
  );
}

function KernelSkeleton() {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="skeleton mb-4 h-10 w-20 rounded" />
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="skeleton h-3 rounded" />
        ))}
      </div>
    </div>
  );
}
