<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Deklarasi parameter koneksi
$host = "localhost";
$user = "root";
$pass = "root";
$db   = "toko_db";

$koneksi = mysqli_connect($host, $user, $pass, $db);

if (!$koneksi) {
    die("Koneksi gagal: " . mysqli_connect_error());
}

?>