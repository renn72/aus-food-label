import type { BaseIngredient, IngredientMetrics, IngredientSource, ServeUnit } from '@/lib/workspace/types'

const ingredientSources = [
  {
    filePath: '/ingredient-solid.csv',
    source: 'seed-solid',
    serveUnit: 'grams',
  },
  {
    filePath: '/ingredient-liquid.csv',
    source: 'seed-liquid',
    serveUnit: 'mls',
  },
] as const satisfies ReadonlyArray<{
  filePath: string
  source: Exclude<IngredientSource, 'custom'>
  serveUnit: ServeUnit
}>

const fieldHeaders = {
  publicFoodKey: ['Public Food Key'],
  classification: ['Classification'],
  name: ['Food Name', 'Food name'],
  energy: ['Energy with dietary fibre, equated \n(kJ)'],
  protein: ['Protein \n(g)'],
  fatTotal: ['Fat, total \n(g)'],
  fatSaturated: [
    'Total saturated fatty acids, equated (%T)',
    'Total saturated fatty acids, equated \n(g)',
    'Total saturated fatty acids, equated (g)',
  ],
  carbohydrate: ['Available carbohydrate, with sugar alcohols \n(g)'],
  sugar: ['Total sugars (g)', 'Total sugars \n(g)'],
  dietaryFibre: ['Total dietary fibre \n(g)'],
  sodium: ['Sodium (Na) \n(mg)'],
} as const

let baseIngredientsPromise: Promise<BaseIngredient[]> | null = null

export function loadBaseIngredients(options?: { force?: boolean }) {
  if (!baseIngredientsPromise || options?.force) {
    baseIngredientsPromise = loadAllBaseIngredients()
  }

  return baseIngredientsPromise
}

async function loadAllBaseIngredients() {
  const responses = await Promise.all(
    ingredientSources.map(async (source) => {
      const response = await fetch(source.filePath)

      if (!response.ok) {
        throw new Error(`Unable to load ingredient seed "${source.filePath}".`)
      }

      const csvText = await response.text()
      return parseCsv(csvText).map((row) => buildBaseIngredient(row, source)).filter(isDefined)
    }),
  )

  const collator = new Intl.Collator('en-AU', { sensitivity: 'base', numeric: true })

  return responses
    .flat()
    .sort((left, right) => collator.compare(left.name, right.name) || collator.compare(left.id, right.id))
}

function buildBaseIngredient(
  row: Record<string, string>,
  source: (typeof ingredientSources)[number],
): BaseIngredient | null {
  const publicFoodKey = getValue(row, fieldHeaders.publicFoodKey)
  const name = getValue(row, fieldHeaders.name)

  if (!publicFoodKey || !name) {
    return null
  }

  const metrics: IngredientMetrics = {
    calories: getCalories(row, fieldHeaders.energy),
    energy: parseMetricValue(getValue(row, fieldHeaders.energy)),
    protein: parseMetricValue(getValue(row, fieldHeaders.protein)),
    fatTotal: parseMetricValue(getValue(row, fieldHeaders.fatTotal)),
    fatSaturated: parseMetricValue(getValue(row, fieldHeaders.fatSaturated)),
    carbohydrate: parseMetricValue(getValue(row, fieldHeaders.carbohydrate)),
    sugar: parseMetricValue(getValue(row, fieldHeaders.sugar)),
    dietaryFibre: parseMetricValue(getValue(row, fieldHeaders.dietaryFibre)),
    sodium: parseMetricValue(getValue(row, fieldHeaders.sodium)),
  }

  return {
    id: `seed:${publicFoodKey}:${source.serveUnit}`,
    classification: getValue(row, fieldHeaders.classification),
    publicFoodKey,
    name,
    source: source.source,
    serveUnit: source.serveUnit,
    isBase: true,
    isAusFood: true,
    createdAt: null,
    updatedAt: null,
    metrics,
  }
}

function getValue(row: Record<string, string>, headers: readonly string[]) {
  for (const header of headers) {
    const normalizedValue = normalizeCell(row[header])

    if (normalizedValue !== null) {
      return normalizedValue
    }
  }

  return null
}

function getCalories(row: Record<string, string>, headers: readonly string[]) {
  const rawValue = getValue(row, headers)

  if (rawValue === null) {
    return 0
  }

  const kilojoules = Number(rawValue)

  if (!Number.isFinite(kilojoules)) {
    return 0
  }

  return Number((kilojoules * 0.239).toFixed(2))
}

function parseMetricValue(value: string | null) {
  if (!value) {
    return 0
  }

  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) ? parsedValue : 0
}

function normalizeCell(value: string | undefined) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmedValue = value.replace(/\uFEFF/g, '').trim()
  return trimmedValue === '' ? null : trimmedValue
}

function parseCsv(text: string) {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentField = ''
  let index = 0
  let inQuotes = false

  while (index < text.length) {
    const character = text[index]

    if (inQuotes) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          currentField += '"'
          index += 2
          continue
        }

        inQuotes = false
        index += 1
        continue
      }

      currentField += character
      index += 1
      continue
    }

    if (character === '"') {
      inQuotes = true
      index += 1
      continue
    }

    if (character === ',') {
      currentRow.push(currentField)
      currentField = ''
      index += 1
      continue
    }

    if (character === '\n') {
      currentRow.push(currentField)
      rows.push(currentRow)
      currentRow = []
      currentField = ''
      index += 1
      continue
    }

    if (character === '\r') {
      index += 1
      continue
    }

    currentField += character
    index += 1
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField)
    rows.push(currentRow)
  }

  const [rawHeaders, ...dataRows] = rows

  if (!rawHeaders) {
    return []
  }

  const headers = rawHeaders.map((header) => header.replace(/\uFEFF/g, ''))

  return dataRows
    .filter((row) => row.some((value) => normalizeCell(value) !== null))
    .map((row) =>
      Object.fromEntries(headers.map((header, columnIndex) => [header, row[columnIndex] ?? ''])),
    )
}

function isDefined<T>(value: T | null): value is T {
  return value !== null
}
