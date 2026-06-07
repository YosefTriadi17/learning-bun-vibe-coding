# Learning Bun Vibe Coding 🚀

REST API Modern yang dibangun menggunakan **Bun**, **ElysiaJS**, dan **Drizzle ORM** dengan database **MySQL**. Aplikasi ini mendukung manajemen pengguna (CRUD) beserta sistem autentikasi berbasis *Bearer Token*.

---

## 🛠️ Stack Teknologi

Aplikasi ini menggunakan teknologi yang cepat dan modern:
- **Runtime**: [Bun](https://bun.sh/) (Runtime JavaScript yang sangat cepat sekaligus sebagai *package manager* dan *test runner*).
- **Framework Web**: [ElysiaJS](https://elysiajs.com/) (Web framework yang sangat ringan dan ergonomis untuk Bun).
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) (ORM TypeScript-first yang cepat dan minim overhead).
- **Database**: MySQL.
- **Keamanan**: `bcryptjs` (untuk hashing password).
- **Dokumentasi API**: Swagger (`@elysiajs/swagger`).

---

## 🏛️ Arsitektur Aplikasi

Proyek ini menerapkan arsitektur modular yang rapi (mirip dengan pola Controller-Service) untuk memudahkan pemeliharaan dan skalabilitas.

```text
learning-bun-vibe-coding/
├── drizzle/                    # Folder berisi skrip migrasi SQL yang dihasilkan oleh Drizzle Kit
├── src/                        # Kode sumber utama aplikasi
│   ├── db/                     # Pengaturan Database & ORM
│   │   ├── connection.ts       # Inisialisasi koneksi MySQL ke Drizzle ORM
│   │   ├── migrate.ts          # Skrip runner migrasi database
│   │   └── schema.ts           # Definisi skema tabel (users & sessions)
│   ├── middleware/             # Perangkat penengah ElysiaJS
│   │   └── error.ts            # Global Error Handler & penangkap error validasi TypeBox
│   ├── routes/                 # Definisi Endpoint API (Controllers)
│   │   ├── auth-routes.ts      # Endpoint untuk register, login, logout, dan current-user
│   │   ├── health.ts           # Endpoint status/kesehatan sistem
│   │   └── user-routes.ts      # Endpoint operasi CRUD pengguna
│   ├── services/               # Logika Bisnis Utama (Services)
│   │   ├── auth-service.ts     # Logika hashing password, manajemen sesi, token UUID
│   │   └── user-service.ts     # Logika pencarian, pembuatan, pembaruan, & penghapusan pengguna
│   ├── tests/                  # Skenario Pengujian (Unit & Integration Tests)
│   │   ├── auth.test.ts        # Tes khusus untuk alur Autentikasi
│   │   └── index.test.ts       # Tes operasi CRUD Pengguna & health check
│   └── index.ts                # Entry point utama; konfigurasi CORS, registrasi router & plugin Swagger
├── .env                        # Variabel lingkungan rahasia (Kredensial DB)
├── bun.lockb                   # File lock dependensi bawaan Bun
├── drizzle.config.ts           # Konfigurasi referensi Drizzle Kit
├── issue.md                    # File dokumentasi catatan perencanaan tugas
├── package.json                # Daftar dependensi & metadata Node/Bun
└── README.md                   # Dokumentasi lengkap proyek
```

---

## 🗄️ Skema Database

Skema database didefinisikan menggunakan Drizzle ORM pada file `src/db/schema.ts` dan terdiri dari 2 tabel utama:

### 1. Tabel `users`
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | Serial / PK | ID Unik Pengguna |
| `name` | Varchar(100) | Nama lengkap pengguna |
| `email` | Varchar(100) | Email unik |
| `password` | Varchar(100) | Password yang sudah di-hash |
| `createdAt` | Timestamp | Waktu pembuatan otomatis |
| `updatedAt` | Timestamp | Waktu pembaruan otomatis |

### 2. Tabel `sessions`
Tabel ini digunakan untuk mengelola *Bearer Token* saat pengguna melakukan autentikasi.
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | Serial / PK | ID Unik Sesi |
| `token` | Varchar(255) | Token UUID unik |
| `userId` | BigInt / FK | Referensi ke `users.id` (Cascade) |
| `createdAt` | Timestamp | Waktu sesi dibuat |
| `expiredAt` | Timestamp | Waktu sesi kedaluwarsa |

---

## 🔌 API Endpoints yang Tersedia

Dokumentasi API interaktif (Swagger UI) dapat diakses secara lokal pada:
`http://localhost:3000/swagger`

### Rute Publik
- **`GET /api/health`**
  Memeriksa status kesehatan aplikasi dan koneksi database.

### Auth API (`/api/auth`)
- **`POST /register`** : Mendaftarkan pengguna baru.
- **`POST /login`** : Otentikasi pengguna, mengembalikan *Token* sesi.
- **`POST /current-user`** *(Butuh Token)* : Mengambil data pengguna yang sedang login.
- **`POST /logout`** *(Butuh Token)* : Menghapus sesi dan keluar.

### Users API (`/api/users`)
- **`GET /`** : Mengambil semua data pengguna.
- **`GET /:id`** : Mengambil data pengguna berdasarkan ID.
- **`POST /`** : Membuat pengguna baru (Admin level / Testing).
- **`PUT /:id`** : Memperbarui data pengguna.
- **`DELETE /:id`** : Menghapus data pengguna.

---

## 🚀 Cara Setup Project

Ikuti langkah-langkah berikut untuk menjalankan aplikasi secara lokal:

1. **Install Bun** (Jika belum)
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Install Dependensi**
   ```bash
   bun install
   ```

3. **Konfigurasi Database**
   Buat file `.env` di root direktori dan sesuaikan koneksi MySQL Anda:
   ```env
   DATABASE_URL="mysql://root:password@localhost:3306/vibe_coding_db"
   ```

4. **Jalankan Migrasi Database**
   Buat tabel-tabel MySQL dengan mengeksekusi Drizzle:
   ```bash
   bun run db:generate
   bun run db:migrate
   ```

5. **Jalankan Server Mode Development**
   ```bash
   bun run dev
   ```
   Server akan berjalan di `http://localhost:3000`.

---

## 🧪 Testing (Pengujian)

Aplikasi ini sudah dilengkapi dengan pengujian (unit & integration testing) yang sangat komprehensif menggunakan *test runner* bawaan dari Bun.
Pengujian meliputi: *Validation errors, 404 handling, duplicate prevention, dan End-to-End Auth Flows.*

Untuk menjalankan semua pengujian:
```bash
bun test
```
*Pastikan database testing berjalan dan kredensial database di `.env` valid sebelum menjalankan tes, karena tes tersebut berinteraksi langsung ke database (menghapus dan mengisi kembali tabel `users` dan `sessions`).*
