const API_BASE      = 'http://platformV2.test:8080/api-toko';
const API_URL       = `${API_BASE}/get_barang.php`;
const API_TAMBAH    = `${API_BASE}/tambah_barang.php`;
const API_HAPUS     = `${API_BASE}/hapus_barang.php`;
const API_EDIT      = `${API_BASE}/edit_barang.php`;
const API_STATISTIK = `${API_BASE}/statistik.php`;

const TOKEN    = localStorage.getItem('token_toko');
const USERNAME = localStorage.getItem('username_toko');

// State untuk search & pagination
let halamanSaatIni    = 1;
let totalHalamanGlobal = 1;
let keywordPencarian  = "";

// State untuk dashboard grafik
let tipeChartAktif    = 'bar';  
let dataChartTerakhir = null; 

document.addEventListener('DOMContentLoaded', () => {
    updateHeaderAuth();
    ambilDataBarang();
    renderDashboard();
    document.querySelector('[data-tipe-chart="bar"]')?.classList.add('aktif');
});

function updateHeaderAuth() {
    const infoUser      = document.getElementById('info-user');
    const labelUsername = document.getElementById('label-username');
    const btnLogout     = document.getElementById('btn-logout');
    const btnLogin      = document.getElementById('btn-login');
    const btnTambah     = document.getElementById('btn-tambah');
    const bannerTamu    = document.getElementById('banner-tamu');
    const thAksi        = document.getElementById('th-aksi');

    if (TOKEN && USERNAME) {
        if (labelUsername) labelUsername.textContent = USERNAME;
        if (infoUser)   infoUser.classList.replace('hidden', 'flex');
        if (btnLogout)  btnLogout.classList.replace('hidden', 'flex');
        if (btnLogin)   btnLogin.classList.add('hidden');
        if (btnTambah)  btnTambah.classList.replace('hidden', 'flex');
        if (bannerTamu) bannerTamu.classList.add('hidden');
        if (thAksi)     thAksi.classList.remove('hidden');
    } else {
        if (labelUsername) labelUsername.textContent = 'Tamu';
        if (infoUser)   infoUser.classList.add('hidden');
        if (btnLogout)  btnLogout.classList.add('hidden');
        if (btnLogin)   btnLogin.classList.remove('hidden');
        if (btnTambah)  btnTambah.classList.add('hidden');
        if (bannerTamu) bannerTamu.classList.remove('hidden');
        if (thAksi)     thAksi.classList.add('hidden');
    }
}

function logout() {
    localStorage.removeItem('token_toko');
    localStorage.removeItem('username_toko');
    window.location.reload();
}

function pastikanLogin() {
    if (!TOKEN) {
        tampilkanToast('error', 'Silakan login terlebih dahulu!');
        setTimeout(() => { window.location.href = 'login.html'; }, 1200);
        return false;
    }
    return true;
}

let dataBarangGlobal = [];

async function ambilDataBarang() {
    try {
        const urlAPI = `${API_URL}?cari=${encodeURIComponent(keywordPencarian)}&page=${halamanSaatIni}`;
        const response = await fetch(urlAPI);
        if (!response.ok) throw new Error(`HTTP Error: Status ${response.status}`);

        const hasil = await response.json();
        if (hasil.status === 'success') {
            dataBarangGlobal = hasil.data;
            renderTabel(dataBarangGlobal);
            updateStatusBadge(true, hasil.total_data);
            document.getElementById('pesan-error').classList.add('hidden');
            updateNavigasiHalaman(hasil);
        } else {
            throw new Error(hasil.message || hasil.pesan || 'Respons tidak valid.');
        }
    } catch (error) {
        tampilkanError(error.message);
        updateStatusBadge(false);
        console.error('Gagal mengambil data:', error);
    }
}

