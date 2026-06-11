<?php

function cekToken(mysqli $koneksi): void {
    $headers = [];

    if (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
    }

    $headersLower = array_change_key_case($headers, CASE_LOWER);

    $token_dikirim = '';

    if (!empty($headersLower['authorization'])) {
        $token_dikirim = trim($headersLower['authorization']);
    }

    if ($token_dikirim === '' && !empty($_SERVER['HTTP_AUTHORIZATION'])) {
        $token_dikirim = trim($_SERVER['HTTP_AUTHORIZATION']);
    }
    if ($token_dikirim === '' && !empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $token_dikirim = trim($_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
    }

    if ($token_dikirim === '') {
        http_response_code(401);
        die(json_encode([
            "status" => "error",
            "pesan"  => "Akses Ditolak! Token tidak ditemukan."
        ]));
    }

    $stmt = mysqli_prepare($koneksi, "SELECT id FROM users WHERE token = ?");
    if (!$stmt) {
        http_response_code(500);
        die(json_encode(["status" => "error", "pesan" => "Server error."]));
    }

    mysqli_stmt_bind_param($stmt, "s", $token_dikirim);
    mysqli_stmt_execute($stmt);
    mysqli_stmt_store_result($stmt);

    if (mysqli_stmt_num_rows($stmt) === 0) {
        mysqli_stmt_close($stmt);
        http_response_code(401);
        die(json_encode([
            "status" => "error",
            "pesan"  => "Akses Ditolak! Token tidak valid atau sesi habis."
        ]));
    }

    mysqli_stmt_close($stmt);
}
?>