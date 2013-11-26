<?php
   // ini_set('display_errors',1);
   // error_reporting(E_ALL);
    require( dirname( __FILE__ ) . '/wp-load.php' );
    $current_user = wp_get_current_user();
    $user_id = $current_user->ID;
   // echo 'Username: ' . $current_user->user_login . '<br />';
   // echo 'email: ' . $current_user->user_email . '<br />';
   // echo 'first name: ' . $current_user->user_firstname . '<br />';
   // echo 'last name: ' . $current_user->user_lastname . '<br />';
   // echo 'Отображаемое имя: ' . $current_user->display_name . '<br />';
   // echo 'ID: ' . $current_user->ID . '<br />';
?>
