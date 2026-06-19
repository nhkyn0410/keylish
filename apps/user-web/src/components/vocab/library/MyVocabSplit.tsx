"use client";

/* MyVocabSplit — "Kho của tôi" (V2.1): xem/quản lý kho cá nhân + tạo từ mới.
   Cùng layout Split với kho hệ thống. Dữ liệu từ /api/user/vocab.
   Tạo từ → dedup-on-add: linked | created | suggest (gợi ý biến thể). */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { CefrLevel, UserVocabEntryDto } from "@keylish/shared";
import { Icon } from "@/components/vocab/typing/primitives";
import {
  ApiError,
  createUserVocab,
  deleteUserVocab,
  fetchUserVocab,
  getErrorMessage,
  pickSystemWord,
} from "@/infra/user/userApi";
import { LvBadge, SearchGlyph, speak } from "./VocabLibrarySplit";

const LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
const HARD_SHADOW = "3px 3px 0 0 #000";

const enOf = (e: UserVocabEntryDto) => e.word?.en ?? e.custom?.en ?? "";
const viOf = (e: UserVocabEntryDto) => e.word?.vi ?? e.custom?.vi ?? "";
const lvlOf = (e: UserVocabEntryDto) => e.word?.level ?? e.custom?.level ?? null;
const exOf = (e: UserVocabEntryDto) => e.word?.example ?? e.custom?.example ?? null;

