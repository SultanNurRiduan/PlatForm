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

$kodeQr = trim($_GET['kode_qr'] ?? '');
if ($kodeQr === '') {
    http_response_code(400);
    echo json_encode(["status" => "error", "pesan" => "Parameter kode_qr wajib diisi."]); exit();
}

$stmt = mysqli_prepare($koneksi,
    "SELECT id, nama_barang, harga, gambar, kode_qr, latitude, longitude FROM barang WHERE kode_qr = ? LIMIT 1");
mysqli_stmt_bind_param($stmt, "s", $kodeQr);
mysqli_stmt_execute($stmt);
$hasil  = mysqli_stmt_get_result($stmt);
$barang = mysqli_fetch_assoc($hasil);

if ($barang) {
    $barang['id']    = (int) $barang['id'];
    $barang['harga'] = (int) $barang['harga'];
    if (empty($barang['gambar']) || $barang['gambar'] === '0') $barang['gambar'] = null;

    echo json_encode(["status" => "success", "pesan" => "Barang ditemukan.", "data" => $barang]);
} else {
    echo json_encode(["status" => "not_found", "pesan" => "Belum ada di database.", "data" => null]);
}
?>