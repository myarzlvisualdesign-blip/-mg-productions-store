/* eslint-disable @typescript-eslint/no-require-imports */
const { execFileSync } = require('child_process')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const sqlitePath = path.join(process.cwd(), 'db', 'custom.db')
const db = new PrismaClient()

function readSqlite(table) {
  const query = `select * from "${table}";`
  const output = execFileSync('sqlite3', ['-json', sqlitePath, query], {
    encoding: 'utf8',
  })

  return output.trim() ? JSON.parse(output) : []
}

function toBool(value) {
  return value === 1 || value === true
}

function toDate(value) {
  return value ? new Date(value) : new Date()
}

async function main() {
  const categories = readSqlite('Category').map((row) => ({
    id: row.id,
    name: row.name,
    order: row.order,
    active: toBool(row.active),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  }))

  const products = readSqlite('Product').map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    image: row.image,
    category: row.category,
    link: row.link || '',
    stock: row.stock,
    featured: toBool(row.featured),
    rating: row.rating,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  }))

  const partners = readSqlite('Partner').map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    image: row.image,
    link: row.link || '',
    order: row.order,
    active: toBool(row.active),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  }))

  const orders = readSqlite('Order').map((row) => ({
    id: row.id,
    items: row.items,
    total: row.total,
    status: row.status,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone,
    address: row.address,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  }))

  const topup = readSqlite('TopUpService').map((row) => ({
    id: row.id,
    name: row.name,
    subtitle: row.subtitle,
    emoji: row.emoji,
    color: row.color,
    image: row.image,
    items: row.items,
    link: row.link || '',
    order: row.order,
    active: toBool(row.active),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  }))

  const food = readSqlite('FoodItem').map((row) => ({
    id: row.id,
    name: row.name,
    subtitle: row.subtitle,
    emoji: row.emoji,
    color: row.color,
    image: row.image,
    items: row.items,
    link: row.link || '',
    order: row.order,
    active: toBool(row.active),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  }))

  const travel = readSqlite('TravelService').map((row) => ({
    id: row.id,
    name: row.name,
    subtitle: row.subtitle,
    emoji: row.emoji,
    color: row.color,
    image: row.image,
    desc: row.desc,
    link: row.link || '',
    order: row.order,
    active: toBool(row.active),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  }))

  const banners = readSqlite('TopUpBanner').map((row) => ({
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    badge: row.badge,
    image: row.image,
    link: row.link || '',
    color: row.color,
    order: row.order,
    active: toBool(row.active),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  }))

  const chatbot = readSqlite('ChatbotSettings').map((row) => ({
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    welcomeMessage: row.welcomeMessage,
    systemPrompt: row.systemPrompt,
    enabled: toBool(row.enabled),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  }))

  const referralSettings = readSqlite('ReferralSettings').map((row) => ({
    id: row.id,
    enabled: toBool(row.enabled),
    referrerReward: row.referrerReward,
    refereeReward: row.refereeReward,
    minOrderAmount: row.minOrderAmount,
    minWithdraw: row.minWithdraw,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  }))

  const referralCodes = readSqlite('ReferralCode').map((row) => ({
    id: row.id,
    code: row.code,
    ownerName: row.ownerName,
    ownerEmail: row.ownerEmail,
    totalUsed: row.totalUsed,
    totalReward: row.totalReward,
    totalWithdrawn: row.totalWithdrawn,
    active: toBool(row.active),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  }))

  const referralUses = readSqlite('ReferralUse').map((row) => ({
    id: row.id,
    referralCodeId: row.referralCodeId,
    orderType: row.orderType,
    orderId: row.orderId,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    referrerReward: row.referrerReward,
    refereeReward: row.refereeReward,
    createdAt: toDate(row.createdAt),
  }))

  const referralWithdrawals = readSqlite('ReferralWithdrawal').map((row) => ({
    id: row.id,
    referralCodeId: row.referralCodeId,
    amount: row.amount,
    bankName: row.bankName,
    bankAccount: row.bankAccount,
    accountHolder: row.accountHolder,
    status: row.status,
    adminNote: row.adminNote || '',
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  }))

  const destinations = readSqlite('PopularDestination').map((row) => ({
    id: row.id,
    name: row.name,
    subtitle: row.subtitle,
    emoji: row.emoji,
    color: row.color,
    image: row.image,
    order: row.order,
    active: toBool(row.active),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  }))

  await db.referralWithdrawal.deleteMany()
  await db.referralUse.deleteMany()
  await db.referralCode.deleteMany()
  await db.referralSettings.deleteMany()
  await db.chatbotSettings.deleteMany()
  await db.topUpBanner.deleteMany()
  await db.travelService.deleteMany()
  await db.foodItem.deleteMany()
  await db.topUpService.deleteMany()
  await db.order.deleteMany()
  await db.partner.deleteMany()
  await db.product.deleteMany()
  await db.popularDestination.deleteMany()
  await db.category.deleteMany()

  if (categories.length) await db.category.createMany({ data: categories })
  if (products.length) await db.product.createMany({ data: products })
  if (partners.length) await db.partner.createMany({ data: partners })
  if (orders.length) await db.order.createMany({ data: orders })
  if (topup.length) await db.topUpService.createMany({ data: topup })
  if (food.length) await db.foodItem.createMany({ data: food })
  if (travel.length) await db.travelService.createMany({ data: travel })
  if (banners.length) await db.topUpBanner.createMany({ data: banners })
  if (chatbot.length) await db.chatbotSettings.createMany({ data: chatbot })
  if (referralSettings.length) await db.referralSettings.createMany({ data: referralSettings })
  if (referralCodes.length) await db.referralCode.createMany({ data: referralCodes })
  if (referralUses.length) await db.referralUse.createMany({ data: referralUses })
  if (referralWithdrawals.length) await db.referralWithdrawal.createMany({ data: referralWithdrawals })
  if (destinations.length) await db.popularDestination.createMany({ data: destinations })

  console.log('SQLite data migrated to Supabase successfully.')
  console.log({
    categories: categories.length,
    products: products.length,
    partners: partners.length,
    orders: orders.length,
    topup: topup.length,
    food: food.length,
    travel: travel.length,
    banners: banners.length,
    destinations: destinations.length,
  })
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
