<?php

$host = "localhost";
$user = "root";        
$pass = "root";        
$db   = "toko_db";    

$koneksi = mysqli_connect($host, $user, $pass, $db);

if (!$koneksi) {
    http_response_code(500);
    die(json_encode([
        "status" => "error",
        "pesan"  => "Koneksi database gagal: " . mysqli_connect_error()
    ]));
}

mysqli_set_charset($koneksi, "utf8mb4");
?>