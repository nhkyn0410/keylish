import { Injectable, Logger } from "@nestjs/common";

type DeliveryResult = { delivered: boolean };

/**
 * Minimal, dependency-free mailer. When RESEND_API_KEY + AUTH_RESET_EMAIL_FROM
 * are configured it sends through Resend's REST API (global fetch, no SDK).
 * Otherwise it logs the reset link so local/dev flows stay testable without an
 * email provider. The caller never branches on delivery success: the response
 * to the client is identical regardless (no user enumeration).
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendPasswordReset(email: string, token: string): Promise<DeliveryResult> {
    const link = this.resetLink(token);
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const from = process.env.AUTH_RESET_EMAIL_FROM?.trim();

    if (!apiKey || !from) {
      this.logger.warn(
        `Password reset email not sent (RESEND_API_KEY/AUTH_RESET_EMAIL_FROM unset). Link for ${email}: ${link}`
      );
      return { delivered: false };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: email,
          subject: "Đặt lại mật khẩu KeyLish",
          html: this.resetHtml(link),
          text: `Đặt lại mật khẩu KeyLish: ${link}\nLiên kết hết hạn sau 2 giờ. Nếu bạn không yêu cầu, bỏ qua email này.`,
        }),
      });

      if (!response.ok) {
        this.logger.error(`Resend responded ${response.status} when sending reset email.`);
        return { delivered: false };
      }

      return { delivered: true };
    } catch (error) {
      this.logger.error(
        "Failed to send reset email: " + (error instanceof Error ? error.message : String(error))
      );
      return { delivered: false };
    }
  }

  private resetLink(token: string) {
    const base = (process.env.WEB_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
    return base + "/reset-password?token=" + encodeURIComponent(token);
  }

  private resetHtml(link: string) {
    return [
      '<div style="font-family:system-ui,sans-serif;line-height:1.5">',
      "<h2>Đặt lại mật khẩu KeyLish</h2>",
      "<p>Bấm vào liên kết dưới đây để đặt mật khẩu mới. Liên kết hết hạn sau 2 giờ.</p>",
      `<p><a href="${link}">${link}</a></p>`,
      "<p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>",
      "</div>",
    ].join("");
  }
}
