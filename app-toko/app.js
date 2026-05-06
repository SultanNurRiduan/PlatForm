const API_URL    = 'https://sultannurriduankriptografi.infinityfreeapp.com/PlatForm/api-toko/get_barang.php';
const API_TAMBAH = 'https://sultannurriduankriptografi.infinityfreeapp.com/PlatForm/api-toko/tambah_barang.php';
const API_HAPUS  = 'https://sultannurriduankriptografi.infinityfreeapp.com/PlatForm/api-toko/hapus_barang.php';
const API_EDIT   = 'https://sultannurriduankriptografi.infinityfreeapp.com/PlatForm/api-toko/edit_barang.php';

let dataBarangGlobal = [];

// ============================================================
// GET — Ambil data dari server
// ============================================================
async function ambilDataBarang() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`HTTP Error: Status ${response.status}`);

        const hasil = await response.json();
        if (hasil.status === 'success') {
            dataBarangGlobal = hasil.data;
            renderTabel(dataBarangGlobal);
            updateStatistik(dataBarangGlobal);
            updateStatusBadge(true, dataBarangGlobal.length);
        } else {
            throw new Error(hasil.message || 'Respons dari server tidak valid.');
        }
    } catch (error) {
        tampilkanError(error.message);
        updateStatusBadge(false);
        console.error('Gagal mengambil data:', error);
    }
}

// ============================================================
// POST — Simpan barang baru
// ============================================================
async function simpanBarang() {
    const nama  = document.getElementById('modal-input-nama').value.trim();
    const harga = document.getElementById('modal-input-harga').value;

    document.getElementById('modal-error-nama').classList.add('hidden');
    document.getElementById('modal-error-harga').classList.add('hidden');

    let valid = true;
    if (!nama)                        { document.getElementById('modal-error-nama').classList.remove('hidden');  valid = false; }
    if (!harga || Number(harga) <= 0) { document.getElementById('modal-error-harga').classList.remove('hidden'); valid = false; }
    if (!valid) return;

    const btn = document.getElementById('modal-btn-simpan');
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...`;

    try {
        const response = await fetch(API_TAMBAH, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nama_barang: nama, harga: Number(harga) })
        });
        if (!response.ok) throw new Error(`HTTP Error: Status ${response.status}`);

        const hasil = await response.json();
        if (hasil.status === 'sukses') {
            tutupModal();
            document.getElementById('modal-input-nama').value  = '';
            document.getElementById('modal-input-harga').value = '';
            tampilkanToast('success', 'Barang berhasil ditambahkan!');
            await ambilDataBarang();
        } else {
            tampilkanToast('error', hasil.pesan || 'Gagal menyimpan data.');
        }
    } catch (err) {
        tampilkanToast('error', 'Koneksi ke server gagal.');
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Simpan`;
    }
}

