<?php
$file = $_GET["file"];
$query = "SELECT data FROM Files WHERE (name = '$file')";
//echo "query = ",$query,"<BR>";

include 'g-conn.php';

$result = mysqli_query($con, $query);
$row = mysqli_fetch_array($result);
echo $row['data'];

mysqli_close($con);
?>
