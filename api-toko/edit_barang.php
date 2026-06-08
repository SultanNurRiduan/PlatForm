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

// Pastikan _method = PUT (dari frontend yang tidak bisa pakai PUT murni)
$method = strtoupper($data['_method'] ?? '');
if ($method !== 'PUT') {
    http_response_code(400);
    echo json_encode(["status" => "error", "pesan" => "_method harus PUT."]);
    exit();
}

$id    = $data['id']           ?? 0;
$nama  = trim($data['nama_barang'] ?? '');
$harga = $data['harga']        ?? 0;

if (!is_numeric($id) || (int)$id <= 0 || empty($nama) || !is_numeric($harga) || (int)$harga <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "pesan" => "Data tidak lengkap atau tidak valid."]);
    exit();
}

$id    = (int) $id;
$harga = (int) $harga;

// Cek apakah barang ada
$stmtCek = mysqli_prepare($koneksi, "SELECT id FROM barang WHERE id = ?");
mysqli_stmt_bind_param($stmtCek, "i", $id);
mysqli_stmt_execute($stmtCek);
mysqli_stmt_store_result($stmtCek);

if (mysqli_stmt_num_rows($stmtCek) === 0) {
    mysqli_stmt_close($stmtCek);
    http_response_code(404);
    echo json_encode(["status" => "error", "pesan" => "Barang dengan ID $id tidak ditemukan."]);
    exit();
}
mysqli_stmt_close($stmtCek);

$stmt = mysqli_prepare($koneksi, "UPDATE barang SET nama_barang = ?, harga = ? WHERE id = ?");
mysqli_stmt_bind_param($stmt, "sii", $nama, $harga, $id);

if (mysqli_stmt_execute($stmt)) {
    echo json_encode([
        "status" => "sukses",
        "pesan"  => "Barang berhasil diperbarui.",
        "id"     => $id
    ]);
} else {
    http_response_code(500);
    echo json_encode(["status" => "error", "pesan" => "Gagal memperbarui data: " . mysqli_stmt_error($stmt)]);
}

mysqli_stmt_close($stmt);
?>