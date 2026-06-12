// Onboarding tour (F-013) — Driver.js, nạp động trong client component.
// Hai tour: trang chủ (giới thiệu) và màn Thiết lập phiên (tự chạy lần đầu).
import "driver.js/dist/driver.css";
import type { Config } from "driver.js";

const SETUP_TOUR_KEY = "keylish:tour:setup";
export const HOME_TOUR_KEY = "keylish:tour:home";

let homeTourDoneInMemory = false;

const TOUR_CLASS = "keylish-neo";
const TIP_LEFT_CLASS = `${TOUR_CLASS} keylish-tip keylish-tip-left`;
const TIP_RIGHT_CLASS = `${TOUR_CLASS} keylish-tip keylish-tip-right`;

const BASE: Config = {
  popoverClass: TOUR_CLASS,
  stagePadding: 8,
  stageRadius: 0,
  overlayOpacity: 0.62,
  showProgress: true,
  progressText: "Bước {{current}}/{{total}}",
  nextBtnText: "Tiếp",
  prevBtnText: "Trước",
  doneBtnText: "Xong",
};

export async function startHomeTour(onFinish?: () => void) {
  const { driver } = await import("driver.js");
  const tour = driver({
    ...BASE,
    steps: [
      {
        // Neo vào phần tử NHỎ (nút/heading) để chỉ vùng nhỏ sáng lên, popover
        // nằm ở vùng tối cạnh bên — không đè lên phần highlight, không che UI.
        element: "#tour-hero a.k-btn--primary",
        popover: {
          popoverClass: TIP_RIGHT_CLASS,
          title: "Bắt đầu từ một phiên ngắn",
          description:
            "KeyLish biến việc học từ vựng thành một phiên gõ rõ ràng: chọn nguồn từ, chọn cách luyện, rồi tập trung vào từng từ.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "#demo-typing .mt-6",
        popover: {
          popoverClass: TIP_LEFT_CLASS,
          title: "Thấy đúng sai ngay khi gõ",
          description:
            "Mỗi ký tự có trạng thái riêng: đúng, sai, con trỏ hiện tại và phần còn lại. Bạn biết cần sửa ở đâu ngay lập tức.",
          side: "right",
          align: "center",
        },
      },
      {
        element: "#tour-how h2",
        popover: {
          popoverClass: TIP_RIGHT_CLASS,
          title: "Thiết lập theo đúng nhu cầu",
          description:
            "Lọc cấp độ CEFR, chọn chủ đề, chọn M2 hoặc M1, rồi luyện 20, 50 hoặc 100 từ trong một vòng gọn.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "#tour-cta h2",
        popover: {
          popoverClass: TIP_LEFT_CLASS,
          title: "Vào màn luyện thử",
          description:
            "Khi vào màn luyện lần đầu, KeyLish sẽ tiếp tục hướng dẫn cách chọn cấp độ, chủ đề và phương pháp.",
          side: "top",
          align: "start",
          doneBtnText: "Vào luyện ngay",
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

export function isHomeTourDone() {
  try {
    return homeTourDoneInMemory || localStorage.getItem(HOME_TOUR_KEY) === "done";
  } catch {
    return homeTourDoneInMemory;
  }
}

export function markHomeTourDone() {
  homeTourDoneInMemory = true;
  try {
    localStorage.setItem(HOME_TOUR_KEY, "done");
  } catch {
    // localStorage bị chặn → chỉ bỏ qua ghi nhớ, tour vẫn hoạt động trong phiên hiện tại.
  }
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
          popoverClass: TIP_RIGHT_CLASS,
          title: "1 · Cấp độ CEFR",
          description:
            "Chọn một hay nhiều cấp A1–C2. Kho hiện có hơn 10.000 từ kèm nghĩa tiếng Việt.",
          side: "right",
        },
      },
      {
        element: "#tour-topics",
        popover: {
          popoverClass: TIP_RIGHT_CLASS,
          title: "2 · Chủ đề (tùy chọn)",
          description: "Mặc định luyện tất cả. Chỉ chọn chủ đề khi muốn thu hẹp phạm vi.",
          side: "right",
        },
      },
      {
        element: "#tour-methods",
        popover: {
          popoverClass: TIP_LEFT_CLASS,
          title: "3 · Phương pháp",
          description: "M2: nhìn nghĩa tiếng Việt → gõ từ tiếng Anh. M1: nghe phát âm → gõ lại.",
          side: "left",
        },
      },
      {
        element: "#tour-size",
        popover: {
          popoverClass: TIP_LEFT_CLASS,
          title: "4 · Số từ mỗi phiên",
          description:
            "Chọn 20, 50 hoặc 100 từ. Nếu bộ lọc có ít từ hơn lựa chọn, KeyLish sẽ tự rút phiên về đúng số từ hiện có.",
          side: "left",
        },
      },
      {
        element: "#tour-start",
        popover: {
          popoverClass: TIP_RIGHT_CLASS,
          title: "5 · Bắt đầu!",
          description:
            "Kiểm tra số từ khớp bộ lọc ở thanh dưới, rồi nhấn nút để vào phiên luyện với số từ vừa chọn.",
          side: "top",
          align: "end",
        },
      },
    ],
  });
  tour.drive();
}
