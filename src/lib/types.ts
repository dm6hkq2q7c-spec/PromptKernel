export type Variables = Record<string, string>;

export type ApiConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

export type TestCase = {
  id: string;
  name: string;
  variables: Variables;
};

export type EvaluationResult = {
  caseId: string;
  output: string;
};

export type KernelRisk = {
  level: "high" | "medium" | "low";
  title: string;
  detail: string;
};

export type KernelDiagnostic = {
  score: number;
  dimensions: Record<string, number>;
  risks: KernelRisk[];
};

export type EvaluationResponse = {
  results: EvaluationResult[];
  kernel: KernelDiagnostic;
  optimizedKernel?: KernelDiagnostic;
  originalPrompt: string;
  optimizedPrompt: string;
  comparison?: {
    kernelScoreDelta: number;
    tokenDelta: number;
  };
};
