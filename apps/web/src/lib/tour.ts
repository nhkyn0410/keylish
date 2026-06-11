// Onboarding tour (F-013) — Driver.js, nạp động trong client component.
// Hai tour: trang chủ (giới thiệu) và màn Thiết lập phiên (tự chạy lần đầu).
import "driver.js/dist/driver.css";
import type { Config } from "driver.js";

const SETUP_TOUR_KEY = "keylish:tour:setup";

const BASE: Config = {
  popoverClass: "keylish-neo",
  stagePadding: 8,
  stageRadius: 0,
  overlayOpacity: 0.62,
  showProgress: true,
  progressText: "Bước {{current}}/{{total}}",
  nextBtnText: "Tiếp →",
  prevBtnText: "← Trước",
  doneBtnText: "Xong",
};

export async function startHomeTour(onFinish?: () => void) {
  const { driver } = await import("driver.js");
  const tour = driver({
    ...BASE,
    steps: [
      {
        element: "#tour-hero",
        popover: {
          title: "KeyLish là gì?",
          description: "Học từ vựng tiếng Anh bằng chính việc gõ phím: chọn cấp độ CEFR, chọn chủ đề, rồi gõ từng ký tự.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "#demo-typing",
        popover: {
          title: "Phản hồi từng ký tự",
          description: "Đúng = xanh kèm dấu ✓, sai = đỏ kèm ✗, ô đen là con trỏ — không bao giờ báo đúng/sai chỉ bằng màu.",
          side: "top",
        },
      },
      {
        element: "#tour-how",
        popover: {
          title: "Mỗi phiên 3 bước",
          description: "Chọn nguồn từ → chọn phương pháp → gõ 20 từ. Từ gõ sai tự lặp lại ở cuối vòng.",
          side: "top",
        },
      },
      {
        element: "#tour-cta",
        popover: {
          title: "Sẵn sàng?",
          description: "Vào màn luyện — lần đầu sẽ có hướng dẫn từng bước ngay trong đó.",
          side: "bottom",
          doneBtnText: "Vào luyện ngay →",
          onNextClick: () => {
            tour.destroy();
            onFinish?.();
          },
        },
      },
    ],
  });
  tour.drive();
}

export function isSetupTourDone() {
  try {
    return localStorage.getItem(SETUP_TOUR_KEY) === "done";
  } catch {
    return true;
  }
}

export async function startSetupTour() {
  const { driver } = await import("driver.js");
  const tour = driver({
    ...BASE,
    onDestroyed: () => {
      try {
        localStorage.setItem(SETUP_TOUR_KEY, "done");
      } catch {
        // localStorage bị chặn → tour sẽ chạy lại lần sau, không sao.
      }
    },
    steps: [
      {
        element: "#tour-levels",
        popover: {
          title: "1 · Cấp độ CEFR",
          description: "Chọn một hay nhiều cấp A1–C2. Kho hiện có hơn 10.000 từ kèm nghĩa tiếng Việt.",
          side: "right",
        },
      },
      {
        element: "#tour-topics",
        popover: {
          title: "2 · Chủ đề (tùy chọn)",
          description: "Mặc định luyện tất cả. Chỉ chọn chủ đề khi muốn thu hẹp phạm vi.",
          side: "right",
        },
      },
      {
        element: "#tour-methods",
        popover: {
          title: "3 · Phương pháp",
          description: "M2: nhìn nghĩa tiếng Việt → gõ từ tiếng Anh. M1: nghe phát âm → gõ lại.",
          side: "left",
        },
      },
      {
        element: "#tour-start",
        popover: {
          title: "Bắt đầu!",
          description: "Số từ khớp bộ lọc hiển thị bên trái. Nhấn nút để vào phiên luyện 20 từ.",
          side: "top",
          align: "end",
        },
      },
    ],
  });
  tour.drive();
}
