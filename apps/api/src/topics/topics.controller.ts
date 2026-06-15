import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminGuard, CsrfGuard } from "../auth/auth.guard";
import { TopicsService, type AdminTopicDto, type AdminTopicListDto } from "./topics.service";

@ApiTags("topics")
@Controller({ path: "topics", version: "1" })
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get()
  @ApiOperation({ summary: "List topic summaries" })
  @ApiOkResponse({ description: "Topics with word counts." })
  findAll() {
    return this.topicsService.findAll();
  }
}

@ApiTags("admin-topics")
@Controller("admin/topics")
@UseGuards(AdminGuard)
export class AdminTopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get()
  list(@Query() query: Record<string, unknown>): Promise<AdminTopicListDto> {
    return this.topicsService.listTopics(query);
  }

  @Post()
  @UseGuards(CsrfGuard)
  create(@Body() body: unknown): Promise<AdminTopicDto> {
    return this.topicsService.createTopic(body);
  }

  @Patch(":id")
  @UseGuards(CsrfGuard)
  update(@Param("id") id: string, @Body() body: unknown): Promise<AdminTopicDto> {
    return this.topicsService.updateTopic(id, body);
  }

  @Delete(":id")
  @UseGuards(CsrfGuard)
  remove(@Param("id") id: string): Promise<{ ok: true }> {
    return this.topicsService.deleteTopic(id);
  }
}
