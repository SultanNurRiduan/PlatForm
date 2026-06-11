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

$hasil = mysqli_query($koneksi, "SELECT id, nama_barang, harga, gambar FROM barang ORDER BY id DESC");

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

echo json_encode([
    "status"  => "success",
    "message" => "Berhasil mengambil data.",
    "data"    => $data_barang
]);
?>