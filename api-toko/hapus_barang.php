<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Tangani preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include "koneksi.php";
/** @var mysqli $koneksi */

$json_data = file_get_contents("php://input");
$data      = json_decode($json_data, true);

// InfinityFree memblokir DELETE — pakai POST + _method=DELETE
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'POST' && isset($data['_method']) && strtoupper($data['_method']) === 'DELETE') {
    $method = 'DELETE';
}

if ($method !== 'DELETE' && $method !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "pesan" => "Method tidak diizinkan."]);
    exit();
}

if (isset($data['id']) && is_numeric($data['id']) && (int) $data['id'] > 0) {
    $id = (int) $data['id'];

    // Cek apakah data dengan ID tersebut benar-benar ada
    $stmt_cek = mysqli_prepare($koneksi, "SELECT id FROM barang WHERE id = ?");
    if (!$stmt_cek) {
        http_response_code(500);
        echo json_encode(["status" => "error", "pesan" => "Prepare statement gagal: " . mysqli_error($koneksi)]);
        exit();
    }
    mysqli_stmt_bind_param($stmt_cek, "i", $id);
    mysqli_stmt_execute($stmt_cek);
    mysqli_stmt_store_result($stmt_cek);

    if (mysqli_stmt_num_rows($stmt_cek) === 0) {
        mysqli_stmt_close($stmt_cek);
        http_response_code(404);
        echo json_encode(["status" => "error", "pesan" => "Barang dengan ID $id tidak ditemukan."]);
        exit();
    }
    mysqli_stmt_close($stmt_cek);

    // Prepared statement — aman dari SQL injection
    $stmt = mysqli_prepare($koneksi, "DELETE FROM barang WHERE id = ?");
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(["status" => "error", "pesan" => "Prepare statement gagal: " . mysqli_error($koneksi)]);
        exit();
    }
    mysqli_stmt_bind_param($stmt, "i", $id);

    if (mysqli_stmt_execute($stmt)) {
        echo json_encode([
            "status" => "sukses",
            "pesan"  => "Barang berhasil dihapus.",
            "id"     => $id
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "pesan"  => "Gagal menghapus data: " . mysqli_stmt_error($stmt)
        ]);
    }
    mysqli_stmt_close($stmt);

} else {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "pesan"  => "ID tidak valid atau tidak ditemukan dalam request."
    ]);
}
?>