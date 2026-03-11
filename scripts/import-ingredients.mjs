import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { createClient } from '@libsql/client'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')
const DEFAULT_FILES = [
  {
    filePath: path.join(ROOT_DIR, 'public', 'ingredient-solid.csv'),
    serveUnit: 'grams',
    label: 'solid',
  },
  {
    filePath: path.join(ROOT_DIR, 'public', 'ingredient-liquid.csv'),
    serveUnit: 'mls',
    label: 'liquid',
  },
]
const CHILD_TABLES = [
  'ingredient_addition_one',
  'ingredient_addition_two',
  'ingredient_addition_three',
]

const BASE_FIELD_HEADERS = {
  public_food_key: ['Public Food Key'],
  classification: ['Classification'],
  food_name: ['Food Name', 'Food name'],
  protein: ['Protein \n(g)'],
  fat_total: ['Fat, total \n(g)'],
  total_dietary_fibre: ['Total dietary fibre \n(g)'],
  total_sugars: ['Total sugars (g)', 'Total sugars \n(g)'],
  starch: ['Starch \n(g)'],
  resistant_starch: ['Resistant starch \n(g)'],
  available_carbohydrate_without_sugar_alcohols: [
    'Available carbohydrate, without sugar alcohols \n(g)',
  ],
  available_carbohydrate_with_sugar_alcohols: ['Available carbohydrate, with sugar alcohols \n(g)'],
}

const ADDITION_ONE_FIELD_HEADERS = {
  energy_with_dietary_fibre: ['Energy with dietary fibre, equated \n(kJ)'],
  energy_without_dietary_fibre: ['Energy, without dietary fibre, equated \n(kJ)'],
  added_sugars: ['Added sugars (g)', 'Added sugars \n(g)'],
  free_sugars: ['Free sugars \n(g)'],
  moisture: ['Moisture (water) \n(g)'],
  nitrogen: ['Nitrogen \n(g)'],
  alcohol: ['Alcohol \n(g)'],
  fructose: ['Fructose \n(g)'],
  glucose: ['Glucose \n(g)'],
  sucrose: ['Sucrose\n(g)'],
  maltose: ['Maltose \n(g)'],
  lactose: ['Lactose \n(g)'],
  galactose: ['Galactose \n(g)'],
  maltotrios: ['Maltotrios \n(g)'],
  ash: ['Ash \n(g)'],
  dextrin: ['Dextrin \n(g)'],
  glycerol: ['Glycerol \n(g)'],
  glycogen: ['Glycogen \n(g)'],
  inulin: ['Inulin \n(g)'],
  erythritol: ['Erythritol \n(g)', 'Erythritol\n(g)'],
  maltitol: ['Maltitol \n(g)'],
  mannitol: ['Mannitol \n(g)'],
  xylitol: ['Xylitol \n(g)'],
  maltodextrin: ['Maltodextrin (g)', 'Maltodextrin \n(g)'],
  oligosaccharides: ['Oligosaccharides  \n(g)', 'Oligosaccharides \n(g)'],
  polydextrose: ['Polydextrose \n(g)'],
  raffinose: ['Raffinose \n(g)', 'Raffinose\n(g)'],
  stachyose: ['Stachyose \n(g)'],
  sorbitol: ['Sorbitol \n(g)'],
}

