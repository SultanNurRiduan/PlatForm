<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "pesan" => "Method tidak diizinkan."]);
    exit();
}

include "koneksi.php";
/** @var mysqli $koneksi */

$data = json_decode(file_get_contents("php://input"), true);

$username = trim($data['username']  ?? '');
$password = $data['password']       ?? '';
$konfirm  = $data['konfirmasi']     ?? '';

// ── Validasi ──────────────────────────────────────────────
if (empty($username) || empty($password) || empty($konfirm)) {
    echo json_encode(["status" => "error", "pesan" => "Semua field wajib diisi."]); exit();
}
if (strlen($username) < 3 || strlen($username) > 50) {
    echo json_encode(["status" => "error", "pesan" => "Username harus 3–50 karakter."]); exit();
}
if (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
    echo json_encode(["status" => "error", "pesan" => "Username hanya boleh huruf, angka, dan underscore."]); exit();
}
if (strlen($password) < 6) {
    echo json_encode(["status" => "error", "pesan" => "Password minimal 6 karakter."]); exit();
}
if ($password !== $konfirm) {
    echo json_encode(["status" => "error", "pesan" => "Konfirmasi password tidak cocok."]); exit();
}

// ── Cek apakah username sudah dipakai ────────────────────
$stmtCek = mysqli_prepare($koneksi, "SELECT id FROM users WHERE username = ?");
mysqli_stmt_bind_param($stmtCek, "s", $username);
mysqli_stmt_execute($stmtCek);
mysqli_stmt_store_result($stmtCek);

if (mysqli_stmt_num_rows($stmtCek) > 0) {
    mysqli_stmt_close($stmtCek);
    echo json_encode(["status" => "error", "pesan" => "Username sudah digunakan, coba yang lain."]); exit();
}
mysqli_stmt_close($stmtCek);

// ── Simpan user baru (password plain sesuai modul) ────────
// Untuk keamanan produksi, gunakan: $passwordSimpan = password_hash($password, PASSWORD_DEFAULT);
$passwordSimpan = $password;  // plain text sesuai modul praktikum

$stmtInsert = mysqli_prepare($koneksi, "INSERT INTO users (username, password) VALUES (?, ?)");
if (!$stmtInsert) {
    http_response_code(500);
    echo json_encode(["status" => "error", "pesan" => "Server error."]); exit();
}

mysqli_stmt_bind_param($stmtInsert, "ss", $username, $passwordSimpan);

if (mysqli_stmt_execute($stmtInsert)) {
    $newId = mysqli_insert_id($koneksi);
    $token = bin2hex(random_bytes(16));

    $stmtToken = mysqli_prepare($koneksi, "UPDATE users SET token = ? WHERE id = ?");
    mysqli_stmt_bind_param($stmtToken, "si", $token, $newId);
    mysqli_stmt_execute($stmtToken);
    mysqli_stmt_close($stmtToken);

    mysqli_stmt_close($stmtInsert);

    echo json_encode([
        "status"   => "success",
        "pesan"    => "Akun berhasil dibuat.",
        "token"    => $token,
        "username" => $username
    ]);
} else {
    mysqli_stmt_close($stmtInsert);
    http_response_code(500);
    echo json_encode(["status" => "error", "pesan" => "Gagal menyimpan akun."]);
}
?>