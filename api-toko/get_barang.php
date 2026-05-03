<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include "koneksi.php";

/** @var mysqli $koneksi */

$query = "SELECT * FROM barang ORDER BY id DESC";
$hasil = mysqli_query($koneksi, $query);

if (!$hasil) {
    echo json_encode([
        "status"  => "error",
        "message" => "Query gagal: " . mysqli_error($koneksi)
    ]);
    exit();
}

$data_barang = [];
while ($baris = mysqli_fetch_assoc($hasil)) {
    $data_barang[] = $baris;
}

echo json_encode([
    "status"  => "success",
    "message" => "Berhasil mengambil data",
    "data"    => $data_barang
]);
?>