<?php
include "koneksi.php";      // harus menyediakan variabel $koneksi (mysqli)
require_once "auth_check.php";

header('Content-Type: application/json');

include "koneksi.php";
/** @var mysqli $koneksi */

cekToken($koneksi);

$query = "SELECT * FROM barang ORDER BY nama_barang ASC";
$result = mysqli_query($koneksi, $query);

$data_laporan = [];
$total_aset = 0;

while ($row = mysqli_fetch_assoc($result)) {
    $data_laporan[] = $row;
    $total_aset += (int)$row['harga'];
}

echo json_encode([
    "status" => "success",
    "data" => $data_laporan,
    "total_aset_rupiah" => $total_aset,
    "total_item" => count($data_laporan)
]);