// =====================================================
// DASHBOARD: Statistik Global (Total/Max/Min) + Grafik Chart.js
// Sumber data: statistik.php (dihitung MySQL dari SELURUH tabel,
// bukan hanya dari data yang sedang tampil di halaman aktif)
// =====================================================
async function renderDashboard() {
    try {
        const response = await fetch(API_STATISTIK);
        const json = await response.json();

        if (json.status === 'success') {
            // ---- 1. Update kartu Total / Harga Tertinggi / Harga Terendah ----
            const fmt = (n) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n);
            document.getElementById('stat-total').textContent = json.stats.total_barang;
            document.getElementById('stat-max').textContent   = json.stats.harga_max !== null ? fmt(json.stats.harga_max) : '—';
            document.getElementById('stat-min').textContent   = json.stats.harga_min !== null ? fmt(json.stats.harga_min) : '—';

            // ---- 2. Simpan data chart ke cache, lalu gambar ----
            dataChartTerakhir = json.chart_data;
            gambarChart(tipeChartAktif);
        }
    } catch (error) {
        console.error('Gagal memuat dashboard:', error);
    }
}

// Melukis grafik sesuai tipe yang dipilih (bar/pie/doughnut).
// Dipisah dari renderDashboard() agar ganti tipe grafik tidak perlu fetch ulang ke server.
function gambarChart(tipe) {
    if (!dataChartTerakhir) return;

    const ctx = document.getElementById('myChart');

    // BUG FIX: Ghosting Effect — hancurkan chart lama sebelum gambar ulang
    let chartStatus = Chart.getChart('myChart');
    if (chartStatus != undefined) {
        chartStatus.destroy();
    }

    const warnaList = [
        'rgba(16, 185, 129, 0.6)',  // hijau (emerald)
        'rgba(59, 130, 246, 0.6)',  // biru
        'rgba(234, 88, 12, 0.6)',   // orange
        'rgba(236, 72, 153, 0.6)',  // pink
        'rgba(139, 92, 246, 0.6)'   // ungu
    ];

    // Legend hanya relevan untuk pie/doughnut (bar sudah jelas dari sumbu X)
    const tampilkanLegend = (tipe === 'pie' || tipe === 'doughnut');

    new Chart(ctx, {
        type: tipe, // 'bar' | 'pie' | 'doughnut'
        data: {
            labels: dataChartTerakhir.labels,
            datasets: [{
                label: 'Harga Barang (Rp)',
                data: dataChartTerakhir.values,
                backgroundColor: warnaList,
                borderColor: tipe === 'bar' ? 'rgba(16, 185, 129, 1)' : '#ffffff',
                borderWidth: tipe === 'bar' ? 1 : 2,
                borderRadius: tipe === 'bar' ? 6 : 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // wajib false agar mengikuti tinggi container
            plugins: {
                legend: { display: tampilkanLegend, position: 'bottom' }
            },
            scales: tipe === 'bar'
                ? { y: { beginAtZero: true } } // sumbu Y hanya untuk bar
                : {}                            // pie/doughnut tidak pakai scales
        }
    });
}

// Dipanggil saat tombol jenis grafik diklik (lihat tombol di index.html)
function gantiTipeChart(tipe) {
    tipeChartAktif = tipe;

    // Tandai tombol yang aktif secara visual
    document.querySelectorAll('.btn-tipe-chart').forEach(btn => {
        btn.classList.toggle('aktif', btn.getAttribute('data-tipe-chart') === tipe);
    });

    gambarChart(tipe); // redraw memakai data yang sudah di-cache, tanpa fetch ulang
}

function updateNavigasiHalaman(hasil) {
    totalHalamanGlobal = hasil.total_halaman;
    halamanSaatIni      = hasil.halaman_saat_ini;

    const infoHalaman = document.getElementById('info-halaman');
    const btnPrev      = document.getElementById('btn-prev');
    const btnNext      = document.getElementById('btn-next');

    if (infoHalaman) {
        infoHalaman.innerHTML = `Halaman ${hasil.halaman_saat_ini} dari ${hasil.total_halaman} (Total: ${hasil.total_data} Data)`;
    }
    if (btnPrev) btnPrev.disabled = (halamanSaatIni <= 1);
    if (btnNext) btnNext.disabled = (halamanSaatIni >= totalHalamanGlobal);
}

// Dipanggil saat onkeyup di kotak pencarian
function filterTabel() {
    keywordPencarian = document.getElementById('input-cari').value.trim();
    halamanSaatIni = 1; // reset ke halaman 1 setiap kali keyword berubah
    ambilDataBarang();
}

// Dipanggil saat klik tombol Mundur (-1) / Lanjut (1)
function gantiHalaman(arah) {
    const targetHalaman = halamanSaatIni + arah;
    if (targetHalaman < 1 || targetHalaman > totalHalamanGlobal) return;
    halamanSaatIni = targetHalaman;
    ambilDataBarang();
}

function kompresGambar(file, maxSizeMB = 1.5) {
    return new Promise((resolve) => {
        const maxBytes = maxSizeMB * 1024 * 1024;
        if (file.size <= maxBytes) { resolve(file); return; }

        const reader = new FileReader();
        reader.onerror = () => resolve(file);
        reader.onload = (e) => {
            const img = new Image();
            img.onerror = () => resolve(file);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                const MAX_DIM = 1200;
                if (width > MAX_DIM || height > MAX_DIM) {
                    if (width > height) {
                        height = Math.round(height * MAX_DIM / width);
                        width  = MAX_DIM;
                    } else {
                        width  = Math.round(width * MAX_DIM / height);
                        height = MAX_DIM;
                    }
                }

                canvas.width  = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) { resolve(file); return; }
                        const namaFile = file.name.replace(/\.[^.]+$/, '.jpg');
                        resolve(new File([blob], namaFile, { type: 'image/jpeg' }));
                    },
                    'image/jpeg',
                    0.82
                );
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function validasiFile(file) {
    if (!file) return true;
    const tipeOk = ['image/jpeg', 'image/png', 'image/webp'];
    if (!tipeOk.includes(file.type)) {
        tampilkanToast('error', 'Format gambar tidak didukung. Gunakan JPG, PNG, atau WEBP.');
        return false;
    }
    if (file.size > 10 * 1024 * 1024) {
        tampilkanToast('error', 'Ukuran gambar terlalu besar (maks 10MB).');
        return false;
    }
    return true;
}

async function simpanBarang() {
    if (!pastikanLogin()) return;

    const nama  = document.getElementById('modal-input-nama').value.trim();
    const harga = document.getElementById('modal-input-harga').value;
    let   file  = document.getElementById('modal-input-gambar').files[0];

    document.getElementById('modal-error-nama').classList.add('hidden');
    document.getElementById('modal-error-harga').classList.add('hidden');

    let valid = true;
    if (!nama)                        { document.getElementById('modal-error-nama').classList.remove('hidden');  valid = false; }
    if (!harga || Number(harga) <= 0) { document.getElementById('modal-error-harga').classList.remove('hidden'); valid = false; }
    if (!valid) return;

    if (!validasiFile(file)) return;

    const btn = document.getElementById('modal-btn-simpan');
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...`;

    try {
        if (file) {
            file = await kompresGambar(file, 1.5);
        }

        const dataKirim = new FormData();
        dataKirim.append('nama_barang', nama);
        dataKirim.append('harga', Number(harga));
        if (file) dataKirim.append('gambar', file);

        const response = await fetch(API_TAMBAH, {
            method: 'POST',
            headers: { 'Authorization': TOKEN || '' },
            body: dataKirim
        });

        if (response.status === 401) {
            tutupModal();
            tampilkanToast('error', 'Sesi habis, silakan login ulang.');
            setTimeout(() => { window.location.href = 'login.html'; }, 1500);
            return;
        }

        const hasil = await response.json();

        if (!response.ok) {
            tampilkanToast('error', hasil.pesan || `Error: ${response.status}`);
            return;
        }

        if (hasil.status === 'sukses') {
            tutupModal();
            document.getElementById('modal-input-nama').value   = '';
            document.getElementById('modal-input-harga').value  = '';
            document.getElementById('modal-input-gambar').value = '';
            tampilkanToast('success', 'Barang berhasil ditambahkan!');
            halamanSaatIni = 1; // barang baru muncul di atas (ORDER BY id DESC), balik ke hal. 1
            await ambilDataBarang();
            renderDashboard(); // refresh statistik & grafik
        } else {
            tampilkanToast('error', hasil.pesan || 'Gagal menyimpan data.');
        }
    } catch (err) {
        tampilkanToast('error', 'Koneksi ke server gagal.');
        console.error('Gagal tambah:', err);
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Simpan`;
    }
}

function bukaModalEdit(id) {
    if (!pastikanLogin()) return;

    const barang = dataBarangGlobal.find(b => String(b.id) === String(id));
    if (!barang) return;

    document.getElementById('edit-input-id').value     = barang.id;
    document.getElementById('edit-input-nama').value   = barang.nama_barang;
    document.getElementById('edit-input-harga').value  = barang.harga;
    document.getElementById('edit-input-gambar').value = '';
    document.getElementById('edit-error-nama').classList.add('hidden');
    document.getElementById('edit-error-harga').classList.add('hidden');

    const preview     = document.getElementById('edit-preview-gambar');
    const gambarValid = barang.gambar && barang.gambar !== '0' && barang.gambar !== '';
    if (gambarValid) {
        preview.src = `${API_BASE}/uploads/${barang.gambar}`;
        preview.classList.remove('hidden');
    } else {
        preview.src = '';
        preview.classList.add('hidden');
    }

    document.getElementById('modal-edit-overlay').classList.add('modal-open');
    setTimeout(() => document.getElementById('edit-input-nama').focus(), 50);
}

function tutupModalEdit() {
    document.getElementById('modal-edit-overlay').classList.remove('modal-open');
}
function tutupModalEditLuar(event) {
    if (event.target === document.getElementById('modal-edit-overlay')) tutupModalEdit();
}

async function simpanEdit() {
    if (!pastikanLogin()) return;

    const id    = document.getElementById('edit-input-id').value;
    const nama  = document.getElementById('edit-input-nama').value.trim();
    const harga = Number(document.getElementById('edit-input-harga').value);
    let   file  = document.getElementById('edit-input-gambar').files[0];

    document.getElementById('edit-error-nama').classList.add('hidden');
    document.getElementById('edit-error-harga').classList.add('hidden');

    let valid = true;
    if (!nama)      { document.getElementById('edit-error-nama').classList.remove('hidden');  document.getElementById('edit-input-nama').focus();  valid = false; }
    if (harga <= 0) { document.getElementById('edit-error-harga').classList.remove('hidden'); if (valid) document.getElementById('edit-input-harga').focus(); valid = false; }
    if (!valid) return;

    if (!validasiFile(file)) return;

    const btn = document.getElementById('edit-btn-simpan');
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...`;

    try {
        if (file) {
            file = await kompresGambar(file, 1.5);
        }

        const dataKirim = new FormData();
        dataKirim.append('_method',     'PUT');
        dataKirim.append('id',          id);
        dataKirim.append('nama_barang', nama);
        dataKirim.append('harga',       harga);
        if (file) dataKirim.append('gambar', file);

        const response = await fetch(API_EDIT, {
            method: 'POST',
            headers: { 'Authorization': TOKEN || '' },
            body: dataKirim
        });

        if (response.status === 401) {
            tutupModalEdit();
            tampilkanToast('error', 'Sesi habis, silakan login ulang.');
            setTimeout(() => { window.location.href = 'login.html'; }, 1500);
            return;
        }

        const hasil = await response.json();

        if (!response.ok) {
            tampilkanToast('error', hasil.pesan || `Error: ${response.status}`);
            return;
        }

        if (hasil.status === 'sukses') {
            const idx = dataBarangGlobal.findIndex(b => String(b.id) === String(id));
            if (idx !== -1) {
                dataBarangGlobal[idx].nama_barang = nama;
                dataBarangGlobal[idx].harga       = harga;
                if (hasil.gambar !== undefined) {
                    dataBarangGlobal[idx].gambar = hasil.gambar || null;
                }
            }
            tutupModalEdit();
            renderTabel(dataBarangGlobal);
            renderDashboard(); // refresh statistik & grafik (harga bisa berubah, top 5 bisa berubah)
            tampilkanToast('success', 'Barang berhasil diperbarui!');
        } else {
            tampilkanToast('error', hasil.pesan || 'Gagal memperbarui data.');
        }
    } catch (err) {
        tampilkanToast('error', 'Koneksi ke server gagal.');
        console.error('Gagal edit:', err);
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Simpan`;
    }
}

function hapusBarang(id_target, nama_target) {
    if (!pastikanLogin()) return;
    bukaModalKonfirmasi(id_target, nama_target);
}

async function eksekusiHapus(id_target) {
    tutupModalKonfirmasi();

    const btnHapus = document.querySelector(`[data-hapus-id="${id_target}"]`);
    if (btnHapus) {
        btnHapus.disabled = true;
        btnHapus.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
    }

    try {
        const response = await fetch(API_HAPUS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': TOKEN || '' },
            body: JSON.stringify({ _method: 'DELETE', id: Number(id_target) })
        });

        if (response.status === 401) {
            tampilkanToast('error', 'Sesi habis, silakan login ulang.');
            setTimeout(() => { window.location.href = 'login.html'; }, 1500);
            return;
        }

        const hasil = await response.json();

        if (!response.ok) {
            tampilkanToast('error', hasil.pesan || `Error: ${response.status}`);
            if (btnHapus) { btnHapus.disabled = false; btnHapus.innerHTML = `<i class="fa-solid fa-trash"></i>`; }
            return;
        }

        if (hasil.status === 'sukses') {
            tampilkanToast('success', 'Barang berhasil dihapus!');
            // Jika halaman saat ini jadi kosong setelah hapus (mis. hapus item terakhir di halaman terakhir), mundur 1 halaman
            if (dataBarangGlobal.length === 1 && halamanSaatIni > 1) {
                halamanSaatIni -= 1;
            }
            await ambilDataBarang();
            renderDashboard(); // refresh statistik & grafik
        } else {
            tampilkanToast('error', hasil.pesan || 'Gagal menghapus data.');
            if (btnHapus) { btnHapus.disabled = false; btnHapus.innerHTML = `<i class="fa-solid fa-trash"></i>`; }
        }
    } catch (err) {
        tampilkanToast('error', 'Koneksi ke server gagal.');
        console.error('Gagal hapus:', err);
        if (btnHapus) { btnHapus.disabled = false; btnHapus.innerHTML = `<i class="fa-solid fa-trash"></i>`; }
    }
}

