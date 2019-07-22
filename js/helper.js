const Helper = {
  scrape(url, callback) {
    $.ajax("proxy.php?" + url).done(function (response) {
      // We use 'ownerDocument' so we don't load the images and scripts!
      // https://stackoverflow.com/questions/15113910/jquery-parse-html-without-loading-images
      var ownerDocument = document.implementation.createHTMLDocument("virtual");
      var $html = $(response, ownerDocument);
      callback($html, response);
    });
  }
}