const ADDITION_TWO_FIELD_HEADERS = {
  acetic_acid: ['Acetic acid \n(g)'],
  citric_acid: ['Citric acid \n(g)'],
  fumaric_acid: ['Fumaric acid \n(g)'],
  lactic_acid: ['Lactic acid \n(g)'],
  malic_acid: ['Malic acid\n (g)'],
  oxalic_acid: ['Oxalic acid \n(g)'],
  propionic_acid: ['Propionic acid \n(g)'],
  quinic_acid: ['Quinic acid \n(g)'],
  shikimic_acid: ['Shikimic acid \n(g)'],
  succinic_acid: ['Succinic acid \n(g)'],
  tartaric_acid: ['Tartaric acid \n(g)'],
  aluminium: ['Aluminium (Al) \n(ug)'],
  antimony: ['Antimony (Sb) \n(ug)'],
  arsenic: ['Arsenic (As) \n(ug)'],
  cadmium: ['Cadmium (Cd) \n(ug)'],
  calcium: ['Calcium (Ca) \n(mg)'],
  chromium: ['Chromium (Cr) \n(ug)'],
  chloride: ['Chloride (Cl) \n(mg)'],
  cobalt: ['Cobalt (Co) \n(ug)'],
  copper: ['Copper (Cu) \n(mg)'],
  fluoride: ['Fluoride (F) \n(ug)'],
  iodine: ['Iodine (I) \n(ug)'],
  iron: ['Iron (Fe) \n(mg)'],
  lead: ['Lead (Pb) \n(ug)'],
  magnesium: ['Magnesium (Mg) \n(mg)'],
  manganese: ['Manganese (Mn) \n(mg)'],
  mercury: ['Mercury (Hg) \n(ug)'],
  molybdenum: ['Molybdenum (Mo) \n(ug)'],
  nickel: ['Nickel (Ni) \n(ug)'],
  phosphorus: ['Phosphorus (P) \n(mg)'],
  potassium: ['Potassium (K) \n(mg)'],
  selenium: ['Selenium (Se) \n(ug)'],
  sodium: ['Sodium (Na) \n(mg)'],
  sulphur: ['Sulphur (S) \n(mg)'],
  tin: ['Tin (Sn) \n(ug)'],
  zinc: ['Zinc (Zn) \n(mg)'],
  retinol: ['Retinol (preformed vitamin A) \n(ug)'],
  alpha_carotene: ['Alpha-carotene \n(ug)'],
  beta_carotene: ['Beta-carotene \n(ug)'],
  cryptoxanthin: ['Cryptoxanthin \n(ug)'],
  beta_carotene_equivalents: ['Beta-carotene equivalents (provitamin A) \n(ug)'],
  vitamin_a_retinol_equivalents: ['Vitamin A retinol equivalents \n(ug)'],
  lutein: ['Lutein \n(ug)'],
  lycopene: ['Lycopene \n(ug)'],
  xanthophyl: ['Xanthophyl \n(ug)'],
  thiamin: ['Thiamin (B1) \n(mg)'],
  riboflavin: ['Riboflavin (B2) \n(mg)'],
  niacin: ['Niacin (B3) \n(mg)'],
  niacin_derived_from_tryptophan: ['Niacin derived from tryptophan \n(mg)'],
  niacin_derived_equivalents: ['Niacin derived equivalents \n(mg)'],
  pantothenic_acid: ['Pantothenic acid (B5) \n(mg)'],
  pyridoxine: ['Pyridoxine (B6) \n(mg)'],
  biotin: ['Biotin (B7) \n(ug)'],
  cobalamin: ['Cobalamin (B12) \n(ug)'],
  folate_natural: ['Folate, natural \n(ug)'],
  folic_acid: ['Folic acid \n(ug)'],
  total_folates: ['Total folates \n(ug)'],
  dietary_folate_equivalents: ['Dietary folate equivalents \n(ug)'],
  vitamin_c: ['Vitamin C \n(mg)'],
  cholecalciferol: ['Cholecalciferol (D3) \n(ug)'],
  ergocalciferol: ['Ergocalciferol (D2) \n(ug)'],
  hydroxy_cholecalciferol: ['25-hydroxy cholecalciferol (25-OH D3) \n(ug)'],
  hydroxy_ergocalciferol: ['25-hydroxy ergocalciferol (25-OH D2) \n(ug)'],
  vitamin_d_equivalents: ['Vitamin D3 equivalents \n(ug)'],
  alpha_tocopherol: ['Alpha tocopherol \n(mg)'],
  alpha_tocotrienol: ['Alpha tocotrienol \n(mg)'],
  beta_tocopherol: ['Beta tocopherol \n(mg)'],
  beta_tocotrienol: ['Beta tocotrienol \n(mg)'],
  delta_tocopherol: ['Delta tocopherol \n(mg)'],
  delta_tocotrienol: ['Delta tocotrienol \n(mg)'],
  gamma_tocopherol: ['Gamma tocopherol \n(mg)'],
  gamma_tocotrienol: ['Gamma tocotrienol \n(mg)'],
  vitamin_e: ['Vitamin E \n(mg)'],
}

const SATURATED_FIELDS = [
  'c4',
  'c6',
  'c8',
  'c10',
  'c11',
  'c12',
  'c13',
  'c14',
  'c15',
  'c16',
  'c17',
  'c18',
  'c19',
  'c20',
  'c21',
  'c22',
  'c23',
  'c24',
]

