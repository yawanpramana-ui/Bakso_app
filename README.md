# 🍜 Bakso Quest RPG - Panduan Jalankan Aplikasi di Local Code Editor

Selamat datang di repository **Bakso Quest RPG Nusantara**! Dokumentasi ini berisi panduan langkah demi langkah yang ringkas dan lengkap untuk melakukan *pull / clone* repository ini dan mengoperasikannya di lingkungan lokal (misalnya menggunakan Visual Studio Code) tanpa kendala maupun *error*.

---

## 📋 1. Prasyarat Sistem (System Requirements)

Pastikan perangkat Anda telah terpasang perangkat lunak berikut sebelum memulai:

- **Node.js**: Versi **18.x** atau **20.x (LTS)** *(Rekomendasi v20.x)*
  - Cek versi Node.js Anda dengan perintah: `node -v`
- **npm** (biasanya otomatis terpasang bersama Node.js) atau **Bun** / **Yarn**
  - Cek versi npm: `npm -v`
- **Git**: Terpasang di komputer Anda
- **Code Editor**: Visual Studio Code (VS Code) atau editor pilihan Anda.

---

## 🚀 2. Langkah-Langkah Mengunduh & Jalankan (Quick Start)

### **Langkah 1: Clone Repository**
Buka Terminal / Command Prompt di komputer Anda, lalu jalankan perintah:

```bash
git clone <URL_REPOSITORY_GITHUB_ANDA>
cd <NAMA_FOLDER_PROJECT>
```

---

### **Langkah 2: Install Dependensi**
Jalankan perintah berikut di folder project untuk mengunduh semua library yang dibutuhkan (`react`, `firebase`, `leaflet`, `lucide-react`, `tailwindcss`, dll.):

```bash
npm install
```

> 💡 **Tips Bebas Error**: Jika Anda mengalami konflik dependensi versi, gunakan flag `--legacy-peer-deps`:
> ```bash
> npm install --legacy-peer-deps
> ```

---

### **Langkah 3: Pengaturan File Environment (`.env`)**
Buat file baru bernama `.env` pada direktori utama (*root*) project dengan menyalin isi dari `.env.example`:

**Linux / macOS:**
```bash
cp .env.example .env
```

**Windows (PowerShell / CMD):**
```cmd
copy .env.example .env
```

Isi file `.env` lokal Anda:
```env
GEMINI_API_KEY="API_KEY_GEMINI_ANDA_OPTIONAL"
APP_URL="http://localhost:3000"
```

*Catatan: Konfigurasi Firebase Firestore & Auth secara otomatis membaca file `firebase-applet-config.json` yang sudah ada di direktori project.*

---

### **Langkah 4: Jalankan Server Pengembang (Development Server)**
Jalankan perintah berikut untuk memulai aplikasi:

```bash
npm run dev
```

Server lokal akan berjalan pada alamat:
👉 **`http://localhost:3000`**

Buka browser pilihan Anda (Google Chrome, Edge, Safari) dan akses alamat di atas.

---

## 🔑 3. Konfigurasi Google Login (Firebase Auth) di Localhost

Aplikasi **Bakso Quest RPG** mendukung autentikasi Google dan Anonim melalui Firebase. Untuk menguji login dengan akun Google Anda di `localhost`:

1. Buka [Firebase Console](https://console.firebase.google.com/).
2. Pilih project Firebase Anda (`gen-lang-client-0230580004` / `ai-studio-baksoquest...`).
3. Masuk ke **Authentication** -> **Settings** -> **Authorized domains**.
4. Pastikan **`localhost`** dan **`127.0.0.1`** sudah ada di dalam daftar domain yang diizinkan (*Authorized Domains*).
5. Jika belum ada, klik **Add domain** dan masukkan `localhost`.

---

## 📜 4. Perintah Utama Script (NPM Scripts)

| Perintah | Fungsi |
| :--- | :--- |
| `npm run dev` | Menjalankan aplikasi dalam mode pengembangan lokal di `http://localhost:3000` |
| `npm run build` | Membuat bundel produksi (*production build*) di folder `dist/` |
| `npm run preview` | Menjalankan preview dari hasil build produksi |
| `npm run lint` | Memeriksa tipe TypeScript (*TypeScript typecheck*) tanpa output |

---

## 🛠️ 5. Troubleshooting (Solusi Masalah Umum)

### **1. Port 3000 Sudah Terpakai (`EADDRINUSE: port 3000`)**
Jika port 3000 digunakan oleh aplikasi lain, Anda dapat menghentikan proses yang berjalan atau mengubah port pada file `vite.config.ts`:
```ts
server: {
  port: 3000, // ganti ke 3001 jika diperlukan
}
```

### **2. Peta Leaflet Terlihat Rusak atau Ubin Tidak Muncul**
Pastikan koneksi internet Anda aktif saat pertama kali memuat peta karena peta menggunakan ubin OpenStreetMap secara online.

### **3. Error `tsc --noEmit` saat Linting**
Pastikan ekstensi TypeScript di VS Code menggunakan versi TypeScript project (`v5.8+`). Cukup jalankan `npm run lint` untuk mengecek status tipe data.

---

## 🗂️ 6. Struktur Direktori Utama

```text
├── src/
│   ├── components/       # Komponen UI (HomeScreenModal, SplashScreen, BaksoMap, dll.)
│   ├── data/             # Data awal & resep preset warung bakso
│   ├── lib/              # Inisialisasi Firebase & helper database
│   ├── types.ts          # Definisi Tipe TypeScript (HunterProfile, BaksoSpot, dll.)
│   ├── utils/            # Synthesizer Suara Web Audio API (soundFx)
│   ├── App.tsx           # Komponen Utama Game & Routing Modal
│   └── main.tsx          # Entrypoint Aplikasi
├── firebase-applet-config.json  # Konfigurasi Cloud Firebase
├── index.html            # Template HTML Utama & Font Retro
└── package.json          # Dependensi & Script
```

---

*Selamat berpetualang dan mencari warung bakso favorit Anda di Bakso Quest RPG! 🍜⚔️*
