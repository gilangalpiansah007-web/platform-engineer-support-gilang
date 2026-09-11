# Soal Tes Praktik — Platform Engineer Support (Entry Test)

**Tools yang harus disiapkan:** akses ke Docker Engine (local/VM), Docker API (unix socket atau TCP), text editor

Tema soal mengacu ke konteks tool traceability yang akan dibangun (Task Management → Repository → CI/CD → Quality → Artifact Registry → Deployment status per environment).

---

## Soal 1 — Dashboard Status Container (Foundation)

**Skenario:**
Di server target sudah berjalan 4-6 container (campuran nama service, sebagian sengaja diberi label seperti `com.project.env=staging` atau `com.project.env=production`).

**Tugas:**
Modifikasi halaman frontend sederhana yang:

1. Mengambil data container dari Docker API (`GET /containers/json`)
2. Menampilkan: nama container, image + tag, status (running/exited/restarting), dan environment (dari label)
3. Mengelompokkan tampilan per environment
4. (Bonus) Perbaiki UI dengan look and feel yang nyaman untuk digunakan

---

## Soal 2 — Investigasi Container Bermasalah (Troubleshooting)

**Skenario:**
Salah satu container di environment sudah di-setup agar restart loop / exit dengan kode error tertentu

**Tugas:**

1. Deteksi container mana yang bermasalah (boleh manual `docker ps` atau lewat API `/containers/json` dengan filter status)
2. Ambil root cause dari logs (`GET /containers/{id}/logs`) dan/atau `docker inspect` untuk exit code & error message
3. Tuliskan diagnosis singkat: apa yang salah, dan langkah perbaikan konkret (bukan cuma "restart container")
4. (Bonus) Perbaiki containernya sampai jalan normal

---

## Soal 3 — Cek Kesesuaian Versi Deployment (Tie-in ke Traceability Tool)

**Skenario:**
Diberikan sebuah "target version" untuk suatu service (misal dari file `desired-state.json` yang isinya `{"service": "api-gateway", "expected_tag": "v2.3.1"}`), sementara container yang aktual berjalan mungkin memakai tag lain.

**Tugas:**

1. Ambil image tag yang sedang berjalan untuk service tersebut lewat Docker API
2. Bandingkan dengan `expected_tag` di file
3. Tampilkan status kecocokan: MATCH / MISMATCH / SERVICE NOT RUNNING
4. Jelaskan singkat (di komentar kode atau catatan terpisah): kalau ini harus dikembangkan jadi tool yang mengecek versi di banyak environment sekaligus, bagian mana yang perlu diubah pendekatannya (misal: dari cek manual jadi scheduled job)

---

## Hasil Implementasi

### Soal 1 — Dashboard Status Container

Dashboard berhasil mengambil data container melalui Docker API dan menampilkan:

- Nama container
- Image dan tag
- Status container
- Environment berdasarkan label `com.project.env`
- Pengelompokan berdasarkan environment
- Indikator container bermasalah

Dashboard dapat diakses melalui:

`http://localhost:8080`

### Soal 2 — Investigasi Container Bermasalah

Container yang ditemukan bermasalah:

`reporting-service`

Status:

`Restarting (1)`

Root cause:

Environment variable `REPORTING_DB_URL` tidak tersedia sehingga proses container keluar dengan exit code 1.

Perbaikan konkret:

Mendefinisikan `REPORTING_DB_URL` dengan connection string database yang valid, kemudian melakukan deploy ulang container.

### Soal 3 — Deployment Version Check

Service:

`api-gateway`

Expected version:

`v2.3.1`

Running version:

`v2.3.0`

Result:

`MISMATCH`

Dashboard menampilkan hasil perbandingan versi secara otomatis.

### Cara Menjalankan

Pastikan Docker Engine berjalan, kemudian jalankan:

```bash
docker compose up -d --build
