import { ArrowRight, BarChart3, Braces, GitCompareArrows } from "lucide-react";
import Link from "next/link";

const features = [
  { title: "变量解析", icon: Braces, desc: "自动识别 {{variable}}，同步生成多组测试 Case。" },
  { title: "差异化对比", icon: GitCompareArrows, desc: "并排查看不同变量输入下的输出偏差。" },
  { title: "自动化评分", icon: BarChart3, desc: "基于 KERNEL 框架量化提示词质量与风险。" }
];

export default function Page() {
  return (
    <main className="min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.18),transparent_34%),radial-gradient(circle_at_20%_25%,rgba(39,39,42,0.75),transparent_28%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

      <section className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6">
        <nav className="flex items-center justify-between">
          <div className="text-sm font-semibold tracking-tight text-zinc-100">PromptKernel</div>
          <Link
            href="/ide"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 text-xs font-medium text-zinc-300 transition-all hover:border-blue-500/50 hover:text-zinc-50"
          >
            Open IDE
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </nav>

        <div className="flex flex-1 flex-col justify-center pb-10 pt-14">
          <div className="max-w-4xl">
            <p className="mb-4 inline-flex rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-xs font-medium tracking-tight text-blue-300">
              PromptKernel
            </p>
            <h1 className="text-6xl font-semibold tracking-tight text-zinc-50 sm:text-7xl lg:text-8xl">PromptKernel</h1>
            <h2 className="mt-5 max-w-4xl text-3xl font-semibold tracking-tight text-zinc-200 sm:text-5xl">
              Structured Prompt Engineering for AI Workflows
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
              拒绝盲盒试错。通过变量可视化、多 Case 对比与 KERNEL 诊断，将 Prompt 调试升级为工程化流程。
            </p>
            <Link
              href="/ide"
              className="mt-9 inline-flex h-12 items-center gap-2 rounded-md bg-blue-600 px-5 text-sm font-semibold tracking-tight text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all hover:bg-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/70"
            >
              Start Debugging
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-16 grid gap-3 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/45 p-5 backdrop-blur transition-all hover:border-blue-500/50"
                >
                  <Icon className="h-5 w-5 text-blue-400" />
                  <h3 className="mt-4 text-sm font-semibold tracking-tight text-zinc-100">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">{feature.desc}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
