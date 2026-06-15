import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminGuard, CsrfGuard } from "../auth/auth.guard";
import {
  AdminService,
  type AdminSummaryDto,
  type AdminUserDetailDto,
  type AdminUserListDto,
} from "./admin.service";

@ApiTags("admin")
@Controller("admin")
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("dashboard/summary")
  @ApiOperation({ summary: "Get dashboard summary" })
  summary(): Promise<AdminSummaryDto> {
    return this.adminService.getAdminSummary();
  }

  @Get("users")
  users(@Query() query: Record<string, unknown>): Promise<AdminUserListDto> {
    return this.adminService.listUsers(query);
  }

  @Get("users/:id")
  user(@Param("id") id: string): Promise<AdminUserDetailDto> {
    return this.adminService.getUserById(id);
  }

  @Patch("users/:id")
  @UseGuards(CsrfGuard)
  updateUser(@Param("id") id: string, @Body() body: unknown): Promise<AdminUserDetailDto> {
    return this.adminService.updateUserById(id, body);
  }
}
