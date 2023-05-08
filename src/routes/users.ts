import { randomUUID } from 'crypto'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'

export async function usersRoutes(app: FastifyInstance) {
  app.get('/:id/metrics', async (req, res) => {
    const getUserParamsSchema = z.object({
      id: z.string().uuid()
    })

    const { id } = getUserParamsSchema.parse(req.params)

    const meals = await knex('meals')
      .where('user_id', id)
      .orderBy('date_time')
      .select()

    const totalMealsQuantity = meals.length
    let mealsOnDietQuantity = 0
    let mealsOffDietQuantity = 0
    let currentSequence = 0
    let maxSequence = 0

    meals.forEach(meal => {
      if (meal.on_diet) {
        // Meal is on diet, so increment current sequence
        mealsOnDietQuantity++
        currentSequence++
        // Check if current sequence is longer than max sequence
        if (currentSequence > maxSequence) {
          maxSequence = currentSequence
        }
      } else {
        // Meal is not on diet, so reset current sequence
        mealsOffDietQuantity++
        currentSequence = 0
      }
    })

    const metrics = {
      totalMealsQuantity,
      mealsOnDietQuantity,
      mealsOffDietQuantity,
      bestSequenceOfMealsOnDiet: maxSequence
    }

    return { metrics }
  })

  app.post('/', async (req, res) => {
    const createUserBodySchema = z.object({
      name: z.string(),
      email: z.string().email(),
      avatar_url: z.string()
    })

    const { name, email, avatar_url } = createUserBodySchema.parse(req.body)

    let sessionId = req.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      res.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
      })
    }

    const userAlreadyExists = await knex('users').where('email', email).first()

    if (userAlreadyExists) {
      return res.status(409).send({ message: 'The user already exists' })
    }

    await knex('users').insert({
      id: randomUUID(),
      name,
      email,
      avatar_url,
      session_id: sessionId
    })

    return res.status(201).send()
  })
}
