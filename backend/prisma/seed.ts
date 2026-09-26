import { PrismaClient, Role, AccountStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const LIKERT_OPTIONS = [
    { content: 'Không hề', scoreValue: 0 },
    { content: 'Vài ngày', scoreValue: 1 },
    { content: 'Hơn nửa số ngày', scoreValue: 2 },
    { content: 'Gần như mỗi ngày', scoreValue: 3 },
];

const PHQ9_QUESTIONS = [
    'Ít hứng thú hoặc không còn thấy vui thích khi làm việc gì',
    'Cảm thấy buồn, chán nản, hoặc tuyệt vọng',
    'Khó ngủ, ngủ không sâu giấc, hoặc ngủ quá nhiều',
    'Cảm thấy mệt mỏi hoặc thiếu năng lượng',
    'Ăn không ngon miệng hoặc ăn quá nhiều',
    'Cảm thấy bản thân tồi tệ — hoặc cảm thấy mình thất bại, hoặc làm bản thân/gia đình thất vọng',
    'Khó tập trung vào việc gì đó, ví dụ đọc báo hoặc xem TV',
    'Di chuyển hoặc nói chậm chạp đến mức người khác nhận thấy, hoặc ngược lại — bồn chồn hơn bình thường',
    'Có ý nghĩ rằng thà chết đi còn hơn, hoặc muốn tự làm hại bản thân theo cách nào đó',
];

const GAD7_QUESTIONS = [
    'Cảm thấy lo lắng, bồn chồn hoặc căng thẳng',
    'Không thể ngừng hoặc kiểm soát được sự lo lắng',
    'Lo lắng quá nhiều về những điều khác nhau',
    'Khó thư giãn',
    'Bồn chồn đến mức khó ngồi yên',
    'Dễ cáu gắt hoặc bực bội',
    'Cảm thấy sợ hãi như thể điều gì đó tồi tệ sắp xảy ra',
];

async function seedTest(
    code: string,
    name: string,
    description: string,
    questions: string[],
) {
    const test = await prisma.psychologicalTest.upsert({
        where: { code },
        update: {},
        create: {
            code,
            name,
            description,
            maxScore: questions.length * 3,
        },
    });

    for (let i = 0; i < questions.length; i++) {
        const existing = await prisma.testQuestion.findFirst({
            where: { testId: test.id, orderNumber: i + 1 },
        });
        if (existing) continue;

        await prisma.testQuestion.create({
            data: {
                testId: test.id,
                content: questions[i],
                orderNumber: i + 1,
                options: {
                    create: LIKERT_OPTIONS,
                },
            },
        });
    }

    console.log(`Seeded ${name}: ${questions.length} câu hỏi`);
}

async function seedRelaxationResources() {
    const resources = [
        { title: 'Thở sâu 4-7-8', type: 'BREATHING', url: 'https://example.com/breathing-478', durationSeconds: 300, category: 'breathing' },
        { title: 'Âm thanh mưa rơi', type: 'AUDIO', url: 'https://example.com/rain-sound', durationSeconds: 600, category: 'calm_audio' },
        { title: 'Nhạc lofi thư giãn', type: 'AUDIO', url: 'https://example.com/lofi', durationSeconds: 900, category: 'calm_audio' },
    ];

    for (const r of resources) {
        const existing = await prisma.relaxationResource.findFirst({ where: { title: r.title } });
        if (!existing) {
            await prisma.relaxationResource.create({ data: r });
        }
    }
    console.log(`Seeded ${resources.length} tài nguyên thư giãn`);
}

async function seedAdminAccount() {
    const email = 'admin@datn.local';
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return;

    const passwordHash = await bcrypt.hash('Admin@123', 10);
    await prisma.user.create({
        data: {
            fullName: 'Admin',
            email,
            passwordHash,
            role: Role.ADMIN,
            status: AccountStatus.ACTIVE,
        },
    });
    console.log(`Seeded admin account: ${email} / Admin@123`);
}

async function main() {
    await seedTest('PHQ9', 'PHQ-9', 'Thang đo sàng lọc mức độ trầm cảm, gồm 9 câu hỏi chuẩn hoá.', PHQ9_QUESTIONS);
    await seedTest('GAD7', 'GAD-7', 'Thang đo sàng lọc mức độ lo âu, gồm 7 câu hỏi chuẩn hoá.', GAD7_QUESTIONS);
    await seedRelaxationResources();
    await seedAdminAccount();
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });