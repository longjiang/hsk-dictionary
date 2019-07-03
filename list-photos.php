<?php

// https://stackoverflow.com/questions/3738270/listing-all-images-in-a-directory-using-php

function list_images() {

	$dir = dirname(__FILE__) . '/img/words/';
	$results = [];
	foreach (scandir($dir) as $filename) {
		$explode = explode('-', str_replace('.jpg', '', $filename));
		if (count($explode) > 1) {
			$id = $explode[0];
			$word = $explode[1];
			if ($id) {
				array_push($results, [
					'id' => $id,
					'word' => $word,
					'filename' => $filename,
				]);
			}
		}
	}

	header('Content-Type: application/json');
	echo json_encode($results);
}

list_images();