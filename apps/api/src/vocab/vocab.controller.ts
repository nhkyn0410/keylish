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
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { CefrLevelSchema } from "@keylish/shared";
import { AdminGuard, CsrfGuard } from "../auth/auth.guard";
import { VocabService, type AdminVocabDto, type AdminVocabListDto } from "./vocab.service";

@ApiTags("vocab")
@Controller({ path: "vocab", version: "1" })
export class VocabController {
  constructor(private readonly vocabService: VocabService) {}

  @Get()
  @ApiOperation({ summary: "List vocabulary items" })
  @ApiQuery({ name: "levels", required: false, isArray: true, enum: CefrLevelSchema.options })
  @ApiQuery({ name: "topics", required: false, isArray: true, type: String })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 20 })
  @ApiQuery({ name: "offset", required: false, type: Number, example: 0 })
  @ApiQuery({ name: "random", required: false, type: Boolean, example: false })
  @ApiOkResponse({ description: "Vocabulary items." })
  findAll(@Query() query: Record<string, unknown>) {
    return this.vocabService.findAll(query);
  }

  @Get("count")
  @ApiOperation({ summary: "Count vocabulary items matching the filters" })
  @ApiQuery({ name: "levels", required: false, isArray: true, enum: CefrLevelSchema.options })
  @ApiQuery({ name: "topics", required: false, isArray: true, type: String })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiOkResponse({ description: "Number of matching vocabulary items." })
  async count(@Query() query: Record<string, unknown>) {
    return { count: await this.vocabService.count(query) };
  }
}

@ApiTags("admin-vocab")
@Controller("admin/vocab")
@UseGuards(AdminGuard)
export class AdminVocabController {
  constructor(private readonly vocabService: VocabService) {}

  @Get()
  list(@Query() query: Record<string, unknown>): Promise<AdminVocabListDto> {
    return this.vocabService.listVocab(query);
  }

  @Post()
  @UseGuards(CsrfGuard)
  create(@Body() body: unknown): Promise<AdminVocabDto> {
    return this.vocabService.createWord(body);
  }

  @Patch(":id")
  @UseGuards(CsrfGuard)
  update(@Param("id") id: string, @Body() body: unknown): Promise<AdminVocabDto> {
    return this.vocabService.updateWord(id, body);
  }

  @Delete(":id")
  @UseGuards(CsrfGuard)
  remove(@Param("id") id: string): Promise<{ ok: true }> {
    return this.vocabService.deleteWord(id);
  }
}
