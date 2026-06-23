<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["status" => "error", "pesan" => "Method tidak diizinkan."]); exit();
}

include "koneksi.php";
/** @var mysqli $koneksi */

// 1. Tangkap parameter cari & page dari URL
$cari = isset($_GET['cari']) ? mysqli_real_escape_string($koneksi, $_GET['cari']) : '';
$page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
if ($page < 1) $page = 1;

// 2. Tentukan jumlah data per halaman
$limit  = 5;
$offset = ($page - 1) * $limit;

// 3. Hitung total seluruh data sesuai filter pencarian
$query_total  = "SELECT COUNT(*) AS total FROM barang WHERE nama_barang LIKE '%$cari%'";
$result_total = mysqli_query($koneksi, $query_total);

if (!$result_total) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Query total gagal: " . mysqli_error($koneksi)]);
    exit();
}

$total_data    = (int) mysqli_fetch_assoc($result_total)['total'];
$total_halaman = (int) ceil($total_data / $limit);
if ($total_halaman < 1) $total_halaman = 1;

// 4. Ambil data sesuai limit + offset + pencarian
$query = "SELECT id, nama_barang, harga, gambar FROM barang
          WHERE nama_barang LIKE '%$cari%'
          ORDER BY id DESC
          LIMIT $limit OFFSET $offset";
$hasil = mysqli_query($koneksi, $query);

if (!$hasil) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Query gagal: " . mysqli_error($koneksi)]);
    exit();
}

$data_barang = [];
while ($baris = mysqli_fetch_assoc($hasil)) {
    $baris['id']    = (int) $baris['id'];
    $baris['harga'] = (int) $baris['harga'];
    if (empty($baris['gambar']) || $baris['gambar'] === '0') {
        $baris['gambar'] = null;
    }
    $data_barang[] = $baris;
}

// 5. Kembalikan JSON beserta metadata halaman
echo json_encode([
    "status"           => "success",
    "message"          => "Berhasil mengambil data.",
    "data"             => $data_barang,
    "halaman_saat_ini" => $page,
    "total_halaman"    => $total_halaman,
    "total_data"       => $total_data
]);
?>