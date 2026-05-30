import { NextResponse } from "next/server";
import { extractVariables, fallbackKernel, fallbackOptimizedPrompt, fallbackOutput, interpolatePrompt } from "@/lib/prompt";
import type { ApiConfig, KernelDiagnostic, Variables } from "@/lib/types";

type EvaluateRequest = {
  prompt?: string;
  config?: Partial<ApiConfig>;
  case?: { id?: string; variables?: Variables };
};

const diagnosticSystemPrompt = `You are PromptKernel's KERNEL diagnostic engine.
Evaluate the given prompt strictly using the KERNEL framework (6 dimensions):

K - Keep it simple: Is the prompt focused on ONE clear goal? No filler, no padding.
E - Easy to verify: Does the prompt define explicit success criteria?
R - Reproducible results: Avoids time-sensitive phrases like "latest trend" or "current best practice".
N - Narrow scope: One prompt = one task.
E - Explicit constraints: Explicitly tells the AI what NOT to do.
L - Logical structure: Follows context, task, constraints, output format.

Return only valid JSON with this shape:
{
  "score": 0,
  "dimensions": { "simplicity": 0, "verifiability": 0, "reproducibility": 0, "narrowness": 0, "explicitness": 0, "structure": 0 },
  "risks": [{ "level": "high", "title": "...", "detail": "..." }]
}
Scores are 0-100. Risk level must be high, medium, or low. Output 2-4 risks maximum.`;

const optimizerSystemPrompt = `You are PromptKernel's prompt optimizer.
Rewrite the user's prompt into a stronger prompt under the KERNEL framework.

Hard rules:
- Preserve the original task intent and every variable placeholder exactly, e.g. {{product}}.
- Do not invent new variables.
- Do not change the requested output shape, count, order, language, or section names.
- If the original prompt asks for 4 items, the optimized prompt must still ask for those same 4 items in the same order.
- Improve only instruction clarity: add context, explicit constraints, success criteria, and verification requirements.
- The optimized prompt should make the model produce a comparable answer, not a different report format.
- Return only the optimized prompt text. No explanation, no markdown fence.`;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EvaluateRequest;
    const prompt = String(body.prompt || "").trim();
    const config = normalizeConfig(body.config);
    const fixedCase = { id: "case-1", variables: body.case?.variables || {} };

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt." }, { status: 400 });
    }

    const variableNames = extractVariables(prompt);

    if (!config.apiKey) {
      const optimizedPrompt = fallbackOptimizedPrompt(prompt, variableNames);
      const kernel = fallbackKernel(prompt, variableNames);
      const optimizedKernel = fallbackKernel(optimizedPrompt, extractVariables(optimizedPrompt));

      return NextResponse.json({
        originalPrompt: prompt,
        optimizedPrompt,
        results: [
          { caseId: "original", output: fallbackOutput(prompt, fixedCase.variables, "输出 1：当前 Prompt") },
          { caseId: "optimized", output: fallbackOutput(optimizedPrompt, fixedCase.variables, "输出 2：优化版 Prompt") }
        ],
        kernel,
        optimizedKernel,
        comparison: buildComparison(kernel, optimizedKernel, "", "")
      });
    }

    const originalOutputJob = callChatCompletion({
      config,
      messages: [
        {
          role: "system",
          content: "Execute the prompt exactly. Keep the final answer in the format requested by the prompt. Return only the final answer."
        },
        { role: "user", content: interpolatePrompt(prompt, fixedCase.variables) }
      ]
    });

    const diagnosticJob = evaluateKernel({
      config,
      prompt,
      variableNames,
      fixedCase: fixedCase.variables,
      fallback: fallbackKernel(prompt, variableNames)
    });

    const [originalOutput, kernel] = await Promise.all([originalOutputJob, diagnosticJob]);

    const optimizedPrompt = await callChatCompletion({
      config,
      messages: [
        { role: "system", content: optimizerSystemPrompt },
        {
          role: "user",
          content: JSON.stringify({
            prompt,
            variables: variableNames,
            kernel,
            fixedCase: fixedCase.variables
          })
        }
      ]
    }).then((content) => content.trim() || fallbackOptimizedPrompt(prompt, variableNames));

    const optimizedVariableNames = extractVariables(optimizedPrompt);

    const optimizedOutputJob = callChatCompletion({
      config,
      messages: [
        {
          role: "system",
          content:
            "Execute the optimized prompt exactly. Keep the final answer in the same output shape as the original prompt requested so it can be compared against the first output. Return only the final answer."
        },
        { role: "user", content: interpolatePrompt(optimizedPrompt, fixedCase.variables) }
      ]
    });

    const optimizedKernelJob = evaluateKernel({
      config,
      prompt: optimizedPrompt,
      variableNames: optimizedVariableNames,
      fixedCase: fixedCase.variables,
      fallback: fallbackKernel(optimizedPrompt, optimizedVariableNames)
    });

    const [optimizedOutput, optimizedKernel] = await Promise.all([optimizedOutputJob, optimizedKernelJob]);

    return NextResponse.json({
      originalPrompt: prompt,
      optimizedPrompt,
      results: [
        { caseId: "original", output: originalOutput },
        { caseId: "optimized", output: optimizedOutput }
      ],
      kernel,
      optimizedKernel,
      comparison: buildComparison(kernel, optimizedKernel, originalOutput, optimizedOutput)
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Evaluation route failed." }, { status: 500 });
  }
}

