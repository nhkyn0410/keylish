"use client";

import "driver.js/dist/driver.css";
import { NeoButton } from "@/components/ui/NeoButton";

/**
 * Demo onboarding tour bằng Driver.js (F-013).
 * Driver.js được nạp động (dynamic import) trong Client Component.
 */
export function TourButton() {
  async function startTour() {
    const { driver } = await import("driver.js");
    const tour = driver({
      popoverClass: "keylish-neo",
      showProgress: true,
      nextBtnText: "Tiếp",
      prevBtnText: "Trước",
      doneBtnText: "Xong",
      steps: [
        {
          element: "#demo-typing",
          popover: {
            title: "Gõ từ vựng",
            description:
              "Nơi bạn luyện gõ từng ký tự — đúng (xanh), sai (đỏ), con trỏ (đen).",
          },
        },
        {
          element: "#demo-buttons",
          popover: {
            title: "Nút thao tác",
            description:
              "Các nút theo phong cách keycap — nhấn xuống như phím bàn phím.",
          },
        },
      ],
    });
    tour.drive();
  }

  return (
    <NeoButton variant="info" type="button" onClick={startTour}>
      Xem hướng dẫn (demo)
    </NeoButton>
  );
}
