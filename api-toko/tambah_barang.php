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

include "koneksi.php";
/** @var mysqli $koneksi */

$nama  = trim($_POST['nama_barang'] ?? '');
$harga = intval($_POST['harga'] ?? 0);

if (empty($nama) || $harga <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "pesan" => "Nama dan harga wajib diisi."]); exit();
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

$gambar = null;
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

    $gambar = uniqid('img_', true) . '.' . $ext;
    $dest   = __DIR__ . '/uploads/' . $gambar;

    if (!is_dir(__DIR__ . '/uploads/')) {
        mkdir(__DIR__ . '/uploads/', 0755, true);
    }

    if (!move_uploaded_file($_FILES['gambar']['tmp_name'], $dest)) {
        http_response_code(500);
        echo json_encode(["status" => "error", "pesan" => "Gagal menyimpan gambar ke server."]); exit();
    }
}

// FIX: pisah query ada/tidak ada gambar agar NULL murni tersimpan di DB
if ($gambar !== null) {
    $stmt = mysqli_prepare($koneksi,
        "INSERT INTO barang (nama_barang, harga, gambar) VALUES (?, ?, ?)");
    mysqli_stmt_bind_param($stmt, "sis", $nama, $harga, $gambar);
} else {
    $stmt = mysqli_prepare($koneksi,
        "INSERT INTO barang (nama_barang, harga, gambar) VALUES (?, ?, NULL)");
    mysqli_stmt_bind_param($stmt, "si", $nama, $harga);
}

if (!mysqli_stmt_execute($stmt)) {
    if ($gambar && file_exists(__DIR__ . '/uploads/' . $gambar)) {
        unlink(__DIR__ . '/uploads/' . $gambar);
    }
    http_response_code(500);
    echo json_encode(["status" => "error", "pesan" => "Gagal menyimpan: " . mysqli_error($koneksi)]); exit();
}

echo json_encode([
    "status" => "sukses",
    "pesan"  => "Barang berhasil ditambahkan.",
    "id"     => mysqli_insert_id($koneksi),
    "gambar" => $gambar
]);
?>