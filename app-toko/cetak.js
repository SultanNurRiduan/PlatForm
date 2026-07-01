const API_BASE = 'http://platformV2.test:8080/api-toko';

const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR'
    }).format(angka);
};

async function siapkanLaporan() {
    const now = new Date();
    document.getElementById('tanggal-cetak').innerText =
        `Dicetak pada: ${now.toLocaleString('id-ID').replace(/\./g, ':')}`;

    // Sesuai app.js: key-nya token_toko
    const myToken = localStorage.getItem('token_toko');

    if (!myToken) {
        alert("Akses Ditolak: Anda belum login!");
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/cetak_laporan.php`, {
            method: 'GET',
            headers: {
                'Authorization': myToken // cekToken() baca header Authorization langsung
            }
        });

        if (response.status === 401) {
            alert("Sesi habis, silakan login ulang.");
            window.location.href = 'login.html';
            return;
        }

        const hasil = await response.json();

        if (hasil.status === 'success') {
            let barisHTML = '';
            hasil.data.forEach((barang, index) => {
                barisHTML += `
                    <tr class="text-center">
                        <td class="border border-black p-2">${index + 1}</td>
                        <td class="border border-black p-2 text-left">${barang.nama_barang}</td>
                        <td class="border border-black p-2 text-right">${formatRupiah(barang.harga)}</td>
                    </tr>`;
            });

            document.getElementById('area-tabel-cetak').innerHTML = barisHTML;
            document.getElementById('area-total').innerHTML = formatRupiah(hasil.total_aset_rupiah);
            document.getElementById('jumlah-item').innerText = hasil.total_item;
            document.getElementById('loading-indicator').style.display = 'none';

            setTimeout(() => {
                window.print();
            }, 800);
        } else {
            alert("Akses Ditolak: " + (hasil.pesan || hasil.message));
        }
    } catch (error) {
        alert("Gagal memuat data laporan!");
        console.error(error);
    }
}

siapkanLaporan();

window.onafterprint = function () {
    window.close();
};