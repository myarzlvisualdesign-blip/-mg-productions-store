import { db } from '../src/lib/db'

async function seed() {
  console.log('Seeding Top Up Banners...')

  await db.topUpBanner.deleteMany()

  const banners = [
    {
      title: 'Flash Sale Diamond',
      subtitle: 'Diskon hingga 30% untuk semua game favorit!',
      badge: '🔥 FLASH SALE',
      image: '/uploads/topup-banners/promo-diamond.png',
      link: '',
      color: 'from-purple-600 to-blue-500',
      order: 0,
    },
    {
      title: 'Weekly Pass Special',
      subtitle: 'Beli pass mingguan & dapatkan bonus eksklusif setiap hari',
      badge: '✨ PROMO',
      image: '/uploads/topup-banners/promo-weekly.png',
      link: '',
      color: 'from-amber-600 to-orange-500',
      order: 1,
    },
    {
      title: 'Top Up E-Wallet',
      subtitle: 'GoPay, OVO, DANA, ShopeePay — proses instan tanpa ribet',
      badge: '💰 CASHBACK',
      image: '/uploads/topup-banners/promo-ewallet.png',
      link: '',
      color: 'from-emerald-600 to-teal-500',
      order: 2,
    },
  ]

  for (const b of banners) {
    await db.topUpBanner.create({ data: b })
  }

  console.log(`Seeded ${banners.length} banners`)
}

seed()
  .catch(console.error)
  .finally(() => process.exit(0))
