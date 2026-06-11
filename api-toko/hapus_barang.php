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

$token = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (empty($token)) {
    http_response_code(401);
    echo json_encode(["status" => "error", "pesan" => "Unauthorized."]); exit();
}

$body = json_decode(file_get_contents('php://input'), true);

$method = strtoupper(trim($body['_method'] ?? ''));
if ($method !== 'DELETE') {
    http_response_code(400);
    echo json_encode(["status" => "error", "pesan" => "_method harus DELETE."]); exit();
}

$id = intval($body['id'] ?? 0);
if ($id <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "pesan" => "ID tidak valid."]); exit();
}

include "koneksi.php";
/** @var mysqli $koneksi */

$res = mysqli_query($koneksi, "SELECT gambar FROM barang WHERE id = " . $id);
if (!$res || mysqli_num_rows($res) === 0) {
    http_response_code(404);
    echo json_encode(["status" => "error", "pesan" => "Barang tidak ditemukan."]); exit();
}
$row = mysqli_fetch_assoc($res);
$gambar_lama = $row['gambar'];

$stmt = mysqli_prepare($koneksi, "DELETE FROM barang WHERE id = ?");
mysqli_stmt_bind_param($stmt, "i", $id);

if (!mysqli_stmt_execute($stmt)) {
    http_response_code(500);
    echo json_encode(["status" => "error", "pesan" => "Gagal menghapus: " . mysqli_error($koneksi)]); exit();
}

if (mysqli_stmt_affected_rows($stmt) === 0) {
    http_response_code(404);
    echo json_encode(["status" => "error", "pesan" => "Barang tidak ditemukan."]); exit();
}

if (!empty($gambar_lama) && $gambar_lama !== '0') {
    $path = __DIR__ . '/uploads/' . $gambar_lama;
    if (file_exists($path)) {
        unlink($path);
    }
}

echo json_encode([
    "status" => "sukses",
    "pesan"  => "Barang berhasil dihapus."
]);
?>