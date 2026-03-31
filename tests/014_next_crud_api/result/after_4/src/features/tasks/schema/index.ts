import { z } from 'zod'

export const taskStatusSchema = z.enum(['pending', 'in_progress', 'done'])

export const createTaskSchema = z.object({
  title:       z.string().min(1).max(255),
  description: z.string().optional(),
  status:      taskStatusSchema.default('pending'),
  dueDate:     z.string().datetime({ offset: true }).optional(),
})

export const updateTaskSchema = createTaskSchema.partial()
