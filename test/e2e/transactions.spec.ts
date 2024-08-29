import { it, beforeAll, afterAll, describe, expect, beforeEach } from 'vitest'
import { execSync } from 'node:child_process'
import request from 'supertest'
import { app } from '../../src/app'

describe('Transaction routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('Should be able create a new transaction', async () => {
    await request(app.server)
      .post('/transactions')
      .send({
        title: 'Salary',
        amount: 1000,
        type: 'credit',
      })
      .expect(201)
      .expect('set-cookie', /sessionId=/)
  })

  it('Should be able to list all transaction', async () => {
    const response = await request(app.server)
      .post('/transactions')
      .send({
        title: 'Salary',
        amount: 1000,
        type: 'credit',
      })
      .expect(201)
      .expect('set-cookie', /sessionId=/)

    const transactionsResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', response.headers['set-cookie'])
      .expect(200)

    expect(transactionsResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: 'Salary',
        amount: 1000,
      }),
    ])
  })

  it('Should be able to get only one transaction', async () => {
    const response = await request(app.server)
      .post('/transactions')
      .send({
        title: 'Salary',
        amount: 1000,
        type: 'credit',
      })
      .expect(201)
      .expect('set-cookie', /sessionId=/)

    const transactionsResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', response.headers['set-cookie'])
      .expect(200)

    const transactionId = transactionsResponse.body.transactions[0].id

    const transactionResponse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', response.headers['set-cookie'])
      .expect(200)

    expect(transactionResponse.body.transaction).toEqual(
      expect.objectContaining({
        title: 'Salary',
        amount: 1000,
      }),
    )
  })
  it('Should be able to get the summary of transactions', async () => {
    const response = await request(app.server)
      .post('/transactions')
      .send({
        title: 'Salary',
        amount: 1000,
        type: 'credit',
      })
      .expect(201)
      .expect('set-cookie', /sessionId=/)

    await request(app.server)
      .post('/transactions')
      .set('Cookie', response.headers['set-cookie'])
      .send({
        title: 'Rent',
        amount: 500,
        type: 'debit',
      })

    const summaryResponse = await request(app.server)
      .get('/transactions/summary')
      .set('Cookie', response.headers['set-cookie'])
      .expect(200)

    expect(summaryResponse.body.summary).toEqual({
      amount: 500,
    })
  })
})
