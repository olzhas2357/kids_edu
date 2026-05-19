import { Injectable } from '@nestjs/common';
import { AIChatRole, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { AiRepository } from '../repositories/ai.repository';

@Injectable()
export class AiChatLogService {
  constructor(private readonly repository: AiRepository) {}

  createSessionId(): string {
    return randomUUID();
  }

  async logExchange(params: {
    studentId: string;
    topicId?: string;
    sessionId: string;
    systemPrompt: string;
    userPrompt: string;
    assistantResponse: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    await this.repository.createChatLogs([
      {
        studentId: params.studentId,
        topicId: params.topicId,
        sessionId: params.sessionId,
        role: AIChatRole.SYSTEM,
        content: params.systemPrompt,
        metadata: { ...this.asMeta(params.metadata), kind: 'system' },
      },
      {
        studentId: params.studentId,
        topicId: params.topicId,
        sessionId: params.sessionId,
        role: AIChatRole.USER,
        content: params.userPrompt,
        metadata: { ...this.asMeta(params.metadata), kind: 'user' },
      },
      {
        studentId: params.studentId,
        topicId: params.topicId,
        sessionId: params.sessionId,
        role: AIChatRole.ASSISTANT,
        content: params.assistantResponse,
        metadata: { ...this.asMeta(params.metadata), kind: 'assistant' },
      },
    ]);
  }

  async logUserMessage(params: {
    studentId: string;
    topicId?: string;
    sessionId: string;
    content: string;
  }) {
    return this.repository.createChatLog({
      studentId: params.studentId,
      topicId: params.topicId,
      sessionId: params.sessionId,
      role: AIChatRole.USER,
      content: params.content,
    });
  }

  private asMeta(metadata?: Prisma.InputJsonValue): Record<string, unknown> {
    if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
      return metadata as Record<string, unknown>;
    }
    return {};
  }
}