const MONOUNSATURATED_FIELDS = [
  'c10_1',
  'c12_1',
  'c14_1',
  'c15_1',
  'c16_1',
  'c17_1',
  'c18_1',
  'c18_1w5',
  'c18_1w6',
  'c18_1w7',
  'c18_1w9',
  'c20_1',
  'c20_1w9',
  'c20_1w13',
  'c20_1w11',
  'c22_1',
  'c22_1w9',
  'c22_1w11',
  'c24_1',
  'c24_1w9',
  'c24_1w11',
  'c24_1w13',
]

const POLYUNSATURATED_FIELDS = [
  'c12_2',
  'c16_2w4',
  'c16_3',
  'c18_2w6',
  'c18_3w3',
  'c18_3w4',
  'c18_3w6',
  'c18_4w1',
  'c18_4w3',
  'c20_2',
  'c20_2w6',
  'c20_3',
  'c20_3w3',
  'c20_3w6',
  'c20_4',
  'c20_4w3',
  'c20_4w6',
  'c20_5w3',
  'c21_5w3',
  'c22_2',
  'c22_2w6',
  'c22_4w6',
  'c22_5w3',
  'c22_5w6',
  'c22_6w3',
]

const AMINO_ACID_LABELS = {
  alanine: 'Alanine',
  arginine: 'Arginine',
  aspartic_acid: 'Aspartic acid',
  cystine_plus_cysteine: 'Cystine plus cysteine',
  glutamic_acid: 'Glutamic acid',
  glycine: 'Glycine',
  histidine: 'Histidine',
  isoleucine: 'Isoleucine',
  leucine: 'Leucine',
  lysine: 'Lysine',
  methionine: 'Methionine',
  phenylalanine: 'Phenylalanine',
  proline: 'Proline',
  serine: 'Serine',
  threonine: 'Threonine',
  tyrosine: 'Tyrosine',
  tryptophan: 'Tryptophan',
  valine: 'Valine',
}

function buildAdditionThreeFieldHeaders() {
  const fieldHeaders = {
    total_saturated_fatty_acids: [
      'Total saturated fatty acids, equated (%T)',
      'Total saturated fatty acids, equated \n(g)',
      'Total saturated fatty acids, equated (g)',
    ],
    total_monounsaturated_fatty_acids: [
      'Total monounsaturated fatty acids, equated (%T)',
      'Total monounsaturated fatty acids, equated \n(g)',
      'Total monounsaturated fatty acids, equated (g)',
    ],
    total_polyunsaturated_fatty_acids: [
      'Total polyunsaturated fatty acids, equated (%T)',
      'Total polyunsaturated fatty acids, equated \n(g)',
      'Total polyunsaturated fatty acids, equated (g)',
    ],
    total_long_chain_omega_3_fatty_acids: [
      'Total long chain omega 3 fatty acids, equated \n(%T)',
      'Total long chain omega 3 fatty acids, equated \n(mg)',
      'Total long chain omega 3 fatty acids, equated (mg)',
    ],
    total_trans_fatty_acids: [
      'Total trans fatty acids, imputed \n(%T)',
      'Total trans fatty acids, imputed \n(mg)',
      'Total trans fatty acids, imputed (mg)',
    ],
    caffeine: ['Caffeine \n(mg)', 'Caffeine (mg)'],
    cholesterol: ['Cholesterol \n(mg)', 'Cholesterol (mg)'],
    total_saturated_fatty_acids_equated: [
      'Total saturated fatty acids, equated (%T)',
      'Total saturated fatty acids, equated \n(g)',
      'Total saturated fatty acids, equated (g)',
    ],
    total_monounsaturated_fatty_acids_equated: [
      'Total monounsaturated fatty acids, equated (%T)',
      'Total monounsaturated fatty acids, equated \n(g)',
      'Total monounsaturated fatty acids, equated (g)',
    ],
    total_polyunsaturated_fatty_acids_equated: [
      'Total polyunsaturated fatty acids, equated (%T)',
      'Total polyunsaturated fatty acids, equated \n(g)',
      'Total polyunsaturated fatty acids, equated (g)',
    ],
  }

  for (const [field, label] of Object.entries(AMINO_ACID_LABELS)) {
    fieldHeaders[field] = [`${label} \n(mg/gN)`, `${label} (mg)`, `${label} \n(mg)`]
  }

  for (const field of [...SATURATED_FIELDS, ...MONOUNSATURATED_FIELDS, ...POLYUNSATURATED_FIELDS]) {
    const label = formatFattyAcidLabel(field)
    fieldHeaders[field] = [
      `${label} (%T)`,
      `${label} (g)`,
      `${label} \n(g)`,
      `${label} (mg)`,
      `${label} \n(mg)`,
    ]
  }

  return fieldHeaders
}

