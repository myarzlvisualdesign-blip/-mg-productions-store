# MG PRODUCTIONS Client Handoff

Dokumen ini untuk serah-terima source code MG PRODUCTIONS ke client tanpa mengubah file aplikasi yang sudah fix.

## 1. Isi Paket

Source code yang dikirim ke client sebaiknya berisi:

- `src/`
- `public/`
- `prisma/`
- `scripts/`
- `package.json`
- `package-lock.json`
- `next.config.ts`
- `tailwind.config.ts`
- `tsconfig.json`
- `.env.example`
- `SUPABASE-SETUP.md`
- `CLIENT-HANDOFF.md`

Yang **jangan** ikut dikirim:

- `.env`
- `node_modules/`
- `.next/`
- `.git/`
- `.vercel/`
- `backups/`
- file log lokal

## 2. Stack Proyek

- Framework: Next.js 16
- Runtime UI: React 19
- Database ORM: Prisma
- Database: PostgreSQL
- Target deployment utama: Vercel
- PWA: aktif

## 3. Setup Lokal Client

1. Extract ZIP project.
2. Buka folder project.
3. Copy `.env.example` menjadi `.env`.
4. Isi semua value environment yang dibutuhkan.
5. Jalankan:

```bash
npm install
npm run db:generate
npm run dev
```

Default local app:

- App: `http://localhost:3000`

## 4. Environment Variables

Wajib:

```env
AUTH_SECRET="isi-random-string-yang-panjang"
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="isi-password-admin"
```

Opsional:

```env
BLOB_READ_WRITE_TOKEN="isi-jika-upload-gambar-harus-persist-di-vercel"
```

Catatan:

- `DATABASE_URL` dipakai aplikasi saat runtime.
- `DIRECT_URL` dipakai Prisma untuk operasi schema langsung.
- Jangan pernah kirim file `.env` asli ke client kalau masih berisi secret lama.

## 5. Cara Menghubungkan Database

Project ini sudah disiapkan untuk PostgreSQL dan cocok dipasang ke Supabase Postgres.

Langkah:

1. Buat project baru di Supabase milik client.
2. Ambil 2 connection string dari halaman database connection:
   - pooled connection untuk `DATABASE_URL`
   - direct connection untuk `DIRECT_URL`
3. Isi `.env` lokal client atau environment variables di Vercel.
4. Generate Prisma client:

```bash
npm run db:generate
```

5. Sinkronkan schema ke database kosong:

```bash
npx prisma db push
```

6. File seed tersedia di folder `prisma/`, tetapi repo ini belum menyiapkan command seed otomatis di `package.json`.
7. Opsi isi data awal:
   - input manual dari panel admin setelah deploy
   - jalankan file seed secara manual oleh developer client jika mereka menambahkan runner TypeScript sendiri

Catatan:

- Untuk handoff client non-teknis, jalur paling aman adalah deploy dulu, lalu isi data dari panel admin.

## 6. Cara Menghubungkan ke Vercel

Disarankan client membuat project Vercel baru di akun mereka sendiri.

Langkah:

1. Upload source ke repo GitHub client, atau import repo yang sudah ada ke akun Vercel client.
2. Buat project baru di Vercel.
3. Framework akan terdeteksi sebagai Next.js.
4. Isi Environment Variables:
   - `AUTH_SECRET`
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `BLOB_READ_WRITE_TOKEN` jika upload gambar perlu persisten
5. Deploy.
6. Setelah deploy pertama, kalau database masih kosong, jalankan schema sync dari mesin lokal yang bisa connect ke DB:

```bash
npx prisma db push
```

7. Redeploy jika dibutuhkan.

Catatan penting:

- File `.vercel/project.json` di mesin developer bersifat lokal. Jangan dijadikan acuan untuk akun client.
- Client harus melakukan `vercel link` atau membuat project baru dari dashboard Vercel mereka sendiri.

## 7. Cara Pindah Hosting

Kalau pindah dari akun Vercel lama ke akun Vercel client:

1. Pastikan source code sudah ada di repo yang bisa diakses client.
2. Buat project baru di akun Vercel client.
3. Masukkan environment variables yang sama, tapi gunakan secret milik client.
4. Deploy ulang dari akun client.
5. Setelah project baru sehat, baru domain diarahkan ke project baru.

Kalau pindah ke hosting selain Vercel:

1. Pastikan hosting support Node.js dan Next.js production server.
2. Set semua environment variables.
3. Jalankan:

```bash
npm install
npm run db:generate
npm run build
npm run start
```

4. Reverse proxy domain ke service Node yang berjalan.

Catatan:

- Project ini paling aman tetap di Vercel karena flow Next.js + API route + PWA sudah cocok di sana.

## 8. Cara Pindah Domain

Jika domain saat ini masih menempel ke project lama:

1. Tambahkan domain ke project baru di Vercel client.
2. Lihat DNS record yang diminta Vercel.
3. Update DNS di registrar/domain provider.
4. Jika domain masih attached di project Vercel lama, lepas dulu dari project lama.
5. Tunggu propagasi DNS.
6. Tes:
   - home page
   - admin login
   - API route
   - PWA install

## 9. Checklist Sebelum Diserahkan

- `npm install`
- `npm run lint`
- `npm run build`
- pastikan `.env` tidak ikut dalam ZIP
- pastikan `.vercel/` tidak ikut dalam ZIP
- pastikan `node_modules/` tidak ikut dalam ZIP
- pastikan `backups/` tidak ikut dalam ZIP
- pastikan client menerima `.env.example` dan dokumen ini

## 10. Catatan Operasional

- Build production saat ini memakai webpack:

```bash
npm run build
```

- Prisma client digenerate otomatis saat install lewat `postinstall`.
- Jika upload file di production harus persisten, aktifkan Vercel Blob lewat `BLOB_READ_WRITE_TOKEN`.
- Setelah pindah akun atau domain, selalu tes ulang PWA install di desktop dan Android.
