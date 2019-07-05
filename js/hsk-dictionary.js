function getLrcs(word, callback) {
  $.getJSON(
    "https://www.chinesezerotohero.com/lyrics-search/lrc/search/" +
      word +
      "/10",
    function(results) {
      callback(results);
    }
  );
}

function savePhoto(word, url, callback) {
  $.getJSON(
    "save-photo.php?id=" +
      word.id +
      "&word=" +
      word.word +
      "&url=" +
      encodeURIComponent(url),
    callback
  );
}

function getSrcsFromUnsplash(term, callcback) {
  scrape("https://unsplash.com/search/photos/" + term, function(
    $html,
    response
  ) {
    var srcs = [];

    var $metas = $html.filter("meta"); // cannot use find
    $metas.each(function() {
      var property = $(this).attr("property");
      if (property) {
        if (property.includes("og:image:secure_url")) {
          srcs.push($(this).attr("content"));
        }
      }
    });
    callcback(srcs);
  });
}

function scrape(url, callback) {
  $.ajax("proxy.php?" + url).done(function(response) {
    // We use 'ownerDocument' so we don't load the images and scripts!
    // https://stackoverflow.com/questions/15113910/jquery-parse-html-without-loading-images
    var ownerDocument = document.implementation.createHTMLDocument("virtual");
    $html = $(response, ownerDocument);
    callback($html, response);
  });
}

