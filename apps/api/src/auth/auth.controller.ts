import { Body, Controller, Get, HttpCode, Patch, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { AdminGuard, CsrfGuard, UserGuard, type Request } from "./auth.guard";
import type { AdminSessionPayload, UserSessionPayload } from "./auth.dto";

type Response = {
  cookie(name: string, value: string, options?: Record<string, unknown>): unknown;
  clearCookie(name: string, options?: Record<string, unknown>): unknown;
};

type RequestWithAuth = Request & {
  userSession?: UserSessionPayload;
  adminSession?: AdminSessionPayload;
};

@ApiTags("auth")
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("user/csrf")
  @ApiOperation({ summary: "Issue user CSRF token" })
  @ApiOkResponse({ description: "User CSRF token." })
  getUserCsrf(@Res({ passthrough: true }) response: Response) {
    const token = this.authService.issueCsrfToken();
    this.authService.setCsrfCookie(response, "user", token);
    return { token };
  }

  @Post("user/register")
  @UseGuards(CsrfGuard)
  @HttpCode(200)
  @ApiOperation({ summary: "Register user" })
  async registerUser(
    @Body() body: unknown,
    @Req() request: RequestWithAuth,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.authService.registerUser(body, request);
    this.authService.setSessionCookies(response, "user", result.token, result.csrf.csrf);
    return { ok: true as const, user: result.user };
  }

  @Post("user/login")
  @UseGuards(CsrfGuard)
  @HttpCode(200)
  @ApiOperation({ summary: "Login user" })
  async loginUser(
    @Body() body: unknown,
    @Req() request: RequestWithAuth,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.authService.loginUser(body, request);
    this.authService.setSessionCookies(response, "user", result.token, result.csrf.csrf);
    return { ok: true as const, user: result.user };
  }

  @Post("user/logout")
  @UseGuards(UserGuard, CsrfGuard)
  @HttpCode(200)
  @ApiOperation({ summary: "Logout current user session" })
  async logoutUser(
    @Req() request: RequestWithAuth,
    @Res({ passthrough: true }) response: Response
  ) {
    await this.authService.logoutUser(request.userSession!);
    this.authService.clearSessionCookies(response, "user");
    return { ok: true as const };
  }

  @Post("user/logout-all")
  @UseGuards(UserGuard, CsrfGuard)
  @HttpCode(200)
  async logoutAllUser(
    @Req() request: RequestWithAuth,
    @Res({ passthrough: true }) response: Response
  ) {
    await this.authService.logoutAllUserSessions(request.userSession!.userId);
    this.authService.clearSessionCookies(response, "user");
    return { ok: true as const };
  }

  @Get("user/profile")
  @UseGuards(UserGuard)
  @ApiCookieAuth("user")
  @ApiOkResponse({ description: "Current user profile." })
  async getUserProfile(@Req() request: RequestWithAuth) {
    return this.authService.getUserProfile(request.userSession!);
  }

  @Patch("user/profile")
  @UseGuards(UserGuard, CsrfGuard)
  @ApiCookieAuth("user")
  async updateUserProfile(@Body() body: unknown, @Req() request: RequestWithAuth) {
    return this.authService.updateUserProfile(request.userSession!, body);
  }

  @Post("user/forgot-password")
  @UseGuards(CsrfGuard)
  async forgotPassword(@Body() body: unknown, @Req() request: RequestWithAuth) {
    return this.authService.forgotPassword(body, request);
  }

  @Post("user/reset-password")
  @UseGuards(CsrfGuard)
  async resetPassword(@Body() body: unknown, @Req() request: RequestWithAuth) {
    return this.authService.resetPassword(body, request);
  }

  @Post("user/change-password")
  @UseGuards(UserGuard, CsrfGuard)
  async changeUserPassword(@Body() body: unknown, @Req() request: RequestWithAuth) {
    return this.authService.changeUserPassword(request.userSession!, body);
  }

  @Get("admin/csrf")
  @ApiOperation({ summary: "Issue admin CSRF token" })
  @ApiOkResponse({ description: "Admin CSRF token." })
  getAdminCsrf(@Res({ passthrough: true }) response: Response) {
    const token = this.authService.issueCsrfToken();
    this.authService.setCsrfCookie(response, "admin", token);
    return { token };
  }

  @Post("admin/login")
  @UseGuards(CsrfGuard)
  @HttpCode(200)
  async loginAdmin(
    @Body() body: unknown,
    @Req() request: RequestWithAuth,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.authService.loginAdmin(body, request);
    this.authService.setSessionCookies(response, "admin", result.token, result.csrf.csrf);
    return { ok: result.ok };
  }

  @Post("admin/logout")
  @UseGuards(AdminGuard, CsrfGuard)
  async logoutAdmin(
    @Req() request: RequestWithAuth,
    @Res({ passthrough: true }) response: Response
  ) {
    await this.authService.logoutAdmin(request.adminSession!);
    this.authService.clearSessionCookies(response, "admin");
    return { ok: true as const };
  }

  @Post("admin/logout-all")
  @UseGuards(AdminGuard, CsrfGuard)
  async logoutAllAdmin(
    @Req() request: RequestWithAuth,
    @Res({ passthrough: true }) response: Response
  ) {
    await this.authService.logoutAllAdminSessions(request.adminSession!.adminId);
    this.authService.clearSessionCookies(response, "admin");
    return { ok: true as const };
  }

  @Post("admin/change-password")
  @UseGuards(AdminGuard, CsrfGuard)
  async changeAdminPassword(@Body() body: unknown, @Req() request: RequestWithAuth) {
    return this.authService.changeAdminPassword(request.adminSession!, body);
  }
}
