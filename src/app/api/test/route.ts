import { NextResponse } from "next/server";
import type { ApiConfig } from "@/lib/types";

type TestRequest = {
  config?: Partial<ApiConfig>;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TestRequest;
    const config = normalizeConfig(body.config);

    if (!config.apiKey) {
      return NextResponse.json({ error: "请填写 API Key。" }, { status: 400 });
    }

    const response = await fetch(normalizeChatCompletionsUrl(config.baseUrl), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: "user", content: "Return only the word ok." }],
        temperature: 0,
        max_tokens: 8,
        stream: false
      })
    });

    const text = await response.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json({ error: "API Key 无效，请检查 API 设置。" }, { status: response.status });
      }
      return NextResponse.json(
        { error: data?.error?.message || data?.message || `Connection failed with ${response.status}.` },
        { status: response.status }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Connection test failed." }, { status: 500 });
  }
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
