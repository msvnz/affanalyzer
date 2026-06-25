# AffAnalyzer Pro

Dashboard Analisis Affiliate Shopee & Meta Ads berbasis web 100% Client-Side. Berjalan tanpa server backend/database cloud, aman menjaga privasi data performa penjualan lu sendiri.

## Cara Upload ke GitHub
1. Buat repository baru di akun GitHub Anda dengan nama `affanalyzer-pro`.
2. Pastikan repository di-set menjadi **Public**.
3. Ekstrak file `AffAnalyzer-Pro.zip` ini, lalu upload seluruh file ke dalam repository tersebut (bisa drag-and-drop langsung ke web GitHub atau via Git CLI).

## Cara Mengaktifkan GitHub Pages
1. Di halaman repository GitHub Anda, buka menu **Settings**.
2. Cari dan klik menu **Pages** di sidebar bagian kiri.
3. Pada bagian **Build and deployment** -> **Source**, pilih `Deploy from a branch`.
4. Pada dropdown branch di bawahnya, pilih `main` (atau `master`) dan folder `/ (root)`.
5. Klik **Save**. Tunggu beberapa menit, link aplikasi web Anda akan muncul dan siap diakses.

## Cara Menggunakan Aplikasi
1. Buka link GitHub Pages yang sudah aktif.
2. Masuk ke menu **Upload CSV** di sidebar.
3. Masukkan 3 file laporan CSV Anda secara bersamaan.
4. Klik tombol **Submit Laporan**. Data otomatis terproses dan Anda akan diarahkan ke halaman Dashboard utama.

## Cara Upload 3 CSV & Format yang Didukung
Aplikasi membutuhkan 3 file ekspor laporan dengan spesifikasi kolom wajib sebagai berikut:
1. **Meta Ads Report CSV**: Harus mengandung kolom `Jumlah yang dibelanjakan (IDR)` dan kolom `Indikator Hasil` (berisi `actions:link_click`) atau kolom `Hasil`.
2. **Website Click Report CSV (Shopee Link)**: Harus mengandung kolom yang mendeteksi tag (seperti `Tag Link` atau `Sub_ID` atau `Tag_link1`). Jumlah baris dihitung sebagai total klik Shopee.
3. **Affiliate Commission Report CSV**: Harus mengandung kolom `Komisi Bersih Affiliate (Rp)` atau `Komisi` serta kolom tag `Tag_link1`. Jumlah baris dihitung sebagai jumlah total order.

Semua data riwayat otomatis di-cache dan disimpan aman di dalam `localStorage` browser Anda. Anda juga bisa melakukan Backup/Restore database JSON via menu **Backup & Export**.
