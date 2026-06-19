/* Nút góp ý — dẫn người dùng sang Google Form (mở tab mới).
   Cấu hình URL qua env NEXT_PUBLIC_FEEDBACK_FORM_URL (hoặc sửa hằng FORM_URL).
   Không state, không panel — chỉ một liên kết. */

const FORM_URL =
  process.env.NEXT_PUBLIC_FEEDBACK_FORM_URL ?? "https://forms.gle/REPLACE_WITH_YOUR_FORM";

function ChatIcon({ size = 18, stroke = 3 }: { size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 5h16v11H9l-4 4v-4H4z" />
        <path d="M8 9.5h8M8 12.5h5" />
      </g>
    </svg>
  );
}

export function FeedbackButton() {
  return (
    <a
      href={FORM_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="k-btn k-btn--primary"
      aria-label="Gửi góp ý (mở Google Form ở tab mới)"
      style={{
        position: "fixed",
        right: 20,
        bottom: 20,
        zIndex: 50,
        padding: "12px 16px",
        textDecoration: "none",
      }}
    >
      <ChatIcon size={18} /> Góp ý
    </a>
  );
}
