import { sql } from 'drizzle-orm'
import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

import { user } from './auth.schema'
import { ingredient } from './ingredient.schema'

export const recipe = sqliteTable(
  'recipe',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(() => new Date()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, {
        onDelete: 'cascade',
      }),
    name: text('name').notNull(),
    outputNetWeight: real('output_net_weight'),
    serveSize: real('serve_size').notNull(),
    servingsPerPack: real('servings_per_pack').notNull(),
  },
  (table) => [index('recipe_user_id_idx').on(table.userId)],
)

export const recipeIngredient = sqliteTable(
  'recipe_ingredient',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(() => new Date()),
    recipeId: integer('recipe_id')
      .notNull()
      .references(() => recipe.id, {
        onDelete: 'cascade',
      }),
    ingredientId: integer('ingredient_id')
      .notNull()
      .references(() => ingredient.id, {
        onDelete: 'restrict',
      }),
    quantity: real('quantity').notNull(),
    sortOrder: integer('sort_order', { mode: 'number' }).notNull().default(0),
  },
  (table) => [
    index('recipe_ingredient_recipe_id_idx').on(table.recipeId),
    index('recipe_ingredient_ingredient_id_idx').on(table.ingredientId),
    uniqueIndex('recipe_ingredient_recipe_id_ingredient_id_unique').on(
      table.recipeId,
      table.ingredientId,
    ),
  ],
)
