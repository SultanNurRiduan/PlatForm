<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Tangani preflight OPTIONS (wajib untuk POST dari browser)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include "koneksi.php";

/** @var mysqli $koneksi */

$json_data = file_get_contents("php://input");
$data = json_decode($json_data, true);

if (
    isset($data['nama_barang']) && trim($data['nama_barang']) !== '' &&
    isset($data['harga']) && is_numeric($data['harga']) && $data['harga'] > 0
) {
    $nama  = trim($data['nama_barang']);
    $harga = (int) $data['harga'];

    // Prepared statement — aman dari SQL injection
    $stmt = mysqli_prepare($koneksi, "INSERT INTO barang (nama_barang, harga) VALUES (?, ?)");

    if (!$stmt) {
        echo json_encode([
            "status" => "error",
            "pesan"  => "Prepare statement gagal: " . mysqli_error($koneksi)
        ]);
        exit();
    }

    mysqli_stmt_bind_param($stmt, "si", $nama, $harga);

    if (mysqli_stmt_execute($stmt)) {
        echo json_encode([
            "status" => "sukses",
            "pesan"  => "Data berhasil ditambahkan",
            "id"     => mysqli_insert_id($koneksi)
        ]);
    } else {
        echo json_encode([
            "status" => "error",
            "pesan"  => "Gagal menambahkan data: " . mysqli_stmt_error($stmt)
        ]);
    }

    mysqli_stmt_close($stmt);

} else {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "pesan"  => "Data tidak lengkap atau tidak valid"
    ]);
}
?>