import { PrismaClient, Role, PracticeTaskLevel, ProgressStatus, QuestionType, AIChatRole, AIFeedbackType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();
const TEST_PASSWORD = 'Test1234!';
const BCRYPT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function main() {
  console.log('🌱 Seeding database...\n');

  const passwordHash = await hashPassword(TEST_PASSWORD);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: { passwordHash },
    create: {
      email: 'admin@test.com',
      passwordHash,
      displayName: 'Platform Admin',
      role: Role.ADMIN,
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@test.com' },
    update: { passwordHash },
    create: {
      email: 'teacher@test.com',
      passwordHash,
      displayName: 'Anna Teacher',
      role: Role.TEACHER,
    },
  });

  await prisma.user.upsert({
    where: { email: 'teacher2@test.com' },
    update: { passwordHash },
    create: {
      email: 'teacher2@test.com',
      passwordHash,
      displayName: 'Ivan Teacher',
      role: Role.TEACHER,
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@test.com' },
    update: { passwordHash },
    create: {
      email: 'student@test.com',
      passwordHash,
      displayName: 'Misha Student',
      role: Role.STUDENT,
    },
  });

  await prisma.user.upsert({
    where: { email: 'student2@test.com' },
    update: { passwordHash },
    create: {
      email: 'student2@test.com',
      passwordHash,
      displayName: 'Sasha Student',
      role: Role.STUDENT,
    },
  });

  console.log('✓ Users seeded with bcrypt passwords');

  const course = await prisma.course.upsert({
    where: { slug: 'math-grade-3' },
    update: {},
    create: {
      teacherId: teacher.id,
      title: 'Mathematics — Grade 3',
      description: 'Fun math course for children 8–10 years old',
      slug: 'math-grade-3',
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  const topic1 = await prisma.topic.upsert({
    where: { courseId_orderIndex: { courseId: course.id, orderIndex: 0 } },
    update: {},
    create: {
      courseId: course.id,
      title: 'Addition & Subtraction',
      description: 'Basic operations within 100',
      orderIndex: 0,
      isPublished: true,
    },
  });

  await prisma.topic.upsert({
    where: { courseId_orderIndex: { courseId: course.id, orderIndex: 1 } },
    update: {},
    create: {
      courseId: course.id,
      title: 'Multiplication Basics',
      orderIndex: 1,
      isPublished: true,
    },
  });

  await prisma.theoryContent.upsert({
    where: { topicId: topic1.id },
    update: {},
    create: {
      topicId: topic1.id,
      title: 'What is addition?',
      content: 'Addition means combining two or more numbers to get a total.',
    },
  });

  for (const [level, title] of [
    [PracticeTaskLevel.A, 'Easy: Add two numbers'],
    [PracticeTaskLevel.B, 'Medium: Add three numbers'],
    [PracticeTaskLevel.C, 'Hard: Word problems'],
  ] as const) {
    await prisma.practiceTask.upsert({
      where: { topicId_level: { topicId: topic1.id, level } },
      update: {},
      create: {
        topicId: topic1.id,
        title,
        prompt: `Solve the ${level}-level addition problems.`,
        level,
      },
    });
  }

  let test = await prisma.test.findFirst({ where: { topicId: topic1.id } });
  if (!test) {
    test = await prisma.test.create({
      data: {
        topicId: topic1.id,
        title: 'Addition Quiz',
        passingScore: 70,
        timeLimitMinutes: 15,
        maxAttempts: 3,
        questionCount: 5,
        choicesPerQuestion: 4,
      },
    });
  }

  if ((await prisma.testQuestion.count({ where: { testId: test.id } })) === 0) {
    await prisma.testQuestion.createMany({
      data: [
        {
          testId: test.id,
          questionText: 'What is 3 + 4?',
          type: QuestionType.SINGLE_CHOICE,
          options: ['6', '7', '8', '9'],
          correctAnswer: '7',
          orderIndex: 0,
          points: 1,
        },
        {
          testId: test.id,
          questionText: 'What is 5 + 5?',
          type: QuestionType.SINGLE_CHOICE,
          options: ['8', '9', '10', '11'],
          correctAnswer: '10',
          orderIndex: 1,
          points: 1,
        },
        {
          testId: test.id,
          questionText: 'What is 6 + 3?',
          type: QuestionType.SINGLE_CHOICE,
          options: ['7', '8', '9', '10'],
          correctAnswer: '9',
          orderIndex: 2,
          points: 1,
        },
        {
          testId: test.id,
          questionText: 'What is 7 + 5?',
          type: QuestionType.SINGLE_CHOICE,
          options: ['10', '11', '12', '13'],
          correctAnswer: '12',
          orderIndex: 3,
          points: 1,
        },
        {
          testId: test.id,
          questionText: 'What is 8 + 2?',
          type: QuestionType.SINGLE_CHOICE,
          options: ['9', '10', '11', '12'],
          correctAnswer: '10',
          orderIndex: 4,
          points: 1,
        },
      ],
    });
  }

  await prisma.studentProgress.upsert({
    where: { studentId_topicId: { studentId: student.id, topicId: topic1.id } },
    update: { progressPercent: 45, status: ProgressStatus.IN_PROGRESS },
    create: {
      studentId: student.id,
      courseId: course.id,
      topicId: topic1.id,
      status: ProgressStatus.IN_PROGRESS,
      progressPercent: 45,
    },
  });

  const sessionId = randomUUID();
  const chatLog = await prisma.aIChatLog.create({
    data: {
      studentId: student.id,
      topicId: topic1.id,
      sessionId,
      role: AIChatRole.USER,
      content: 'Explain addition simply.',
    },
  });

  await prisma.aIFeedback.create({
    data: {
      studentId: student.id,
      topicId: topic1.id,
      type: AIFeedbackType.EXPLANATION,
      content: 'Great question!',
      aiChatLogId: chatLog.id,
    },
  });

  console.log('\n✅ Seed completed!');
  console.log('Password for all test users:', TEST_PASSWORD);
  console.log('  admin@test.com, teacher@test.com, student@test.com\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
