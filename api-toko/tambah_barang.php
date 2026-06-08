<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "pesan" => "Method tidak diizinkan."]); exit();
}

include "koneksi.php";
/** @var mysqli $koneksi */

// ── Autentikasi ───────────────────────────────────────────
include "auth_check.php";
cekToken($koneksi);
// ─────────────────────────────────────────────────────────

$data = json_decode(file_get_contents("php://input"), true);

$nama  = trim($data['nama_barang'] ?? '');
$harga = $data['harga']            ?? 0;

if (empty($nama) || !is_numeric($harga) || (int)$harga <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "pesan" => "Data tidak lengkap atau tidak valid."]);
    exit();
}

$harga = (int) $harga;

$stmt = mysqli_prepare($koneksi, "INSERT INTO barang (nama_barang, harga) VALUES (?, ?)");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(["status" => "error", "pesan" => "Prepare statement gagal: " . mysqli_error($koneksi)]);
    exit();
}

mysqli_stmt_bind_param($stmt, "si", $nama, $harga);

if (mysqli_stmt_execute($stmt)) {
    $newId = mysqli_insert_id($koneksi);
    echo json_encode([
        "status" => "sukses",
        "pesan"  => "Barang berhasil ditambahkan.",
        "id"     => $newId
    ]);
} else {
    http_response_code(500);
    echo json_encode(["status" => "error", "pesan" => "Gagal menambahkan data: " . mysqli_stmt_error($stmt)]);
}

mysqli_stmt_close($stmt);
?>