const ADDITION_THREE_FIELD_HEADERS = buildAdditionThreeFieldHeaders()

function formatFattyAcidLabel(field) {
  return field.replace(/^c/i, 'C').replace('_', ':')
}

function normalizeCell(value) {
  if (value === undefined || value === null) return null
  const trimmed = String(value)
    .replace(/\uFEFF/g, '')
    .trim()
  return trimmed === '' ? null : trimmed
}

function getValue(row, headers) {
  for (const header of headers) {
    const value = normalizeCell(row[header])
    if (value !== null) return value
  }
  return null
}

function getCalories(row, headers) {
  const raw = getValue(row, headers)
  if (raw === null) return null

  const kilojoules = Number.parseFloat(raw)
  if (!Number.isFinite(kilojoules)) return null

  return (kilojoules * 0.239).toFixed(2)
}

function mapFields(row, fieldHeaders) {
  const values = {}

  for (const [field, headers] of Object.entries(fieldHeaders)) {
    values[field] = getValue(row, headers)
  }

  return values
}

function parseCsv(text) {
  const rows = []
  let currentRow = []
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
  const headers = rawHeaders.map((header) => header.replace(/\uFEFF/g, ''))

  return dataRows
    .filter((row) => row.some((value) => normalizeCell(value) !== null))
    .map((row) =>
      Object.fromEntries(headers.map((header, columnIndex) => [header, row[columnIndex] ?? ''])),
    )
}

function buildIngredientPayload(row, serveUnit) {
  const foodName = getValue(row, BASE_FIELD_HEADERS.food_name)

  return {
    user_id: null,
    is_aus_food: 1,
    is_all_stores: 1,
    serve_size: '100',
    serve_unit: serveUnit,
    is_user_created: 0,
    is_supplement: 0,
    is_private: 0,
    name: foodName,
    ...mapFields(row, BASE_FIELD_HEADERS),
    calories_w_fibre: getCalories(row, ['Energy with dietary fibre, equated \n(kJ)']),
    calories_wo_fibre: getCalories(row, ['Energy, without dietary fibre, equated \n(kJ)']),
  }
}

function buildIngredientRecord(row, source) {
  return {
    source: source.label,
    ingredient: buildIngredientPayload(row, source.serveUnit),
    additionOne: mapFields(row, ADDITION_ONE_FIELD_HEADERS),
    additionTwo: mapFields(row, ADDITION_TWO_FIELD_HEADERS),
    additionThree: mapFields(row, ADDITION_THREE_FIELD_HEADERS),
  }
}

function resolveDatabaseUrl(databaseUrl) {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set. Add it to .env or pass it in the environment.')
  }

  if (!databaseUrl.startsWith('file:')) {
    return databaseUrl
  }

  const filePath = databaseUrl.slice('file:'.length)

  if (filePath.startsWith('//')) {
    return databaseUrl
  }

  const absolutePath = path.resolve(ROOT_DIR, filePath)
  return pathToFileURL(absolutePath).href
}

async function insertRow(tx, tableName, values) {
  const columns = Object.keys(values)
  const placeholders = columns.map(() => '?').join(', ')

  const result = await tx.execute({
    sql: `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING id`,
    args: columns.map((column) => values[column] ?? null),
  })

  const insertedId = result.rows[0]?.id
  return Number(insertedId)
}

async function updateRow(tx, tableName, rowId, values) {
  const columns = Object.keys(values)
  const assignments = columns.map((column) => `${column} = ?`).join(', ')

  await tx.execute({
    sql: `UPDATE ${tableName} SET ${assignments} WHERE id = ?`,
    args: [...columns.map((column) => values[column] ?? null), rowId],
  })
}

async function deleteChildRows(tx, ingredientId) {
  for (const tableName of CHILD_TABLES) {
    await tx.execute({
      sql: `DELETE FROM ${tableName} WHERE ingredient_id = ?`,
      args: [ingredientId],
    })
  }
}

