<?php
$query = "SELECT ID, display_name FROM wp_users WHERE (ID > 1) ORDER BY display_name";
//echo "query = ",$query,"<BR>";
include 'g-conn.php';
mysqli_query($con, "USE wordpress");
$result = mysqli_query($con, $query);
echo "[";
$zpt = false;
while($row = mysqli_fetch_array($result))
{
	if($zpt) echo ",";
	echo "{";
	echo "\"id\":", $row['ID'], ",";
	echo "\"name\":\"", $row['display_name'], "\"}";
	$zpt = true;
}
echo "]";
mysqli_close($con);
?>
