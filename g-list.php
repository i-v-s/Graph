<?php
$user = $_GET["user"];
if($user)
	$query = "SELECT name FROM Files WHERE (user = '$user')";
else
	$query = "SELECT name FROM Files";
//echo "query = ",$query,"<BR>";

include 'g-conn.php';

$result = mysqli_query($con, $query);
echo "[";
$zpt = false;
while($row = mysqli_fetch_array($result))
{
	if($zpt) echo ",";
	echo "{";
	//if(!$user)
	//	echo "\"user\":\"", $row['user'], "\",";
	echo "\"name\":\"", $row['name'], "\"}";
	$zpt = true;
}
echo "]";
mysqli_close($con);
?>
