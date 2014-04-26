<?php
$file = $_GET["file"];
include "g-user.php";
//echo "user_id = $user_id";
$delete = "DELETE FROM Files WHERE user_id = $user_id AND name = '$file'";
$data = $HTTP_RAW_POST_DATA;
$query = "INSERT INTO Files (user_id, name, data) VALUES ($user_id, '$file', '$data')";
echo "query = ",$delete,"<BR>";

include "g-conn.php";
$result = mysqli_query($con, $delete);
$result = mysqli_query($con, $query);

mysqli_close($con);
?>
