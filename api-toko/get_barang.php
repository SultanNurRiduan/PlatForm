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

// =====================================================
// P14: Smart QR Gateway — lookup tunggal by kode_qr
// GET get_barang.php?kode_qr=XXX  -> dipanggil dari onQrScanSukses()
// HARUS dicek SEBELUM logika list/pagination di bawah.
// =====================================================
if (isset($_GET['kode_qr']) && trim($_GET['kode_qr']) !== '') {
    $kodeQr = trim($_GET['kode_qr']);

    $stmt = mysqli_prepare(
        $koneksi,
        "SELECT id, nama_barang, harga, gambar, kode_qr, latitude, longitude
         FROM barang WHERE kode_qr = ? LIMIT 1"
    );
    mysqli_stmt_bind_param($stmt, "s", $kodeQr);
    mysqli_stmt_execute($stmt);
    $res    = mysqli_stmt_get_result($stmt);
    $barang = mysqli_fetch_assoc($res);

    if ($barang) {
        $barang['id']    = (int) $barang['id'];
        $barang['harga'] = (int) $barang['harga'];
        if (empty($barang['gambar']) || $barang['gambar'] === '0') $barang['gambar'] = null;
        if ($barang['latitude']  === '') $barang['latitude']  = null;
        if ($barang['longitude'] === '') $barang['longitude'] = null;

        echo json_encode(["status" => "success", "message" => "Barang ditemukan.", "data" => $barang]);
    } else {
        echo json_encode(["status" => "not_found", "message" => "Belum ada di database.", "data" => null]);
    }
    exit();
}

// =====================================================
// Logika list + pagination (tidak berubah)
// =====================================================
$cari = isset($_GET['cari']) ? mysqli_real_escape_string($koneksi, $_GET['cari']) : '';
$page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
if ($page < 1) $page = 1;

$limit  = 5;
$offset = ($page - 1) * $limit;

$kondisiCari = "(nama_barang LIKE '%$cari%' OR kode_qr LIKE '%$cari%')";

$query_total  = "SELECT COUNT(*) AS total FROM barang WHERE $kondisiCari";
$result_total = mysqli_query($koneksi, $query_total);
if (!$result_total) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Query total gagal: " . mysqli_error($koneksi)]);
    exit();
}

$total_data    = (int) mysqli_fetch_assoc($result_total)['total'];
$total_halaman = (int) ceil($total_data / $limit);
if ($total_halaman < 1) $total_halaman = 1;

$query = "SELECT id, nama_barang, harga, gambar, kode_qr, latitude, longitude FROM barang
          WHERE $kondisiCari
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
    if (empty($baris['gambar']) || $baris['gambar'] === '0') $baris['gambar'] = null;
    if ($baris['kode_qr']   === '') $baris['kode_qr']   = null;
    if ($baris['latitude']  === '') $baris['latitude']  = null;
    if ($baris['longitude'] === '') $baris['longitude'] = null;
    $data_barang[] = $baris;
}

echo json_encode([
    "status"           => "success",
    "message"          => "Berhasil mengambil data.",
    "data"             => $data_barang,
    "halaman_saat_ini" => $page,
    "total_halaman"    => $total_halaman,
    "total_data"       => $total_data
]);