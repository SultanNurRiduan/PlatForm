const API_URL = 'http://platform.test:8080/api-toko/get_barang.php';

let dataBarangGlobal = [];

async function ambilDataBarang() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`HTTP Error: Status ${response.status}`);
        }

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

function renderTabel(data) {
    const tbody       = document.getElementById('tabel-barang');
    const footer      = document.getElementById('tabel-footer');
    const countTampil = document.getElementById('count-tampil');
    const countTotal  = document.getElementById('count-total');

    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" class="px-6 py-12 text-center text-slate-400">
                    <div class="mb-3">
                        <i class="fa-solid fa-box-open text-4xl text-slate-200"></i>
                    </div>
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
            <tr class="border-b border-slate-100 row-animate" style="animation-delay: ${delayMs}ms">
                <td class="px-6 py-4 text-slate-400 font-mono text-xs">${barang.id}</td>
                <td class="px-6 py-4 font-semibold text-slate-700">
                    <i class="fa-regular fa-circle-dot text-emerald-300 mr-2" style="font-size:11px;"></i>${barang.nama_barang}
                </td>
                <td class="px-6 py-4 text-center">
                    <span class="badge-harga">
                        <i class="fa-solid fa-coins mr-1 text-emerald-400" style="font-size:11px;"></i>Rp ${hargaFormatted}
                    </span>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = barisHTML;

    countTampil.textContent = data.length;
    countTotal.textContent  = dataBarangGlobal.length;
    footer.classList.remove('hidden');
}

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
    const max = Math.max(...hargaArr);
    const min = Math.min(...hargaArr);
    const fmt = (n) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n);

    statTotal.textContent = data.length;
    statMax.textContent   = fmt(max);
    statMin.textContent   = fmt(min);
}

function filterTabel() {
    const keyword = document.getElementById('input-cari').value.toLowerCase().trim();
    const hasilFilter = dataBarangGlobal.filter(b =>
        b.nama_barang.toLowerCase().includes(keyword)
    );
    renderTabel(hasilFilter);
    updateStatistik(hasilFilter);
}

function updateStatusBadge(berhasil, jumlah = 0) {
    const badge = document.getElementById('status-badge');
    if (berhasil) {
        badge.innerHTML = `
            <i class="fa-solid fa-circle-check text-emerald-400" style="font-size:10px;"></i>
            <span class="text-emerald-600 font-medium">${jumlah} barang dimuat</span>`;
        badge.className = 'flex items-center gap-2 text-xs bg-emerald-50 px-3 py-1.5 rounded-full';
    } else {
        badge.innerHTML = `
            <i class="fa-solid fa-circle-xmark text-red-400" style="font-size:10px;"></i>
            <span class="text-red-500 font-medium">Koneksi gagal</span>`;
        badge.className = 'flex items-center gap-2 text-xs bg-red-50 px-3 py-1.5 rounded-full';
    }
}

function tampilkanError(pesan) {
    document.getElementById('tabel-barang').innerHTML = `
        <tr>
            <td colspan="3" class="px-6 py-10 text-center text-slate-300 text-sm">
                <i class="fa-solid fa-plug-circle-xmark text-2xl mb-2 block"></i>
                Tidak ada data untuk ditampilkan.
            </td>
        </tr>`;
    document.getElementById('teks-error').textContent = pesan;
    document.getElementById('pesan-error').classList.remove('hidden');
}

// ============================================================
// REGISTRASI SERVICE WORKER (PWA)
// ============================================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('[App] Service Worker berhasil didaftarkan! Scope:', registration.scope);
            })
            .catch(err => {
                console.error('[App] Service Worker gagal didaftarkan:', err);
            });
    });
}

// Jalankan pengambilan data saat halaman dimuat
ambilDataBarang();