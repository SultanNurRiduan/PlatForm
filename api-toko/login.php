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

$username = trim($data['username'] ?? '');
$password = $data['password']      ?? '';

if (empty($username) || empty($password)) {
    echo json_encode(["status" => "error", "pesan" => "Username dan password wajib diisi."]);
    exit();
}

// Gunakan prepared statement agar aman dari SQL injection
$stmt = mysqli_prepare($koneksi, "SELECT id, username, password FROM users WHERE username = ?");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(["status" => "error", "pesan" => "Server error."]);
    exit();
}

mysqli_stmt_bind_param($stmt, "s", $username);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);

if ($result && mysqli_num_rows($result) > 0) {
    $user = mysqli_fetch_assoc($result);

    // Cek password — mendukung plain text (sesuai modul) maupun password_hash
    $passwordValid = false;
    if (password_verify($password, $user['password'])) {
        $passwordValid = true;                 // hash bcrypt
    } elseif ($user['password'] === $password) {
        $passwordValid = true;                 // plain text (sesuai modul)
    }

    if ($passwordValid) {
        $token   = bin2hex(random_bytes(16));  // lebih aman dari md5(uniqid)
        $user_id = $user['id'];

        $stmtUpdate = mysqli_prepare($koneksi, "UPDATE users SET token = ? WHERE id = ?");
        mysqli_stmt_bind_param($stmtUpdate, "si", $token, $user_id);
        mysqli_stmt_execute($stmtUpdate);
        mysqli_stmt_close($stmtUpdate);

        echo json_encode([
            "status"   => "success",
            "pesan"    => "Login berhasil.",
            "token"    => $token,
            "username" => $user['username']
        ]);
    } else {
        echo json_encode(["status" => "error", "pesan" => "Username atau Password salah!"]);
    }
} else {
    echo json_encode(["status" => "error", "pesan" => "Username atau Password salah!"]);
}

mysqli_stmt_close($stmt);
?>