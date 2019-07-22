<?php
$apikeys = json_decode(file_get_contents("apikeys.json"));

echo file_get_contents($_SERVER['QUERY_STRING'], false, stream_context_create([
	"http" => [
		"method" => "GET",
		"header" => "Authorization: Bearer " . $apikeys->sketchEngine,
	],
]));