export function MyVocabSplit() {
  const router = useRouter();
  const [entries, setEntries] = useState<UserVocabEntryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selId, setSelId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchUserVocab();
      setEntries(res.items);
      setAuthError(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setAuthError(true);
      else setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => enOf(e).toLowerCase().includes(q) || viOf(e).toLowerCase().includes(q));
  }, [entries, query]);

  const sel = filtered.find((e) => e.id === selId) ?? filtered[0] ?? null;

  async function handleDelete(id: string) {
    setError(null);
    try {
      await deleteUserVocab(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (authError) {
    return (
      <div className="k-screen k-b" style={{ height: "100%", minHeight: 360, alignItems: "center", justifyContent: "center" }}>
        <div className="k-card" style={{ padding: "28px 30px", textAlign: "center", maxWidth: 420 }}>
          <div className="k-badge k-badge--violet" style={{ marginBottom: 12 }}>
            Kho của tôi
          </div>
          <h2 className="k-display" style={{ fontSize: 26, marginBottom: 10 }}>
            Đăng nhập để dùng kho cá nhân
          </h2>
          <p style={{ fontWeight: 600, opacity: 0.7, marginBottom: 18, lineHeight: 1.5 }}>
            Lưu từ từ kho hệ thống hoặc tạo từ riêng để luyện tập theo nhu cầu của bạn.
          </p>
          <Link href="/login" className="k-btn k-btn--primary">
            Đăng nhập <Icon name="arrow" size={18} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="k-screen k-b" style={{ height: "100%", minHeight: 0 }}>
      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        {/* LEFT — search + count */}
        <div
          style={{
            flex: "0 0 230px",
            borderRight: "4px solid #000",
            padding: "20px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
            background: "var(--neo-bg)",
          }}
        >
          <div
            className="k-b k-sh-sm"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              background: query ? "var(--neo-violet-soft)" : "var(--neo-white)",
            }}
          >
            <SearchGlyph size={18} stroke={3} style={{ flex: "0 0 auto" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm trong kho…"
              aria-label="Tìm trong kho của tôi"
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                fontFamily: "var(--font)",
                fontWeight: 700,
                fontSize: 14,
                width: "100%",
                minWidth: 0,
              }}
            />
          </div>

          <button className="k-btn k-btn--sm" onClick={() => setShowCreate(true)} style={{ width: "100%" }}>
            + Tạo từ mới
          </button>

          <div style={{ marginTop: "auto", fontSize: 12, fontWeight: 700, opacity: 0.55, lineHeight: 1.4 }}>
            {entries.length} từ trong kho
            <br />
            {entries.filter((e) => e.source === "custom").length} từ tự tạo
          </div>
        </div>

        {/* MIDDLE — danh sách */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            overflow: "auto",
          }}
        >
          <div className="k-h-eyebrow" style={{ color: "#7a6a00" }}>
            Kho của tôi {loading ? "· đang nạp…" : `· ${filtered.length}`}
          </div>

          {error ? (
            <div className="k-b2" style={{ padding: 12, background: "var(--neo-red-soft)", fontWeight: 800, fontSize: 13 }}>
              {error}
            </div>
          ) : null}

          {!loading && filtered.length === 0 ? (
            <div className="k-card" style={{ padding: 18, fontWeight: 700, opacity: 0.75, lineHeight: 1.5 }}>
              Kho của bạn đang trống. Thêm từ ở <strong>Kho hệ thống</strong> hoặc bấm{" "}
              <strong>Tạo từ mới</strong>.
            </div>
          ) : null}

          {filtered.map((e) => {
            const on = sel != null && sel.id === e.id;
            return (
              <button
                key={e.id}
                onClick={() => setSelId(e.id)}
                className="k-b2"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "10px 14px",
                  textAlign: "left",
                  cursor: "pointer",
                  fontFamily: "var(--font)",
                  background: on ? "var(--neo-yellow)" : "var(--neo-white)",
                  boxShadow: on ? "var(--sh-md)" : HARD_SHADOW,
                  transform: on ? "translate(-2px,-2px)" : undefined,
                }}
              >
                <span style={{ fontWeight: 900, fontSize: 16, width: 124, flex: "0 0 auto" }}>{enOf(e)}</span>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 13.5,
                    opacity: 0.75,
                    flex: 1,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {viOf(e)}
                </span>
                <LvBadge lv={lvlOf(e)} />
                <span
                  className="k-b2"
                  style={{
                    fontSize: 10,
                    fontWeight: 900,
                    padding: "2px 6px",
                    flex: "0 0 auto",
                    background: e.source === "custom" ? "var(--neo-violet-soft)" : "var(--neo-white)",
                    boxShadow: "none",
                  }}
                >
                  {e.source === "custom" ? "Tự tạo" : "Hệ thống"}
                </span>
                <Icon name="chevright" size={16} stroke={3} style={{ opacity: on ? 1 : 0.35, flex: "0 0 auto" }} />
              </button>
            );
          })}
        </div>

        {/* RIGHT — chi tiết */}
        <div
          style={{
            flex: "0 0 360px",
            borderLeft: "4px solid #000",
            background: "var(--neo-violet)",
            position: "relative",
            padding: "24px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            overflow: "auto",
          }}
        >
          <div className="k-halftone" style={{ position: "absolute", inset: 0, opacity: 0.12, pointerEvents: "none" }} />

          {sel ? (
            <>
              <div className="k-card" style={{ padding: "20px 20px 16px", position: "relative", zIndex: 1 }}>
                <div className="k-badge k-badge--white rn-2" style={{ position: "absolute", top: -13, left: 14 }}>
                  Chi tiết từ
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                  <span style={{ fontWeight: 900, fontSize: 32, lineHeight: 1 }}>{enOf(sel)}</span>
                  <button
                    className="k-b2 k-sh-sm"
                    onClick={() => speak(enOf(sel))}
                    aria-label={`Phát âm ${enOf(sel)}`}
                    style={{
                      width: 38,
                      height: 38,
                      background: "var(--neo-yellow)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: "0 0 auto",
                      cursor: "pointer",
                    }}
                  >
                    <Icon name="volume" size={20} stroke={3} />
                  </button>
                </div>
                {sel.word?.ipa ? (
                  <div style={{ fontWeight: 500, fontSize: 15, opacity: 0.65, marginTop: 4 }}>{sel.word.ipa}</div>
                ) : null}
                <div style={{ height: 3, background: "#000", margin: "12px 0" }} />
                <div style={{ fontWeight: 800, fontSize: 19 }}>{viOf(sel)}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <LvBadge lv={lvlOf(sel)} />
                  <span className="k-badge k-badge--white" style={{ boxShadow: "none", fontSize: 10 }}>
                    {sel.source === "custom" ? "Tự tạo" : "Hệ thống"}
                  </span>
                  {sel.word?.topic ? (
                    <span className="k-badge k-badge--white" style={{ boxShadow: "none", fontSize: 10 }}>
                      {sel.word.topic}
                    </span>
                  ) : null}
                </div>
              </div>

              {exOf(sel) ? (
                <div
                  className="k-card"
                  style={{ padding: "14px 16px", position: "relative", zIndex: 1, background: "var(--neo-yellow-soft)" }}
                >
                  <div className="k-h-eyebrow" style={{ fontSize: 11, marginBottom: 6 }}>
                    Ví dụ
                  </div>
                  <div className="k-focus" style={{ fontWeight: 600, fontSize: 15.5, lineHeight: 1.5, fontStyle: "italic" }}>
                    “{exOf(sel)}”
                  </div>
                </div>
              ) : null}

              <div style={{ flex: 1 }} />
              <div style={{ display: "flex", gap: 10, position: "relative", zIndex: 1 }}>
                <button
                  className="k-btn k-btn--sm k-btn--danger"
                  onClick={() => handleDelete(sel.id)}
                  aria-label="Xóa khỏi kho"
                >
                  <Icon name="x" size={16} stroke={3.5} /> Xóa
                </button>
                <button
                  className="k-btn k-btn--sm k-btn--primary"
                  onClick={() => router.push("/typing")}
                  style={{ flex: 1 }}
                >
                  Luyện từ này <Icon name="arrow" size={18} />
                </button>
              </div>
            </>
          ) : (
            <div className="k-card" style={{ padding: 18, position: "relative", zIndex: 1, fontWeight: 700 }}>
              {loading ? "Đang nạp kho của bạn…" : "Chọn một từ để xem chi tiết."}
            </div>
          )}
        </div>
      </div>

      {showCreate ? (
        <CreateWordForm
          onClose={() => setShowCreate(false)}
          onDone={() => {
            setShowCreate(false);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}

type Candidate = { id?: string; en: string; vi: string; level?: string | null; ipa?: string | null };

function CreateWordForm({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [en, setEn] = useState("");
  const [vi, setVi] = useState("");
  const [example, setExample] = useState("");
  const [level, setLevel] = useState<CefrLevel | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggest, setSuggest] = useState<Candidate[] | null>(null);

  async function submit(allowVariant: boolean) {
    if (!en.trim() || !vi.trim()) {
      setError("Cần nhập cả từ tiếng Anh và nghĩa tiếng Việt.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await createUserVocab({
        en: en.trim(),
        vi: vi.trim(),
        example: example.trim() ? example.trim() : null,
        level,
        allowVariant,
      });
      if (res.status === "suggest") {
        setSuggest(res.candidates);
        return;
      }
      onDone(); // linked | created
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setError("Đăng nhập để lưu vào kho của bạn.");
      else if (err instanceof ApiError && err.status === 409) setError("Từ này đã có trong kho của bạn.");
      else setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function useBase(c: Candidate) {
    if (!c.id) return;
    setSubmitting(true);
    setError(null);
    try {
      await pickSystemWord(c.id);
      onDone();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) onDone();
      else setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = {
    fontFamily: "var(--font)",
    fontWeight: 700,
    fontSize: 15,
    padding: "10px 12px",
    background: "var(--neo-white)",
    outline: "none",
    width: "100%",
  } as const;

  return (
    <div className="k-welcome-backdrop" onClick={onClose}>
      <div
        className="k-card"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(440px, 100%)", padding: "24px 24px 22px", background: "var(--neo-bg)" }}
      >
        <div className="k-badge k-badge--violet" style={{ marginBottom: 14 }}>
          Tạo từ mới
        </div>

        {suggest ? (
          <div>
            <p style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.5, marginBottom: 12 }}>
              “{en.trim()}” có thể là biến thể của từ đã có trong kho hệ thống. Dùng từ gốc?
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {suggest.map((c) => (
                <button
                  key={c.id ?? c.en}
                  className="k-b2"
                  onClick={() => useBase(c)}
                  disabled={submitting}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    cursor: "pointer",
                    background: "var(--neo-white)",
                    boxShadow: HARD_SHADOW,
                    fontFamily: "var(--font)",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontWeight: 900, fontSize: 16 }}>{c.en}</span>
                  <span style={{ fontWeight: 700, fontSize: 13, opacity: 0.7, flex: 1 }}>{c.vi}</span>
                  <Icon name="arrow" size={16} />
                </button>
              ))}
            </div>
            {error ? (
              <p style={{ fontSize: 12, fontWeight: 800, color: "var(--neo-red)", marginBottom: 10 }}>{error}</p>
            ) : null}
            <div style={{ display: "flex", gap: 10 }}>
              <button className="k-btn k-btn--sm" onClick={() => submit(true)} disabled={submitting} style={{ flex: 1 }}>
                Giữ “{en.trim()}” riêng
              </button>
              <button className="k-btn k-btn--sm k-btn--ghost k-b2" onClick={() => setSuggest(null)} disabled={submitting}>
                Quay lại
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={{ display: "grid", gap: 5, fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>
              Từ tiếng Anh
              <input className="k-b2" style={inputStyle} value={en} maxLength={120} onChange={(e) => setEn(e.target.value)} autoFocus />
            </label>
            <label style={{ display: "grid", gap: 5, fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>
              Nghĩa tiếng Việt
              <input className="k-b2" style={inputStyle} value={vi} maxLength={240} onChange={(e) => setVi(e.target.value)} />
            </label>
            <label style={{ display: "grid", gap: 5, fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>
              Ví dụ (tùy chọn)
              <input className="k-b2" style={inputStyle} value={example} maxLength={500} onChange={(e) => setExample(e.target.value)} />
            </label>
            <div style={{ display: "grid", gap: 5 }}>
              <span style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>Cấp độ (tùy chọn)</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {LEVELS.map((lv) => (
                  <button
                    key={lv}
                    className="k-chip k-chip--level"
                    data-on={level === lv ? "1" : "0"}
                    onClick={() => setLevel(level === lv ? null : lv)}
                    style={{ minWidth: 44, padding: "5px 8px", fontSize: 12, boxShadow: HARD_SHADOW }}
                  >
                    {lv}
                  </button>
                ))}
              </div>
            </div>

            {error ? (
              <p style={{ fontSize: 12, fontWeight: 800, color: "var(--neo-red)" }}>{error}</p>
            ) : null}

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button className="k-btn k-btn--sm k-btn--primary" onClick={() => submit(false)} disabled={submitting} style={{ flex: 1 }}>
                {submitting ? "Đang lưu…" : "Thêm vào kho"}
              </button>
              <button className="k-btn k-btn--sm k-btn--ghost k-b2" onClick={onClose} disabled={submitting}>
                Hủy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