function bukaModal() {
    if (!pastikanLogin()) return;
    document.getElementById('modal-input-nama').value   = '';
    document.getElementById('modal-input-harga').value  = '';
    document.getElementById('modal-input-gambar').value = '';
    document.getElementById('modal-error-nama').classList.add('hidden');
    document.getElementById('modal-error-harga').classList.add('hidden');
    document.getElementById('modal-overlay').classList.add('modal-open');
    setTimeout(() => document.getElementById('modal-input-nama').focus(), 50);
}
function tutupModal() {
    document.getElementById('modal-overlay').classList.remove('modal-open');
}
function tutupModalLuar(event) {
    if (event.target === document.getElementById('modal-overlay')) tutupModal();
}

function bukaModalKonfirmasi(id, nama) {
    document.getElementById('konfirmasi-nama-barang').textContent = nama;
    document.getElementById('konfirmasi-btn-hapus').setAttribute('data-konfirmasi-id', id);
    document.getElementById('modal-konfirmasi-overlay').classList.add('modal-open');
}
function tutupModalKonfirmasi() {
    document.getElementById('modal-konfirmasi-overlay').classList.remove('modal-open');
}
function tutupModalKonfirmasiLuar(event) {
    if (event.target === document.getElementById('modal-konfirmasi-overlay')) tutupModalKonfirmasi();
}

