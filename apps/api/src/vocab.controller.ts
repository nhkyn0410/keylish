import { Controller, Get, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { CefrLevelSchema } from "@keylish/shared";
import { VocabService } from "./vocab.service";

@ApiTags("vocab")
@Controller({ path: "vocab", version: "1" })
export class VocabController {
  constructor(private readonly vocabService: VocabService) {}

  @Get()
  @ApiOperation({ summary: "List vocabulary items" })
  @ApiQuery({ name: "levels", required: false, isArray: true, enum: CefrLevelSchema.options })
  @ApiQuery({ name: "topics", required: false, isArray: true, type: String })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 20 })
  @ApiQuery({ name: "random", required: false, type: Boolean, example: false })
  @ApiOkResponse({ description: "Vocabulary items." })
  findAll(@Query() query: Record<string, unknown>) {
    return this.vocabService.findAll(query);
  }

  @Get("count")
  @ApiOperation({ summary: "Count vocabulary items matching the filters" })
  @ApiQuery({ name: "levels", required: false, isArray: true, enum: CefrLevelSchema.options })
  @ApiQuery({ name: "topics", required: false, isArray: true, type: String })
  @ApiOkResponse({ description: "Number of matching vocabulary items." })
  async count(@Query() query: Record<string, unknown>) {
    return { count: await this.vocabService.count(query) };
  }
}