// ============================================================
// POST + _method=PUT — Edit barang via modal
// ============================================================
function bukaModalEdit(id) {
    const barang = dataBarangGlobal.find(b => String(b.id) === String(id));
    if (!barang) return;

    document.getElementById('edit-input-id').value    = barang.id;
    document.getElementById('edit-input-nama').value  = barang.nama_barang;
    document.getElementById('edit-input-harga').value = barang.harga;

    document.getElementById('edit-error-nama').classList.add('hidden');
    document.getElementById('edit-error-harga').classList.add('hidden');

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
    const id    = document.getElementById('edit-input-id').value;
    const nama  = document.getElementById('edit-input-nama').value.trim();
    const harga = Number(document.getElementById('edit-input-harga').value);

    document.getElementById('edit-error-nama').classList.add('hidden');
    document.getElementById('edit-error-harga').classList.add('hidden');

    let valid = true;
    if (!nama)      { document.getElementById('edit-error-nama').classList.remove('hidden');  document.getElementById('edit-input-nama').focus();  valid = false; }
    if (harga <= 0) { document.getElementById('edit-error-harga').classList.remove('hidden'); if (valid) document.getElementById('edit-input-harga').focus(); valid = false; }
    if (!valid) return;

    const btn = document.getElementById('edit-btn-simpan');
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...`;

    try {
        // InfinityFree memblokir PUT — gunakan POST + _method=PUT
        const response = await fetch(API_EDIT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ _method: 'PUT', id: Number(id), nama_barang: nama, harga })
        });
        if (!response.ok) throw new Error(`HTTP Error: Status ${response.status}`);

        const hasil = await response.json();

        if (hasil.status === 'sukses') {
            const idx = dataBarangGlobal.findIndex(b => String(b.id) === String(id));
            if (idx !== -1) {
                dataBarangGlobal[idx].nama_barang = nama;
                dataBarangGlobal[idx].harga       = harga;
            }
            tutupModalEdit();
            renderTabel(dataBarangGlobal);
            updateStatistik(dataBarangGlobal);
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

// ============================================================
// POST + _method=DELETE — Hapus barang
// ============================================================
async function hapusBarang(id_target, nama_target) {
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
        // InfinityFree memblokir DELETE — gunakan POST + _method=DELETE
        const response = await fetch(API_HAPUS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ _method: 'DELETE', id: id_target })
        });
        if (!response.ok) throw new Error(`HTTP Error: Status ${response.status}`);

        const hasil = await response.json();
        if (hasil.status === 'sukses') {
            tampilkanToast('success', 'Barang berhasil dihapus!');
            await ambilDataBarang();
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

// ============================================================
// MODAL KONFIRMASI HAPUS
// ============================================================
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

// ============================================================
// MODAL TAMBAH
// ============================================================
function bukaModal() {
    document.getElementById('modal-input-nama').value  = '';
    document.getElementById('modal-input-harga').value = '';
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

// Keyboard shortcut global
document.addEventListener('keydown', function (e) {
    const modalTambahOpen     = document.getElementById('modal-overlay').classList.contains('modal-open');
    const modalEditOpen       = document.getElementById('modal-edit-overlay').classList.contains('modal-open');
    const modalKonfirmasiOpen = document.getElementById('modal-konfirmasi-overlay').classList.contains('modal-open');

    if (e.key === 'Escape') {
        if (modalTambahOpen)     tutupModal();
        if (modalEditOpen)       tutupModalEdit();
        if (modalKonfirmasiOpen) tutupModalKonfirmasi();
    }
    if (e.key === 'Enter') {
        if (modalTambahOpen) simpanBarang();
        if (modalEditOpen)   simpanEdit();
    }
});

// ============================================================
// RENDER TABEL
// ============================================================
function buatIsiBarisHTML(barang, hargaFormatted) {
    return `
        <td class="px-6 py-4 text-slate-400 font-mono text-xs">${barang.id}</td>
        <td class="px-6 py-4 font-semibold text-slate-700">
            <i class="fa-regular fa-circle-dot text-emerald-300 mr-2" style="font-size:11px;"></i>${escapeHtml(barang.nama_barang)}
        </td>
        <td class="px-6 py-4 text-center">
            <span class="badge-harga">
                <i class="fa-solid fa-coins mr-1 text-emerald-400" style="font-size:11px;"></i>Rp ${hargaFormatted}
            </span>
        </td>
        <td class="px-6 py-4 text-center">
            <div class="flex items-center justify-center gap-1.5">
                <button
                    onclick="bukaModalEdit(${barang.id})"
                    title="Edit ${escapeHtml(barang.nama_barang)}"
                    class="w-8 h-8 rounded-lg bg-sky-50 hover:bg-sky-100 active:scale-95 text-sky-400 hover:text-sky-600 flex items-center justify-center transition-all duration-150"
                >
                    <i class="fa-solid fa-pen" style="font-size:12px;"></i>
                </button>
                <button
                    onclick="hapusBarang(${barang.id}, '${escapeHtml(barang.nama_barang).replace(/'/g, "\\'")}')"
                    data-hapus-id="${barang.id}"
                    title="Hapus ${escapeHtml(barang.nama_barang)}"
                    class="btn-hapus w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 active:scale-95 text-red-400 hover:text-red-600 flex items-center justify-center transition-all duration-150"
                >
                    <i class="fa-solid fa-trash" style="font-size:12px;"></i>
                </button>
            </div>
        </td>
    `;
}

function renderTabel(data) {
    const tbody       = document.getElementById('tabel-barang');
    const footer      = document.getElementById('tabel-footer');
    const countTampil = document.getElementById('count-tampil');
    const countTotal  = document.getElementById('count-total');

    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="px-6 py-12 text-center text-slate-400">
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

// ============================================================
// STATISTIK
// ============================================================
function updateStatistik(data) {
    const statTotal = document.getElementById('stat-total');
    const statMax   = document.getElementById('stat-max');
    const statMin   = document.getElementById('stat-min');

    if (data.length === 0) {
        statTotal.textContent = '0';
        statMax.textContent   = '—';
        statMin.textContent   = '—';
        return;
    }

    const hargaArr = data.map(b => Number(b.harga));
    const fmt = (n) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n);

    statTotal.textContent = data.length;
    statMax.textContent   = fmt(Math.max(...hargaArr));
    statMin.textContent   = fmt(Math.min(...hargaArr));
}

// ============================================================
// FILTER / SEARCH
// ============================================================
function filterTabel() {
    const keyword     = document.getElementById('input-cari').value.toLowerCase().trim();
    const hasilFilter = dataBarangGlobal.filter(b =>
        b.nama_barang.toLowerCase().includes(keyword)
    );
    renderTabel(hasilFilter);
    updateStatistik(hasilFilter);
}

// ============================================================
// STATUS BADGE
// ============================================================
function updateStatusBadge(berhasil, jumlah = 0) {
    const badge = document.getElementById('status-badge');
    if (berhasil) {
        badge.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-400" style="font-size:10px;"></i><span class="text-emerald-600 font-medium">${jumlah} barang dimuat</span>`;
        badge.className = 'flex items-center gap-2 text-xs bg-emerald-50 px-3 py-1.5 rounded-full';
    } else {
        badge.innerHTML = `<i class="fa-solid fa-circle-xmark text-red-400" style="font-size:10px;"></i><span class="text-red-500 font-medium">Koneksi gagal</span>`;
        badge.className = 'flex items-center gap-2 text-xs bg-red-50 px-3 py-1.5 rounded-full';
    }
}

// ============================================================
// PESAN ERROR
// ============================================================
function tampilkanError(pesan) {
    document.getElementById('tabel-barang').innerHTML = `
        <tr>
            <td colspan="4" class="px-6 py-10 text-center text-slate-300 text-sm">
                <i class="fa-solid fa-plug-circle-xmark text-2xl mb-2 block"></i>
                Tidak ada data untuk ditampilkan.
            </td>
        </tr>`;
    document.getElementById('teks-error').textContent = pesan;
    document.getElementById('pesan-error').classList.remove('hidden');
}

// ============================================================
// TOAST NOTIFICATION
// ============================================================
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

// ============================================================
// UTILITY — Escape HTML untuk mencegah XSS
// ============================================================
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ============================================================
// PWA — Service Worker
// ============================================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('[App] SW registered. Scope:', reg.scope))
            .catch(err => console.error('[App] SW failed:', err));
    });
}

// ============================================================
// INIT
// ============================================================
ambilDataBarang();