function main(hskObj) {
  var app = new Vue({
    el: "#hsk-dictionary",
    data: {
      character: {},
      hsk: hskObj,
      lrcs: [], // matched song lyrics, pulled from another server
      wordList: hskObj.listWhere(function(word) {
        word.oofc === "";
      }),
      entry: undefined,
      books: hskObj.compileBooks(),
      characters: [],
      image: undefined,
      hasImage: true,
      suggestions: [],
      initialized: false,
      unsplashSrcs: [],
      unsplashSearchTerm: "",
      admin: false,
      annotated: false
    },
    methods: {
      adminClick: function() {
        this.admin = true;
      },
      showById: function(id) {
        var entry = this.hsk.get(id);
        if (entry) {
          this.displayEntry(entry);
        }
      },

      displayEntry: function(entry) {
        app = this;
        app.entry = entry;
        app.characters = this.hsk.getCharactersInWord(entry.word);
        getLrcs(entry.word, function(lrcs) {
          lrcs.forEach(function(lrc) {
            lrc.matchedLines = [];
            lrc.content.forEach(function(line, index) {
              if (line.line.includes(entry.word)) {
                lrc.matchedLines.push(index);
              }
            });
          });
          app.lrcs = lrcs;
        });
        app.getImage(entry);
        app.initialized = true;
        app.annotated = false; // Add pinyin again on update
        app.suggestions = [];
        $("#lookup").val(entry.word);
        $(".youtube iframe").remove(); // Show new videos;
        app.$forceUpdate();
      },

      youtubeScreenTap: function(e) {
        var youtube = $(e.target).attr("data-youtube");
        var starttime = $(e.target).attr("data-starttime");
        var src =
          "https://www.youtube.com/embed/" +
          youtube +
          "?start=" +
          Math.floor(starttime);
        var iframe =
          '<iframe src="' +
          src +
          '" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
        console.log(iframe);
        $(e.target).after(iframe); // Add the embed
      },

      getImage: function(entry) {
        var app = this;
        var imagePath = "img/words/" + entry.id + "-" + entry.word + ".jpg";
        $.ajax(imagePath)
          .done(function() {
            app.image = imagePath;
            app.hasImage = true;
          })
          .fail(function() {
            app.hasImage = false;
          });
        getSrcsFromUnsplash(
          app.hsk.simplifyEnglish(app.entry.english),
          function(srcs) {
            app.unsplashSrcs = srcs;
          }
        );
      },
      uploadPhotoAndUpdate(url, $button) {
        savePhoto(app.entry, url, function(response) {
          $button.after('<span class="success">Uploaded</span>');
          app.hasImage = true;
          app.image = response.url;
          setTimeout(function() {
            $(".success").remove();
          }, 3000);
        });
      },
      unsplashThumbClick(e) {
        var $button = $(e.target);
        var url = $button.attr("src");
        var app = this;
        this.uploadPhotoAndUpdate(url, $button);
      },
      imageUrlKeyupEnter(e) {
        var $input = $(e.target);
        var url = $(e.target).val();
        this.uploadPhotoAndUpdate(url, $input);
      },
      searchImageKeyupEnter(e) {
        getSrcsFromUnsplash($(e.target).val(), function(srcs) {
          app.unsplashSrcs = srcs;
        });
      },
      lookupKeyupEnter() {
        const url = $(".suggestion:first-child").attr("href");
        window.location = url;
        $(".suggestion:first-child")
          .get(0)
          .click();
      },
      lookupButtonClick() {
        const url = $(".suggestion:first-child").attr("href");
        window.location = url;
        $(".suggestion:first-child")
          .get(0)
          .click();
      },
      lookupKeyup(e) {
        app.suggestions = [];
        var text = e.target.value;
        if (text !== "") {
          var suggestions = app.hsk.lookupHskFussy(text);
          if (suggestions.length > 0) {
            app.suggestions = suggestions;
            suggestions.forEach(function(suggestion) {
              suggestion.href = "#" + suggestion.id;
            });
          } else if (suggestions.length == 0) {
            app.suggestions = [
              {
                notFound: true,
                text: text,
                href: "https://en.wiktionary.org/w/index.php?search=" + text
              }
            ];
          }
        }
      },
      highlight(text) {
        if (text) {
          return text.replace(
            this.entry.word,
            '<b data-hsk="' + this.entry.book + '">' + this.entry.word + "</b>"
          );
        }
      },
      showMoreClick(e) {
        $button = $(e.currentTarget);
        $button.prev().toggleClass("collapsed");
        $button.toggleClass("collapsed");
      },
      backToBrowse() {
        location.hash = "";
      },
      previousClick(e) {
        var previous = Math.max(0, parseInt(this.entry.id) - 1);
        location.hash = previous;
      },
      nextClick(e) {
        var next = Math.min(this.hsk.count(), parseInt(this.entry.id) + 1);
        location.hash = next;
      },
      suggestionClick(e) {
        this.suggestions = [];
      },
      toggleCollapsed(e) {
        $(e.target)
          .next("ul")
          .toggleClass("collapsed");
      },
      bookClick(e) {
        var book = $(e.target)
          .parents("[data-book]")
          .attr("data-book");
        this.wordList = this.hsk.listByBook(book);
        $(e.target)
          .next("ul")
          .toggleClass("collapsed");
      },
      lessonClick(e) {
        var lesson = $(e.target)
          .parents("[data-lesson]")
          .attr("data-lesson");
        var book = $(e.target)
          .parents("[data-book]")
          .attr("data-book");
        this.wordList = this.hsk.listByBookLesson(book, lesson);
        $(e.target)
          .next("ul")
          .toggleClass("collapsed");
      },
      dialogClick(e) {
        var dialog = $(e.target)
          .parents("[data-dialog]")
          .attr("data-dialog");
        var lesson = $(e.target)
          .parents("[data-lesson]")
          .attr("data-lesson");
        var book = $(e.target)
          .parents("[data-book]")
          .attr("data-book");
        this.wordList = this.hsk.listBookLessonDialog(book, lesson, dialog);
        $(e.target)
          .next("ul")
          .toggleClass("collapsed");
      },
      songNextClick(e) {
        var $songs = $(".song-caroussel .songs");
        var $firstSong = $songs.find(".song:first-child");
        $firstSong.appendTo($songs); // move to the last
      },
      songPreviousClick(e) {
        var $songs = $(".song-caroussel .songs");
        var $firstSong = $songs.find(".song:last-child");
        $firstSong.prependTo($songs); // move to the last
      },
      cycleYouTubeClick(e) {
        var $versions = $(e.target).prev(".youtube-versions");
        $versions.find(".youtube:first-child").appendTo($versions);
      },
      rejectLine(line) {
        (bannedPatterns = [
          "www",
          "LRC",
          " - ",
          "歌词",
          "QQ",
          "演唱：",
          "编辑：",
          "☆"
        ]),
          (rejected = false);
        bannedPatterns.forEach(function(pattern) {
          if (line.includes(pattern)) {
            rejected = true;
          }
        });
        return rejected;
      },
      /**
       *
       * @param {*} index the index of the lrc line
       * @param {*} margin show 'margin' number of lines above and below the first matched line
       * @param {*} lrc the lrc object
       */
      inContext(index, margin, lrc) {
        var min = lrc.matchedLines[0] - margin;
        var max = lrc.matchedLines[0] + margin;
        return index >= min && index <= max;
      },
      recalculateExampleColumns: function(word) {
        var $div = $(".character-example-wrapper > div");
        var span = 12 / word.length;
        $div.removeClass();
        $div.addClass("col-md-" + span);
      },

      addAnimatedSvgLinks: function(word) {
        var chars = word.split("");
        var html = "";
        chars.forEach(function(char) {
          html = html + this.hsk.animatedSvgLink(char);
        });
        return html;
      },

      attachSpeakEventHandler: function() {
        $(".speak")
          .off()
          .click(function() {
            var text = $(this).attr("data-speak");
            var utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = "zh-CN";
            speechSynthesis.speak(utterance);
          });
      }
    },
    updated: function() {
      var app = this;
      if (app.initialized) {
        app.recalculateExampleColumns(this.entry.word);
        app.attachSpeakEventHandler();
        if ($(".add-pinyin").length > 0 && !app.annotated) {
          app.annotated = true; // Only once!
          new Annotator().annotateBySelector(
            ".add-pinyin, .add-pinyin *",
            function() {
              // success
            }
          );
        }
      }
    }
  });

  window.onhashchange = function() {
    id = decodeURI(location.hash.substr(1));
    if (id) {
      app.showById(id);
    } else {
      app.initialized = false;
    }
    window.scrollTo(0, 0);
  };
  if (location.hash && location.hash.length > 1) {
    id = decodeURI(location.hash.substr(1));
    app.showById(id);
  }
}

HSK.load(function(hsk) {
  main(hsk);
});
