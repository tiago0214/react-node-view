import { AppModule } from '@/app.module'
import { PrismaService } from '@/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'

describe('fetch recent questions', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()

    await app.init()

    prisma = moduleRef.get(PrismaService)

    jwt = moduleRef.get(JwtService)
  })

  test('[POST] /', async () => {
    const user = await prisma.user.create({
      data: {
        name: 'Jhon Doe',
        email: 'jhondoe@example.com',
        password: '123123',
      },
    })

    const accessToken = jwt.sign({
      sub: user.id,
    })

    await prisma.question.createMany({
      data: [
        {
          authorId: user.id,
          title: 'Question 1',
          content: 'Question 1 content',
          slug: 'question-1',
        },
        {
          authorId: user.id,
          title: 'Question 2',
          content: 'Question 2 content',
          slug: 'question-2',
        },
      ],
    })

    const response = await request(app.getHttpServer())
      .get('/questions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send()

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      questions: [
        expect.objectContaining({ title: 'Question 1' }),
        expect.objectContaining({ title: 'Question 2' }),
      ],
    })
  })
})
