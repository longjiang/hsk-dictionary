<?php
$apikeys = json_decode(file_get_contents("apikeys.json"));
$url = $_SERVER['QUERY_STRING'];

if ($_SERVER['REQUEST_METHOD']  === 'GET') {
	echo file_get_contents($url, false, stream_context_create([
		"http" => [
			"method" => "GET",
			"header" => "Authorization: Bearer " . $apikeys->sketchEngine,
		],
	]));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $data = $_POST; // pass along the post data
  $result = file_get_contents($url, false, stream_context_create([
    'http' => [
        'header'  => "Content-type: application/x-www-form-urlencoded\r\n"
          . "Authorization: Bearer " . $apikeys->sketchEngine,
        'method'  => 'POST',
        'content' => http_build_query($data, '', '&')
    ]]));
  echo $result;
  if ($result === FALSE) { /* Handle error */ }
}