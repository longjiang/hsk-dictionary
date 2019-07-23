const Helper = {
  isChinese(text) {
    return text.match(/[\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u3005\u3007\u3021-\u3029\u3038-\u303B‌​\u3400-\u4DB5\u4E00-\u9FCC\uF900-\uFA6D\uFA70-\uFAD9]+/g)
  },
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
  showPinyinClick(e) {
    var selector = $(e.target).attr("data-target-selector");
    $(selector).addClass("add-pinyin"); // Soo it will have the pinyin looks
    $(e.target).text("Loading...");
    // eslint-disable-next-line no-undef
    new Annotator(CEDICT).annotateBySelector(`${selector}`, function () {
      $(e.target).remove()
      AnnotatorTooltip.addTooltips(selector)
      $(selector + ' .word-block[data-candidates]').each(function() {
        const candidates = JSON.parse(unescape($(this).attr('data-candidates')))
        $(this).click(function() {
          location.hash = `#view/cedict/${candidates[0].traditional}`
        })
      })
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
  },
  map(collection, callback) {
    var i;
    var mapped = [];
    for (i = 0; i < collection.length; i++) {
      mapped.push(callback(collection[i]));
    }
    return mapped;
  }
}

class Loader {
  _loaded = []
  _goal = []
  _complete = function() {}

  constructor(goal, callback) {
    this._goal = goal
    this._complete = callback
  }

  loaded(item) {
    let loader = this
    this._loaded.push(item)
    if (this._goal.filter(function(item) {
      return ! loader._loaded.includes(item)
    }).length === 0) this._complete()
  }
}