async function evaluateKernel({
  config,
  prompt,
  variableNames,
  fixedCase,
  fallback
}: {
  config: ApiConfig;
  prompt: string;
  variableNames: string[];
  fixedCase: Variables;
  fallback: KernelDiagnostic;
}) {
  return callChatCompletion({
    config,
    responseFormat: true,
    messages: [
      { role: "system", content: diagnosticSystemPrompt },
      {
        role: "user",
        content: JSON.stringify({
          prompt,
          variables: variableNames,
          fixedCase
        })
      }
    ]
  }).then((content) => parseKernel(content, fallback));
}

async function callChatCompletion({
  config,
  messages,
  responseFormat = false
}: {
  config: ApiConfig;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  responseFormat?: boolean;
}) {
  const response = await fetch(normalizeChatCompletionsUrl(config.baseUrl), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.2,
      max_tokens: 1800,
      stream: false,
      ...(responseFormat ? { response_format: { type: "json_object" } } : {})
    })
  });

  const text = await response.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Upstream returned non-JSON response: ${text.slice(0, 160)}`);
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("API Key 无效，请检查 API 设置。");
    }
    throw new Error(data?.error?.message || data?.message || `Upstream request failed with ${response.status}.`);
  }

  return data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || data?.output?.text || "";
}

function parseKernel(content: string, fallback: KernelDiagnostic): KernelDiagnostic {
  try {
    const parsed = JSON.parse(stripJsonFence(content));
    const risks = Array.isArray(parsed.risks) ? parsed.risks : fallback.risks;
    return {
      score: clamp(parsed.score ?? fallback.score),
      dimensions: normalizeDimensions(parsed.dimensions, fallback.dimensions),
      risks: risks.map((risk: any) => ({
        level: ["high", "medium", "low"].includes(risk?.level) ? risk.level : "medium",
        title: String(risk?.title || "Diagnostic risk"),
        detail: String(risk?.detail || "The model returned an incomplete diagnostic.")
      }))
    };
  } catch {
    return fallback;
  }
}

function normalizeDimensions(value: unknown, fallback: Record<string, number>) {
  if (!value || typeof value !== "object") return fallback;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, score]) => [key, clamp(Number(score))]));
}

function buildComparison(before: KernelDiagnostic, after: KernelDiagnostic, originalOutput: string, optimizedOutput: string) {
  return {
    kernelScoreDelta: after.score - before.score,
    tokenDelta: estimateTokens(optimizedOutput) - estimateTokens(originalOutput)
  };
}

function estimateTokens(value: string) {
  if (!value.trim()) return 0;
  const latinWords = value.match(/[A-Za-z0-9_]+/g)?.length || 0;
  const cjkChars = value.match(/[\u4e00-\u9fff]/g)?.length || 0;
  return Math.max(1, Math.round(latinWords + cjkChars * 0.6));
}

function clamp(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function stripJsonFence(value: string) {
  const match = value.trim().match(/```(?:json)?\s*([\s\S]*?)```/i);
  return match ? match[1].trim() : value.trim();
}

function normalizeChatCompletionsUrl(rawUrl: string) {
  const trimmed = rawUrl.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/chat/completions") ? trimmed : `${trimmed}/chat/completions`;
}

function normalizeConfig(config?: Partial<ApiConfig>): ApiConfig {
  return {
    baseUrl: String(config?.baseUrl || "https://dashscope.aliyuncs.com/compatible-mode/v1").trim(),
    apiKey: String(config?.apiKey || "").trim(),
    model: String(config?.model || "qwen-plus").trim()
  };
}
