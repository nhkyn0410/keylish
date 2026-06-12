import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { TopicsService } from "./topics.service";

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
