import type { KernelDiagnostic, TestCase, Variables } from "./types";

export function extractVariables(prompt: string) {
  const matches = prompt.matchAll(/\{\{\s*([a-zA-Z_][\w.-]*)\s*\}\}/g);
  return Array.from(new Set(Array.from(matches, (match) => match[1])));
}

export function interpolatePrompt(prompt: string, variables: Variables) {
  return prompt.replace(/\{\{\s*([a-zA-Z_][\w.-]*)\s*\}\}/g, (_, key: string) => variables[key] || "");
}

export function createDefaultCase(variableNames: string[]): TestCase[] {
  return [
    {
      id: "case-1",
      name: "固定用例",
      variables: Object.fromEntries(variableNames.map((name) => [name, sampleValue(name)]))
    }
  ];
}

export function syncCaseVariables(cases: TestCase[], variableNames: string[]) {
  const current = cases[0] || { id: "case-1", name: "固定用例", variables: {} };
  return [
    {
      ...current,
      id: "case-1",
      name: "固定用例",
      variables: Object.fromEntries(variableNames.map((name) => [name, current.variables[name] ?? sampleValue(name)]))
    }
  ];
}

export function fallbackOutput(prompt: string, variables: Variables, label: string) {
  const rendered = interpolatePrompt(prompt, variables);
  return [
    `${label} 已完成（本地备用模式）。`,
    "",
    "当前提示词：",
    rendered || "提示词为空。",
    "",
    "调试提示：在 API 设置中填写可用配置后，将使用模型输出替代本地备用内容。"
  ].join("\n");
}

export function fallbackOptimizedPrompt(prompt: string, variableNames: string[]) {
  const variableHint = variableNames.length ? `\n\n变量：${variableNames.map((name) => `{{${name}}}`).join("、")}` : "";
  return [
    "背景：",
    "你需要在固定输入下稳定完成用户任务。",
    "",
    "任务：",
    prompt.trim() || "请完成用户给定任务。",
    variableHint,
    "",
    "约束：",
    "1. 只围绕一个核心目标输出。",
    "2. 明确列出可验证结论，避免泛泛而谈。",
    "3. 不使用无法验证的时间敏感表述。",
    "",
    "输出格式：",
    "使用清晰的小标题和列表，先给结论，再给依据。"
  ].join("\n");
}

export function fallbackKernel(prompt: string, variableNames: string[]): KernelDiagnostic {
  const hasSimpleGoal = prompt.length < 400 && !/并且|\band\b|additionally|同时还要/i.test(prompt);
  const hasVerify = /verify|criteria|success|check|验证|标准|检查|确认|包含|include|return|output|输出|返回/i.test(prompt);
  const hasReproducible = !/latest|current|recently|最新|最近|当前|目前|近期/i.test(prompt);
  const hasNarrowScope = !/(测试|test).{0,30}(文档|doc)|(代码|code).{0,30}(文档|doc).{0,30}(测试|test)/i.test(prompt);
  const hasConstraints = /must|do not|avoid|constraint|only|必须|不能|避免|约束|只能|不超过|不得|no more than/i.test(prompt);
  const hasRole = /you are|act as|role:|你是|扮演|角色/i.test(prompt);
  const hasOutput = /json|table|bullets|format|schema|格式|表格|列表|结构/i.test(prompt);
  const hasStructure = hasRole && hasOutput && prompt.length > 80;

  const dimensions = {
    simplicity: scoreFlag(hasSimpleGoal),
    verifiability: scoreFlag(hasVerify),
    reproducibility: scoreFlag(hasReproducible),
    narrowness: scoreFlag(hasNarrowScope),
    explicitness: scoreFlag(hasConstraints),
    structure: scoreFlag(hasStructure)
  };
  const score = Math.round(Object.values(dimensions).reduce((sum, value) => sum + value, 0) / Object.keys(dimensions).length);
  const risks = [
    !hasVerify && { level: "high" as const, title: "E - 缺少验证标准", detail: "提示词未定义明确的成功标准，无法判断 AI 是否达成目标。" },
    !hasConstraints && { level: "high" as const, title: "E - 约束条件偏弱", detail: "提示词缺少明确约束，未告知 AI 不应做什么。" },
    !hasStructure && { level: "medium" as const, title: "L - 结构不完整", detail: "建议按「背景 -> 任务 -> 约束 -> 格式」四部分组织提示词。" },
    !hasSimpleGoal && { level: "medium" as const, title: "K - 目标过多", detail: "提示词尝试完成多个任务，建议拆分为独立提示词。" },
    !hasReproducible && { level: "medium" as const, title: "R - 可复现性偏差", detail: "提示词包含时间敏感表达，下次运行可能得到不同结果。" }
  ].filter(Boolean).slice(0, 4) as KernelDiagnostic["risks"];

  return {
    score,
    dimensions,
    risks: risks.length ? risks : [{ level: "low", title: "KERNEL 基线稳定", detail: "提示词符合 KERNEL 框架的基本要求。" }]
  };
}

function scoreFlag(ok: boolean) {
  return ok ? 86 : 48;
}

function sampleValue(name: string) {
  const samples: Record<string, string> = {
    audience: "产品经理",
    product: "PromptKernel",
    tone: "简洁",
    market: "开发者工具"
  };
  return samples[name] ?? `${name}-sample`;
}
