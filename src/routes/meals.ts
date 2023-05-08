import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { randomUUID } from 'crypto'
import { checkSessionIdExists } from '../middlewares/check-sessionId-exists'

export async function mealsRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists]
    },
    async (req, res) => {
      const { sessionId } = req.cookies

      const user = await knex('users').where('session_id', sessionId).first()

      if (!user) {
        return res.status(404).send({ message: 'User not found' })
      }

      const meals = await knex('meals').where('user_id', user.id).select()

      return { meals }
    }
  )

  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExists]
    },
    async req => {
      const getTransactionParamsSchema = z.object({
        id: z.string().uuid()
      })

      const { id } = getTransactionParamsSchema.parse(req.params)

      const meal = await knex('meals').where('id', id).first()

      return { meal }
    }
  )

  app.post('/', async (req, res) => {
    const createMealBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      date_time: z.string(),
      on_diet: z.boolean()
    })

    const { sessionId } = req.cookies

    const user = await knex('users').where('session_id', sessionId).first()

    if (!user) {
      return res.status(404).send({ message: 'User not found' })
    }

    const { name, description, date_time, on_diet } =
      createMealBodySchema.parse(req.body)

    await knex('meals').insert({
      id: randomUUID(),
      user_id: user.id,
      name,
      description,
      date_time,
      on_diet
    })

    res.status(201).send()
  })

  app.put(
    '/:id',
    {
      preHandler: [checkSessionIdExists]
    },
    async (req, res) => {
      const getMealParamsSchema = z.object({
        id: z.string().uuid()
      })

      const editMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        date_time: z.string(),
        on_diet: z.boolean()
      })

      const { id } = getMealParamsSchema.parse(req.params)

      const { name, description, date_time, on_diet } =
        editMealBodySchema.parse(req.body)

      await knex('meals').where('id', id).update({
        name,
        description,
        date_time,
        on_diet
      })

      return res.status(204).send()
    }
  )

  app.delete(
    '/:id',
    {
      preHandler: [checkSessionIdExists]
    },
    async (req, res) => {
      const getMealParamsSchema = z.object({
        id: z.string().uuid()
      })

      const { id } = getMealParamsSchema.parse(req.params)

      await knex('meals').where('id', id).delete()

      return res.status(204).send()
    }
  )
}
