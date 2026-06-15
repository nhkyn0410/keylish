import { z } from "zod";
import { AuthProvider } from "@keylish/db";

const emailSchema = z.string().trim().toLowerCase().email().max(320);
const passwordSchema = z.string().min(12).max(128);
const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(64)
  .regex(/^[a-zA-Z0-9_.-]+$/, "Username must use letters, numbers, dot, underscore, or dash.");

const displayNameSchema = z.string().trim().min(1).max(120).optional();

export const UserRegisterSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
});

export const UserLoginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const AdminLoginSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

export const PasswordChangeSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: passwordSchema,
});

export const ForgotPasswordSchema = z.object({
  email: emailSchema,
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(24).max(512),
  password: passwordSchema,
});

export const UpdateProfileSchema = z.object({
  displayName: displayNameSchema,
  avatarUrl: z.string().trim().url().max(512).nullable().optional(),
});

export const UpdateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "DISABLED", "DELETED"]),
});

export const UpdateAdminPasswordSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: passwordSchema,
});

export const CsrfHeaderSchema = z.object({
  token: z.string().min(16).max(256),
});

export type UserRegisterDto = z.infer<typeof UserRegisterSchema>;
export type UserLoginDto = z.infer<typeof UserLoginSchema>;
export type AdminLoginDto = z.infer<typeof AdminLoginSchema>;
export type PasswordChangeDto = z.infer<typeof PasswordChangeSchema>;
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;
export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;
export type UpdateUserStatusDto = z.infer<typeof UpdateUserStatusSchema>;
export type UpdateAdminPasswordDto = z.infer<typeof UpdateAdminPasswordSchema>;

export type AuthDomain = "user" | "admin";
export type UserSessionPayload = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
};

export type AdminSessionPayload = {
  id: string;
  adminId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
};

export type UserProfileDto = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type AdminLoginResponseDto = {
  ok: true;
};

export { AuthProvider };