async function syncIngredientRecord(tx, record, stats) {
  const existing = await tx.execute({
    sql: `
      SELECT id
      FROM ingredient
      WHERE public_food_key = ?
        AND serve_unit = ?
      ORDER BY id ASC
    `,
    args: [record.ingredient.public_food_key, record.ingredient.serve_unit],
  })

  const existingIds = existing.rows.map((row) => Number(row.id)).filter(Number.isFinite)
  let ingredientId

  if (existingIds.length === 0) {
    ingredientId = await insertRow(tx, 'ingredient', record.ingredient)
    stats.ingredientsInserted += 1
  } else {
    ingredientId = existingIds[0]
    await updateRow(tx, 'ingredient', ingredientId, record.ingredient)
    stats.ingredientsUpdated += 1

    for (const duplicateId of existingIds.slice(1)) {
      await deleteChildRows(tx, duplicateId)
      await tx.execute({
        sql: 'DELETE FROM ingredient WHERE id = ?',
        args: [duplicateId],
      })
      stats.duplicateIngredientsRemoved += 1
    }
  }

  await deleteChildRows(tx, ingredientId)

  await insertRow(tx, 'ingredient_addition_one', {
    ingredient_id: ingredientId,
    ...record.additionOne,
  })
  await insertRow(tx, 'ingredient_addition_two', {
    ingredient_id: ingredientId,
    ...record.additionTwo,
  })
  await insertRow(tx, 'ingredient_addition_three', {
    ingredient_id: ingredientId,
    ...record.additionThree,
  })

  stats.additionOneInserted += 1
  stats.additionTwoInserted += 1
  stats.additionThreeInserted += 1
}

function parseArgs(argv) {
  return {
    dryRun: argv.includes('--dry-run'),
    help: argv.includes('--help') || argv.includes('-h'),
  }
}

function printHelp() {
  console.log(`Usage:
  pnpm db:import-ingredients
  pnpm db:import-ingredients -- --dry-run

Options:
  --dry-run   Parse both CSV files and show what would be imported without writing to the database.
  --help      Show this message.
`)
}

async function loadRows() {
  const allRecords = []
  const fileSummaries = []

  for (const source of DEFAULT_FILES) {
    const csvText = await fs.readFile(source.filePath, 'utf8')
    const rows = parseCsv(csvText)
    const records = rows
      .map((row) => buildIngredientRecord(row, source))
      .filter((record) => record.ingredient.public_food_key && record.ingredient.name)

    allRecords.push(...records)
    fileSummaries.push({
      file: path.relative(ROOT_DIR, source.filePath),
      serveUnit: source.serveUnit,
      rows: records.length,
    })
  }

  return { allRecords, fileSummaries }
}

async function loadEnvironment() {
  if (process.env.DATABASE_URL) return

  const envPath = path.join(ROOT_DIR, '.env')

  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(envPath)
    return
  }

  const envText = await fs.readFile(envPath, 'utf8')

  for (const line of envText.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separator = trimmed.indexOf('=')
    if (separator === -1) continue

    const key = trimmed.slice(0, separator).trim()
    let value = trimmed.slice(separator + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    printHelp()
    return
  }

  await loadEnvironment()

  const { allRecords, fileSummaries } = await loadRows()

  const summary = {
    files: fileSummaries,
    ingredientRows: allRecords.length,
    additionRowsPerTable: allRecords.length,
  }

  if (args.dryRun) {
    console.log(JSON.stringify({ dryRun: true, ...summary }, null, 2))
    return
  }

  const client = createClient({
    url: resolveDatabaseUrl(process.env.DATABASE_URL),
  })

  const tx = await client.transaction('write')
  const stats = {
    ingredientsInserted: 0,
    ingredientsUpdated: 0,
    duplicateIngredientsRemoved: 0,
    additionOneInserted: 0,
    additionTwoInserted: 0,
    additionThreeInserted: 0,
  }

  try {
    for (const record of allRecords) {
      await syncIngredientRecord(tx, record, stats)
    }

    await tx.commit()

    console.log(
      JSON.stringify(
        {
          dryRun: false,
          ...summary,
          stats,
        },
        null,
        2,
      ),
    )
  } catch (error) {
    await tx.rollback()
    throw error
  } finally {
    tx.close()
    client.close()
  }
}

await main()
