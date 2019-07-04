<?php

//https://stackoverflow.com/questions/6306935/php-copy-image-to-my-server-direct-from-url/6306995
function get_photo_and_save($url, $path) {
	//Get the file
	$url = str_replace(' ', '+', $url);
	$content = file_get_contents($url);
	//Store in the filesystem.
	$fp = fopen($path, "w");
	fwrite($fp, $content);
	fclose($fp);
}

$url = urldecode($_GET['url']);
$id = $_GET['id'];
$word = $_GET['word'];
$filename = $id . '-' . $word . '.jpg';
$path = 'img/words/';
$dir = dirname(__FILE__) . '/' . $path;

get_photo_and_save($url, $dir . $filename);

header('Content-Type: application/json');
echo json_encode([
	'status' => 'success',
	'url' => $path . $filename,
]);