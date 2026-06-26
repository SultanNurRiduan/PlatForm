<?php
// Izinkan diakses dari frontend (CORS) - sesuaikan dengan koneksi.php milikmu jika sudah ada header ini
header('Content-Type: application/json');

/** @var mysqli $koneksi */
include "koneksi.php";

$query_stat = "SELECT 
                    COUNT(*) AS total_barang, 
                    MAX(harga) AS harga_max, 
                    MIN(harga) AS harga_min 
               FROM barang";
$hasil_stat = mysqli_query($koneksi, $query_stat);
$row_stat   = mysqli_fetch_assoc($hasil_stat);

$query_chart = "SELECT nama_barang, harga FROM barang ORDER BY harga DESC LIMIT 5";
$hasil_chart = mysqli_query($koneksi, $query_chart);

$labels_barang = []; 
$values_harga  = []; 

while ($row = mysqli_fetch_assoc($hasil_chart)) {
    $labels_barang[] = $row['nama_barang'];
    $values_harga[]  = (int) $row['harga'];
}

echo json_encode([
    "status" => "success",
    "pesan"  => "Data statistik berhasil dimuat",
    "stats"  => [
        "total_barang" => (int) $row_stat['total_barang'],
        "harga_max"    => (int) $row_stat['harga_max'],
        "harga_min"    => (int) $row_stat['harga_min']
    ],
    "chart_data" => [
        "labels" => $labels_barang,
        "values" => $values_harga
    ]
]);
?>