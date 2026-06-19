import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiCookieAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CsrfGuard, UserGuard, type Request } from "../auth/auth.guard";
import type { UserSessionPayload } from "../auth/auth.dto";
import { UserVocabService } from "./uservocab.service";

type RequestWithUser = Request & { userSession?: UserSessionPayload };

@ApiTags("user-vocab")
@ApiCookieAuth("user")
@Controller("user/vocab")
@UseGuards(UserGuard)
export class UserVocabController {
  constructor(private readonly userVocab: UserVocabService) {}

  @Get()
  @ApiOperation({ summary: "Liệt kê kho từ vựng cá nhân" })
  list(@Req() request: RequestWithUser, @Query() query: Record<string, unknown>) {
    return this.userVocab.list(request.userSession!.userId, query);
  }

  @Post("pick")
  @UseGuards(CsrfGuard)
  @HttpCode(200)
  @ApiOperation({ summary: "Thêm 1 từ hệ thống vào kho cá nhân (tham chiếu)" })
  pick(@Req() request: RequestWithUser, @Body() body: unknown) {
    return this.userVocab.pick(request.userSession!.userId, body);
  }

  @Post()
  @UseGuards(CsrfGuard)
  @HttpCode(200)
  @ApiOperation({ summary: "Tạo từ vào kho cá nhân (dedup-on-add)" })
  create(@Req() request: RequestWithUser, @Body() body: unknown) {
    return this.userVocab.create(request.userSession!.userId, body);
  }

  @Patch(":id")
  @UseGuards(CsrfGuard)
  @ApiOperation({ summary: "Sửa / override mục kho cá nhân" })
  update(@Req() request: RequestWithUser, @Param("id") id: string, @Body() body: unknown) {
    return this.userVocab.update(request.userSession!.userId, id, body);
  }

  @Delete(":id")
  @UseGuards(CsrfGuard)
  @ApiOperation({ summary: "Xóa mục kho cá nhân" })
  remove(@Req() request: RequestWithUser, @Param("id") id: string) {
    return this.userVocab.remove(request.userSession!.userId, id);
  }
}
