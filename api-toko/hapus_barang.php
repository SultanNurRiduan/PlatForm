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

// Pastikan _method = DELETE
$method = strtoupper($data['_method'] ?? '');
if ($method !== 'DELETE') {
    http_response_code(400);
    echo json_encode(["status" => "error", "pesan" => "_method harus DELETE."]);
    exit();
}

$id = $data['id'] ?? 0;

if (!is_numeric($id) || (int)$id <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "pesan" => "ID tidak valid."]);
    exit();
}

$id = (int) $id;

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

$stmt = mysqli_prepare($koneksi, "DELETE FROM barang WHERE id = ?");
mysqli_stmt_bind_param($stmt, "i", $id);

if (mysqli_stmt_execute($stmt)) {
    echo json_encode([
        "status" => "sukses",
        "pesan"  => "Barang berhasil dihapus.",
        "id"     => $id
    ]);
} else {
    http_response_code(500);
    echo json_encode(["status" => "error", "pesan" => "Gagal menghapus data: " . mysqli_stmt_error($stmt)]);
}

mysqli_stmt_close($stmt);
?>