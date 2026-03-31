import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const tasks = sqliteTable('tasks', {
  id:          text('id').primaryKey(),
  title:       text('title').notNull(),
  description: text('description'),
  status:      text('status', { enum: ['pending', 'in_progress', 'done'] })
                 .notNull()
                 .default('pending'),
  dueDate:     text('due_date'),
  createdAt:   text('created_at').notNull(),
})
