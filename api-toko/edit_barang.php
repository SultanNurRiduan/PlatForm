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

$method = strtoupper(trim($_POST['_method'] ?? ''));
if ($method !== 'PUT') {
    http_response_code(400);
    echo json_encode(["status" => "error", "pesan" => "_method harus PUT."]); exit();
}

$token = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (empty($token)) {
    http_response_code(401);
    echo json_encode(["status" => "error", "pesan" => "Unauthorized."]); exit();
}

include "koneksi.php";
/** @var mysqli $koneksi */

$id    = intval($_POST['id'] ?? 0);
$nama  = trim($_POST['nama_barang'] ?? '');
$harga = intval($_POST['harga'] ?? 0);

if ($id <= 0 || empty($nama) || $harga <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "pesan" => "Data tidak valid."]); exit();
}

// Cek error upload
if (isset($_FILES['gambar']) &&
    $_FILES['gambar']['error'] !== UPLOAD_ERR_OK &&
    $_FILES['gambar']['error'] !== UPLOAD_ERR_NO_FILE) {
    $upload_errors = [
        UPLOAD_ERR_INI_SIZE   => 'File terlalu besar (batas php.ini).',
        UPLOAD_ERR_FORM_SIZE  => 'File terlalu besar (batas form).',
        UPLOAD_ERR_PARTIAL    => 'File hanya terupload sebagian, coba lagi.',
        UPLOAD_ERR_NO_TMP_DIR => 'Folder temporary tidak ditemukan.',
        UPLOAD_ERR_CANT_WRITE => 'Gagal menulis file ke disk.',
        UPLOAD_ERR_EXTENSION  => 'Upload diblokir oleh ekstensi PHP.',
    ];
    $err_code = $_FILES['gambar']['error'];
    http_response_code(400);
    echo json_encode(["status" => "error", "pesan" => $upload_errors[$err_code] ?? "Upload error code: $err_code"]);
    exit();
}

$gambar_baru = null;
if (!empty($_FILES['gambar']['name']) && $_FILES['gambar']['error'] === UPLOAD_ERR_OK) {
    $ekstensi_ok = ['jpg', 'jpeg', 'png', 'webp'];
    $ext = strtolower(pathinfo($_FILES['gambar']['name'], PATHINFO_EXTENSION));

    if (!in_array($ext, $ekstensi_ok)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "pesan" => "Format gambar tidak didukung. Gunakan JPG, PNG, atau WEBP."]); exit();
    }
    if ($_FILES['gambar']['size'] > 2 * 1024 * 1024) {
        http_response_code(400);
        echo json_encode(["status" => "error", "pesan" => "Ukuran gambar maksimal 2MB."]); exit();
    }

    if (!is_dir(__DIR__ . '/uploads/')) {
        mkdir(__DIR__ . '/uploads/', 0755, true);
    }

    $gambar_baru = uniqid('img_', true) . '.' . $ext;
    $dest = __DIR__ . '/uploads/' . $gambar_baru;

    if (!move_uploaded_file($_FILES['gambar']['tmp_name'], $dest)) {
        http_response_code(500);
        echo json_encode(["status" => "error", "pesan" => "Gagal menyimpan gambar ke server."]); exit();
    }
}

// FIX: hanya UPDATE kolom gambar jika ada file baru
// Jika tidak ada file baru, biarkan gambar lama di DB tidak berubah
if ($gambar_baru !== null) {
    // Ada gambar baru: hapus gambar lama dulu
    $res_lama = mysqli_query($koneksi, "SELECT gambar FROM barang WHERE id = " . $id);
    if ($res_lama && $row_lama = mysqli_fetch_assoc($res_lama)) {
        $gambar_lama = $row_lama['gambar'];
        if (!empty($gambar_lama) && $gambar_lama !== '0' && $gambar_lama !== 'NULL') {
            $path_lama = __DIR__ . '/uploads/' . $gambar_lama;
            if (file_exists($path_lama)) {
                unlink($path_lama);
            }
        }
    }

    $stmt = mysqli_prepare($koneksi,
        "UPDATE barang SET nama_barang = ?, harga = ?, gambar = ? WHERE id = ?");
    mysqli_stmt_bind_param($stmt, "sisi", $nama, $harga, $gambar_baru, $id);
} else {
    // Tidak ada gambar baru: hanya update nama dan harga, gambar TIDAK disentuh
    $stmt = mysqli_prepare($koneksi,
        "UPDATE barang SET nama_barang = ?, harga = ? WHERE id = ?");
    mysqli_stmt_bind_param($stmt, "sii", $nama, $harga, $id);
}

if (!mysqli_stmt_execute($stmt)) {
    if ($gambar_baru && file_exists(__DIR__ . '/uploads/' . $gambar_baru)) {
        unlink(__DIR__ . '/uploads/' . $gambar_baru);
    }
    http_response_code(500);
    echo json_encode(["status" => "error", "pesan" => "Gagal update: " . mysqli_error($koneksi)]); exit();
}

$response = ["status" => "sukses", "pesan" => "Barang berhasil diperbarui."];
if ($gambar_baru !== null) $response['gambar'] = $gambar_baru;

echo json_encode($response);
?>