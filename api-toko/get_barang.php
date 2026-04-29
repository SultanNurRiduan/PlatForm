<?php
include "koneksi.php";

/** @var mysqli $koneksi */ // ← tambah ini, biar VS Code tahu tipe $koneksi

$query = "SELECT * FROM barang ORDER BY id DESC";
$hasil = mysqli_query($koneksi, $query);

$data_barang = array();
while ($baris = mysqli_fetch_assoc($hasil)) {
    $data_barang[] = $baris;
}

$response = [
    "status"  => "success",
    "message" => "Berhasil mengambil data",
    "data"    => $data_barang
];

echo json_encode($response);
?>