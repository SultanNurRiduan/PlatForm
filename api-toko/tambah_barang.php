<?php
include "koneksi.php";

/** @var mysqli $koneksi */

$json_data = file_get_contents("php://input");

$data = json_decode($json_data, true);

if (isset($data['nama_barang']) && isset($data['harga'])) {

    $nama = $data['nama_barang'];
    $harga = $data['harga'];

    $query = "INSERT INTO barang (nama_barang, harga) VALUES ('$nama', '$harga')";

    if (mysqli_query($koneksi, $query)) {
        echo json_encode([
            "status" => "sukses",
            "pesan" => "Data berhasil ditambahkan"
        ]);
    } else {
        echo json_encode([
            "status" => "error",
            "pesan" => "Gagal menambahkan data"
        ]);
    }

} else {
    echo json_encode([
        "status" => "error",
        "pesan" => "Data tidak lengkap"
    ]);
}
?>