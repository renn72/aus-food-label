import type { IngredientTableRow } from '@/lib/ingredient/functions'

export function matchesIngredientRow(row: IngredientTableRow, query: string) {
  const normalizedQuery = normalizeText(query)

  if (!normalizedQuery) {
    return true
  }

  const queryTokens = normalizedQuery.split(' ').filter(Boolean)
  const searchableValues = [
    normalizeText(row.name),
    normalizeText(row.isAusFood ? 'aus food imported' : 'custom ingredient user created'),
    normalizeText(row.calories),
    normalizeText(row.energy),
    normalizeText(row.protein),
    normalizeText(row.fatTotal),
    normalizeText(row.fatSaturated),
    normalizeText(row.carbohydrate),
    normalizeText(row.sugar),
    normalizeText(row.dietaryFibre),
    normalizeText(row.sodium),
  ]
  const normalizedName = searchableValues[0]
  const haystack = searchableValues.join(' ').trim()

  if (!haystack) {
    return false
  }

  return (
    scoreIngredientRow({
      haystack,
      normalizedName,
      normalizedQuery,
      queryTokens,
    }) !== Number.NEGATIVE_INFINITY
  )
}

function scoreIngredientRow({
  haystack,
  normalizedName,
  normalizedQuery,
  queryTokens,
}: {
  haystack: string
  normalizedName: string
  normalizedQuery: string
  queryTokens: string[]
}) {
  let score = 0

  if (normalizedName === normalizedQuery) {
    score += 1_200
  }

  if (normalizedName.startsWith(normalizedQuery)) {
    score += 900
  }

  const phraseIndex = normalizedName.indexOf(normalizedQuery)
  if (phraseIndex >= 0) {
    score += Math.max(0, 550 - phraseIndex * 4)
  }

  const nameWords = normalizedName.split(' ').filter(Boolean)
  const allTokensResolvable = queryTokens.every((token) => {
    if (nameWords.some((word) => word.startsWith(token))) {
      score += 220
      return true
    }

    const haystackIndex = haystack.indexOf(token)
    if (haystackIndex >= 0) {
      score += Math.max(40, 140 - haystackIndex)
      return true
    }

    const fuzzyScore = scoreSubsequence(normalizedName, token)
    if (fuzzyScore > 0) {
      score += fuzzyScore
      return true
    }

    return false
  })

  if (!allTokensResolvable) {
    return Number.NEGATIVE_INFINITY
  }

  if (queryTokens.every((token) => normalizedName.includes(token))) {
    score += 180
  }

  if (queryTokens.length > 1 && queryTokens.every((token) => haystack.includes(token))) {
    score += 120
  }

  return score
}

function scoreSubsequence(text: string, query: string) {
  if (!text || !query) {
    return 0
  }

  let cursor = 0
  let gaps = 0

  for (const character of query) {
    const matchIndex = text.indexOf(character, cursor)

    if (matchIndex === -1) {
      return 0
    }

    gaps += matchIndex - cursor
    cursor = matchIndex + 1
  }

  return Math.max(24, 90 - gaps * 3)
}

function normalizeText(value: IngredientTableRow[keyof IngredientTableRow] | string) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}
