import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PracticeTaskLevel, Role } from '@prisma/client';
import { CurrentUser, Roles } from '@/common/decorators';
import type { AuthUser } from '@/common/types';
import {
  CreateTestDto,
  CreateTestQuestionDto,
  CreateVideoDto,
  UpdateTestDto,
  UpdateTestQuestionDto,
  UpdateTheoryDto,
  UpdateVideoDto,
  UpsertPracticeTaskDto,
  UpsertTheoryDto,
} from '../dto';
import { TeacherTopicGuard } from '../guards/teacher-topic.guard';
import { TeacherContentService } from '../services/teacher-content.service';

@ApiTags('teacher')
@ApiBearerAuth()
@Roles(Role.TEACHER, Role.ADMIN)
@UseGuards(TeacherTopicGuard)
@Controller('teacher/topics/:topicId')
export class TeacherContentController {
  constructor(private readonly contentService: TeacherContentService) {}

  // ─── Theory ─────────────────────────────────────────────────────────────────

  @Put('theory')
  @ApiOperation({ summary: 'Create or replace theory content' })
  upsertTheory(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @Body() dto: UpsertTheoryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.contentService.upsertTheory(topicId, dto, user);
  }

  @Patch('theory')
  @ApiOperation({ summary: 'Update theory content' })
  updateTheory(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @Body() dto: UpdateTheoryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.contentService.updateTheory(topicId, dto, user);
  }

  @Delete('theory')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete theory content' })
  deleteTheory(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.contentService.deleteTheory(topicId, user);
  }

  // ─── YouTube videos ─────────────────────────────────────────────────────────

  @Post('videos')
  @ApiOperation({ summary: 'Add YouTube video to topic' })
  addVideo(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @Body() dto: CreateVideoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.contentService.addVideo(topicId, dto, user);
  }

  @Patch('videos/:videoId')
  @ApiOperation({ summary: 'Update video' })
  updateVideo(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @Param('videoId', ParseUUIDPipe) videoId: string,
    @Body() dto: UpdateVideoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.contentService.updateVideo(topicId, videoId, dto, user);
  }

  @Delete('videos/:videoId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete video' })
  deleteVideo(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @Param('videoId', ParseUUIDPipe) videoId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.contentService.deleteVideo(topicId, videoId, user);
  }

  // ─── Practice links (A / B / C) ─────────────────────────────────────────────

  @Put('practice/:level')
  @ApiOperation({ summary: 'Upsert practice task for level A, B, or C' })
  upsertPractice(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @Param('level', new ParseEnumPipe(PracticeTaskLevel)) level: PracticeTaskLevel,
    @Body() dto: UpsertPracticeTaskDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.contentService.upsertPracticeTask(topicId, level, dto, user);
  }

  @Delete('practice/:level')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete practice task for level A, B, or C' })
  deletePractice(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @Param('level', new ParseEnumPipe(PracticeTaskLevel)) level: PracticeTaskLevel,
    @CurrentUser() user: AuthUser,
  ) {
    return this.contentService.deletePracticeTask(topicId, level, user);
  }

  // ─── Final test ─────────────────────────────────────────────────────────────

  @Get('test')
  @ApiOperation({ summary: 'Get final test for topic' })
  getTest(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.contentService.getFinalTest(topicId, user);
  }

  @Post('test')
  @ApiOperation({ summary: 'Create final test for topic' })
  createTest(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @Body() dto: CreateTestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.contentService.createFinalTest(topicId, dto, user);
  }

  @Patch('test')
  @ApiOperation({ summary: 'Update final test metadata' })
  updateTest(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @Body() dto: UpdateTestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.contentService.updateFinalTest(topicId, dto, user);
  }

  @Delete('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete final test' })
  deleteTest(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.contentService.deleteFinalTest(topicId, user);
  }

  @Post('test/questions')
  @ApiOperation({ summary: 'Add question to final test' })
  addQuestion(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @Body() dto: CreateTestQuestionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.contentService.addTestQuestion(topicId, dto, user);
  }

  @Patch('test/questions/:questionId')
  @ApiOperation({ summary: 'Update test question' })
  updateQuestion(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() dto: UpdateTestQuestionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.contentService.updateTestQuestion(topicId, questionId, dto, user);
  }

  @Delete('test/questions/:questionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete test question' })
  deleteQuestion(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.contentService.deleteTestQuestion(topicId, questionId, user);
  }
}
