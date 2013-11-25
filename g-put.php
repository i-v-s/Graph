<?php
$file = $_GET["file"];
$user = "user";
$delete = "DELETE FROM Files WHERE user = '$user' AND name = '$file'";
$data = $HTTP_RAW_POST_DATA;
$query = "INSERT INTO Files (user, name, data) VALUES ('$user', '$file', '$data')";
//echo "query = ",$delete,"<BR>";

include 'g-conn.php';
$result = mysqli_query($con, $delete);
$result = mysqli_query($con, $query);

mysqli_close($con);
?>
