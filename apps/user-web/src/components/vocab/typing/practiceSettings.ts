import type { IconName } from "./primitives";

/** Chế độ phiên: Luyện tập (mở tuỳ chọn) vs Kiểm tra (khoá tuỳ chọn để chấm
 *  công bằng). Xem doc/v1.1-m2-plan.md. */
export type Drill = "practice" | "test";

export type HintLevel = "off" | "underline" | "first" | "full";
export type ExampleMode = "off" | "show" | "cloze";
export type FeedbackMode = "mark" | "char" | "reveal";
export type RepeatMode = "none" | "once" | "until";

/** 4 tuỳ chọn của chế độ Luyện tập M2. */
export interface PracticeSettings {
  hint: HintLevel; // mức gợi ý hiển thị đáp án trước khi gõ
  example: ExampleMode; // câu ví dụ
  feedback: FeedbackMode; // cách báo lỗi khi gõ sai
  repeat: RepeatMode; // xử lý từ gõ sai trong phiên
}

/** Mặc định khi Luyện tập. */
export const DEFAULT_PRACTICE_SETTINGS: PracticeSettings = {
  hint: "underline",
  example: "show",
  feedback: "char",
  repeat: "once",
};

/** Giá trị bị khoá khi Kiểm tra — ẩn mọi phao, chấm một lần. */
export const TEST_SETTINGS: PracticeSettings = {
  hint: "off",
  example: "off",
  feedback: "mark",
  repeat: "none",
};

export interface SettingOption {
  value: string;
  label: string;
}
export interface SettingDef {
  key: keyof PracticeSettings;
  label: string;
  desc: string;
  icon: IconName;
  options: SettingOption[];
}

/** Định nghĩa UI cho từng dòng cấu hình (dùng chung ở drawer). */
export const PRACTICE_SETTING_DEFS: SettingDef[] = [
  {
    key: "hint",
    label: "Hiện mờ đáp án",
    desc: "",
    icon: "target",
    options: [
      { value: "off", label: "Tắt" },
      { value: "underline", label: "Gạch chân (độ dài)" },
      { value: "first", label: "Chữ đầu" },
      { value: "full", label: "Mờ cả từ" },
    ],
  },
  {
    key: "example",
    label: "Câu ví dụ",
    desc: "",
    icon: "book",
    options: [
      { value: "off", label: "Tắt" },
      { value: "show", label: "Hiện" },
      { value: "cloze", label: "Điền khuyết" },
    ],
  },
  {
    key: "feedback",
    label: "Phản hồi khi sai",
    desc: "",
    icon: "x",
    options: [
      { value: "mark", label: "Chỉ báo sai" },
      { value: "char", label: "Chỉ ký tự lỗi" },
      { value: "reveal", label: "Lộ đáp án" },
    ],
  },
  {
    key: "repeat",
    label: "Lặp lại từ sai",
    desc: "",
    icon: "refresh",
    options: [
      { value: "none", label: "Không" },
      { value: "once", label: "1 lần cuối vòng" },
      { value: "until", label: "Đến khi đúng" },
    ],
  },
];

/** Giá trị hiệu lực: Kiểm tra → khoá về TEST_SETTINGS, Luyện tập → cấu hình của
 *  người dùng. */
export function settingsForDrill(drill: Drill, custom: PracticeSettings): PracticeSettings {
  return drill === "test" ? TEST_SETTINGS : custom;
}
