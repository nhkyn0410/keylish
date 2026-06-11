"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { isHomeTourDone, markHomeTourDone, startHomeTour } from "@/lib/tour";

const HELLO_MASCOT_SIZE = 240;

export function HomeWelcomeTour() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const okRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isHomeTourDone()) setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    okRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") skipTour();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function skipTour() {
    markHomeTourDone();
    setOpen(false);
  }

  function beginTour() {
    markHomeTourDone();
    setOpen(false);
    window.setTimeout(() => startHomeTour(() => router.push("/typing")), 120);
  }

  if (!open) return null;

  return (
    <div className="k-welcome-backdrop" role="presentation">
      <section
        aria-labelledby="home-welcome-title"
        aria-modal="true"
        className="k-welcome-modal k-card"
        role="dialog"
      >
        <Image
          src="/mascot/hello.png"
          alt=""
          width={HELLO_MASCOT_SIZE}
          height={HELLO_MASCOT_SIZE}
          priority
          style={{ width: HELLO_MASCOT_SIZE, height: "auto", margin: "0 auto" }}
        />
        <div className="k-badge k-badge--violet">Chào mừng</div>
        <h2 id="home-welcome-title" className="k-display k-welcome-title">
          Xin chào, mình là KeyLish
        </h2>
        <p className="k-welcome-copy">
          Bạn có muốn xem sơ lược cách học từ vựng bằng cách gõ trước khi bắt đầu không?
        </p>
        <div className="k-welcome-actions">
          <button ref={okRef} type="button" className="k-btn k-btn--primary" onClick={beginTour}>
            Ok!
          </button>
          <button type="button" className="k-btn k-btn--ghost k-b2" onClick={skipTour}>
            Bỏ qua
          </button>
        </div>
      </section>
    </div>
  );
}
