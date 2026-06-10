import Link from "next/link";

const topics = ["Giao tiep", "Du lich", "Cong so", "Hoc thuat", "Am thuc", "Cong nghe"];
const modes = ["Nghia VI -> go EN", "Nghe TTS -> go EN"];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-6xl gap-4 px-4 py-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-slate-800 bg-slate-900/90 p-4 shadow-sm shadow-black/20">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-400">KeyLish</div>
          <h1 className="mt-2 text-xl font-semibold">Practice setup</h1>
          <p className="mt-2 text-sm text-slate-400">Select a topic, level, and mode before starting a typing session.</p>

          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Topic</span>
              <select className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none">
                {topics.map((topic) => (
                  <option key={topic}>{topic}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Mode</span>
              <select className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none">
                {modes.map((mode) => (
                  <option key={mode}>{mode}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Level</span>
              <select className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none">
                {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level) => (
                  <option key={level}>{level}</option>
                ))}
              </select>
            </label>

            <button className="w-full rounded-md bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-400">
              Start session
            </button>
          </div>
        </aside>

        <section className="rounded-lg border border-slate-800 bg-slate-900/90 p-4 shadow-sm shadow-black/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Session</div>
              <h2 className="mt-1 text-xl font-semibold">Typing workspace</h2>
            </div>
            <Link className="text-sm text-cyan-300 hover:text-cyan-200" href="/api/docs">
              OpenAPI docs
            </Link>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <article className="rounded-md border border-slate-800 bg-slate-950 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">Queue</div>
              <div className="mt-3 space-y-2 text-sm text-slate-300">
                <div className="rounded border border-slate-800 px-3 py-2">hello</div>
                <div className="rounded border border-slate-800 px-3 py-2">travel</div>
                <div className="rounded border border-slate-800 px-3 py-2">computer</div>
              </div>
            </article>

            <article className="rounded-md border border-slate-800 bg-slate-950 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">Stats</div>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded border border-slate-800 px-3 py-2">
                  <dt className="text-slate-400">Words</dt>
                  <dd className="mt-1 text-lg font-semibold">12</dd>
                </div>
                <div className="rounded border border-slate-800 px-3 py-2">
                  <dt className="text-slate-400">Accuracy</dt>
                  <dd className="mt-1 text-lg font-semibold">96%</dd>
                </div>
                <div className="rounded border border-slate-800 px-3 py-2">
                  <dt className="text-slate-400">Mistakes</dt>
                  <dd className="mt-1 text-lg font-semibold">2</dd>
                </div>
                <div className="rounded border border-slate-800 px-3 py-2">
                  <dt className="text-slate-400">Time</dt>
                  <dd className="mt-1 text-lg font-semibold">01:24</dd>
                </div>
              </dl>
            </article>
          </div>

          <div className="mt-4 rounded-md border border-slate-800 bg-slate-950 p-4">
            <label className="block text-xs uppercase tracking-wide text-slate-400" htmlFor="answer">
              Input
            </label>
            <input
              id="answer"
              className="mt-2 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none placeholder:text-slate-500"
              placeholder="Type the answer here"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
