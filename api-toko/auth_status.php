<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include "koneksi.php";
/** @var mysqli $koneksi */

$headers       = apache_request_headers();
$token_dikirim = isset($headers['Authorization']) ? trim($headers['Authorization']) : '';

if ($token_dikirim === '' && isset($headers['authorization'])) {
    $token_dikirim = trim($headers['authorization']);
}

if ($token_dikirim === '') {
    echo json_encode(["status" => "guest"]); exit();
}

$tokenEsc = mysqli_real_escape_string($koneksi, $token_dikirim);
$result   = mysqli_query($koneksi, "SELECT username FROM users WHERE token='$tokenEsc'");

if ($result && mysqli_num_rows($result) > 0) {
    $user = mysqli_fetch_assoc($result);
    echo json_encode(["status" => "logged_in", "username" => $user['username']]);
} else {
    echo json_encode(["status" => "guest"]);
}
?>