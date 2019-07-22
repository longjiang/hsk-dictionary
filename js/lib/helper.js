const Helper = {
  scrape(url, callback) {
    $.ajax("proxy.php?" + url).done(function (response) {
      // We use 'ownerDocument' so we don't load the images and scripts!
      // https://stackoverflow.com/questions/15113910/jquery-parse-html-without-loading-images
      var ownerDocument = document.implementation.createHTMLDocument("virtual");
      var $html = $(response, ownerDocument);
      callback($html, response);
    });
  },
  highlight(text, word, level) {
    if (text) {
      return text.replace(word, '<span data-hsk="' + level + '">' + word + "</span>");
    }
  },
  showPinyinClick: function (e) {
    var selector = $(e.target).attr("data-target-selector");
    $(selector).addClass("add-pinyin"); // Soo it will have the pinyin looks
    $(e.target).text("Loading...");
    // eslint-disable-next-line no-undef
    new Annotator().annotateBySelector(`${selector}, ${selector} *`, function () {
      $(e.target).remove()
    });
  },
  showMoreClick(e) {
    var $button = $(e.currentTarget);
    $button.siblings("[data-collapse-target]").toggleClass("collapsed");
    $button.toggleClass("collapsed");
  },
  unique(names) {
    var uniqueNames = [];
    $.each(names, function(i, el){
        if($.inArray(el, uniqueNames) === -1) uniqueNames.push(el);
    });
    return uniqueNames;
  }
}