document.addEventListener('keydown', function (e) {
    const modalTambahOpen     = document.getElementById('modal-overlay').classList.contains('modal-open');
    const modalEditOpen       = document.getElementById('modal-edit-overlay').classList.contains('modal-open');
    const modalKonfirmasiOpen = document.getElementById('modal-konfirmasi-overlay').classList.contains('modal-open');

    if (e.key === 'Escape') {
        if (modalKonfirmasiOpen)  tutupModalKonfirmasi();
        else if (modalEditOpen)   tutupModalEdit();
        else if (modalTambahOpen) tutupModal();
    }
    if (e.key === 'Enter') {
        if (modalTambahOpen) simpanBarang();
        if (modalEditOpen)   simpanEdit();
    }
});

function buatIsiBarisHTML(barang, hargaFormatted) {
    const sudahLogin = !!TOKEN;

    const gambarValid = barang.gambar && barang.gambar !== '0' && barang.gambar !== '';
    const urlGambar   = gambarValid ? `${API_BASE}/uploads/${barang.gambar}` : null;

    const imgPlaceholder = `<div class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mx-auto"><i class="fa-regular fa-image text-slate-300" style="font-size:14px;"></i></div>`;

    const imgHTML = urlGambar
        ? `<img src="${urlGambar}"
               alt="${escapeHtml(barang.nama_barang)}"
               class="w-10 h-10 object-cover rounded-lg border border-slate-100 mx-auto"
               onerror="this.parentNode.innerHTML=decodeURIComponent('${encodeURIComponent(imgPlaceholder)}')">`
        : imgPlaceholder;

    const namaEscaped = escapeHtml(barang.nama_barang);
    const namaAttr    = namaEscaped.replace(/&#39;/g, '&apos;');

    const kolomAksi = sudahLogin
        ? `<td class="px-6 py-4 text-center">
               <div class="flex items-center justify-center gap-1.5">
                   <button onclick="bukaModalEdit(${barang.id})"
                       title="Edit ${namaAttr}"
                       class="w-8 h-8 rounded-lg bg-sky-50 hover:bg-sky-100 active:scale-95 text-sky-400 hover:text-sky-600 flex items-center justify-center transition-all duration-150">
                       <i class="fa-solid fa-pen" style="font-size:12px;"></i>
                   </button>
                   <button onclick="hapusBarang(${barang.id}, '${namaAttr}')"
                       data-hapus-id="${barang.id}"
                       title="Hapus ${namaAttr}"
                       class="btn-hapus w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 active:scale-95 text-red-400 hover:text-red-600 flex items-center justify-center transition-all duration-150">
                       <i class="fa-solid fa-trash" style="font-size:12px;"></i>
                   </button>
               </div>
           </td>`
        : '';

    return `
        <td class="px-6 py-4 text-slate-400 font-mono text-xs">${barang.id}</td>
        <td class="px-4 py-4 text-center">${imgHTML}</td>
        <td class="px-6 py-4 font-semibold text-slate-700">
            <i class="fa-regular fa-circle-dot text-emerald-300 mr-2" style="font-size:11px;"></i>${namaEscaped}
        </td>
        <td class="px-6 py-4 text-center">
            <span class="badge-harga">
                <i class="fa-solid fa-coins mr-1 text-emerald-400" style="font-size:11px;"></i>Rp ${hargaFormatted}
            </span>
        </td>
        ${kolomAksi}
    `;
}

function renderTabel(data) {
    const tbody       = document.getElementById('tabel-barang');
    const footer      = document.getElementById('tabel-footer');
    const countTampil = document.getElementById('count-tampil');
    const countTotal  = document.getElementById('count-total');

    tbody.innerHTML = '';

    if (data.length === 0) {
        const colspan = TOKEN ? 5 : 4;
        tbody.innerHTML = `
            <tr>
                <td colspan="${colspan}" class="px-6 py-12 text-center text-slate-400">
                    <div class="mb-3"><i class="fa-solid fa-box-open text-4xl text-slate-200"></i></div>
                    <p class="font-semibold">Tidak ada barang ditemukan.</p>
                </td>
            </tr>`;
        footer.classList.add('hidden');
        return;
    }

    let barisHTML = '';
    data.forEach((barang, index) => {
        const hargaFormatted = new Intl.NumberFormat('id-ID').format(barang.harga);
        const delayMs = index * 60;
        barisHTML += `
            <tr data-row-id="${barang.id}" class="border-b border-slate-100 row-animate" style="animation-delay:${delayMs}ms">
                ${buatIsiBarisHTML(barang, hargaFormatted)}
            </tr>`;
    });

    tbody.innerHTML         = barisHTML;
    countTampil.textContent = data.length;
    countTotal.textContent  = dataBarangGlobal.length;
    footer.classList.remove('hidden');
}

function updateStatusBadge(berhasil, jumlah = 0) {
    const badge = document.getElementById('status-badge');
    if (berhasil) {
        badge.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-400" style="font-size:10px;"></i><span class="text-emerald-600 font-medium">${jumlah} barang ditemukan</span>`;
        badge.className = 'flex items-center gap-2 text-xs bg-emerald-50 px-3 py-1.5 rounded-full';
    } else {
        badge.innerHTML = `<i class="fa-solid fa-circle-xmark text-red-400" style="font-size:10px;"></i><span class="text-red-500 font-medium">Koneksi gagal</span>`;
        badge.className = 'flex items-center gap-2 text-xs bg-red-50 px-3 py-1.5 rounded-full';
    }
}

function tampilkanError(pesan) {
    const colspan = TOKEN ? 5 : 4;
    document.getElementById('tabel-barang').innerHTML = `
        <tr>
            <td colspan="${colspan}" class="px-6 py-10 text-center text-slate-300 text-sm">
                <i class="fa-solid fa-plug-circle-xmark text-2xl mb-2 block"></i>
                Tidak ada data untuk ditampilkan.
            </td>
        </tr>`;
    document.getElementById('teks-error').textContent = pesan;
    document.getElementById('pesan-error').classList.remove('hidden');
}

let toastTimer;
function tampilkanToast(tipe, pesan) {
    const toast      = document.getElementById('toast');
    const toastInner = document.getElementById('toast-inner');
    const toastIcon  = document.getElementById('toast-icon');
    const toastPesan = document.getElementById('toast-pesan');

    toastPesan.textContent = pesan;

    if (tipe === 'success') {
        toastInner.className = 'flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold bg-emerald-500 text-white';
        toastIcon.className  = 'fa-solid fa-circle-check';
    } else {
        toastInner.className = 'flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold bg-red-500 text-white';
        toastIcon.className  = 'fa-solid fa-circle-xmark';
    }

    toast.classList.remove('hidden', 'toast-hide');
    toast.classList.add('toast-show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove('toast-show');
        toast.classList.add('toast-hide');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 3000);
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('[App] SW registered:', reg.scope))
            .catch(err => console.error('[App] SW failed:', err));
    });
}