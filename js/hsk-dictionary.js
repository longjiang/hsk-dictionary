/**
* v3.4.2
*/

// eslint-disable-next-line no-unused-vars
var onYouTubePlayerAPIReady = function() {
  // This needs to be in global scope as YouTube api will call it
  // This function is overwridden from the app.loadYouTubeiFrame() function
};

// eslint-disable-next-line no-unused-vars
var onPlayerReady = function(evt) {
  // Required by YouTube API
};

class Timer {
  constructor() {
    this._currentTime = 0; // seconds
    this._onTimeChangeHandlers = [];
  }
  play() {
    // setTimeout
  }
  pause() {
    
  }
  setCurrentTime(currentTime) {
    this._currentTime = currentTime;
    this._onTimeChangeHandlers.forEach(function(handler) {
      handler(this._currentTime);
    });
  }
}


(function($){
  
  function getLrcs(word, callback) {
    $.getJSON(
      "https://www.chinesezerotohero.com/lyrics-search/lrc/search/" +
      word +
      "/20", // Limit to only 20 songs
      function(results) {
        callback(results);
      });
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
        $html
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
          var $html = $(response, ownerDocument);
          callback($html, response);
        });
      }
      
      function main(hskObj) {
        // eslint-disable-next-line no-undef
        var app = new Vue({
          el: "#hsk-dictionary",
          data: {
            character: {},
            hsk: hskObj,
            lrcs: [], // matched song lyrics, pulled from another server
            wordList: hskObj.listWhere(function(word) {
              word.oofc === "";
            }),
            savedWordIds: localStorage.getItem("savedWordIds")
            ? JSON.parse(localStorage.getItem("savedWordIds"))
            : [],
            entry: undefined,
            books: hskObj.compileBooks(),
            characters: [],
            image: undefined,
            hasImage: true,
            suggestions: [],
            view:
            "browse" /* Default view is "browse words by course", can also set to "entry" (when viewing a word), or "saved-words" */,
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
              if (app.savedWordIds.includes(entry.id)) {
                entry.saved = true;
              }
              app.characters = app.hsk.hanzi.getCharactersInWord(entry.word);
              app.characters.forEach(function(character) {
                character.examples = app.hsk.lookupFuzzy(character.character);
              });
              
              getLrcs(entry.word, function(lrcs) {
                lrcs.forEach(function(lrc) {
                  lrc.matchedLines = [];
                  lrc.content.forEach(function(line, index) {
                    if (line.line.includes(entry.word)) {
                      lrc.matchedLines.push(index);
                    }
                  });
                  lrc.currentYoutubeIndex = 1; // "Showing 1 of 23 videos..."
                });
                app.lrcs = lrcs.sort(function(a, b) {
                  return (
                    Object.keys(b.matchedLines).length -
                    Object.keys(a.matchedLines).length
                    );
                  });
                });
                app.getImage(entry);
                app.view = "entry";
                app.annotated = false; // Add pinyin again on update
                app.suggestions = [];
                $(".btn-saved-words").removeClass("blink");
                $("#lookup").val(entry.word);
                $(".youtube iframe").remove(); // Show new videos;
                app.$forceUpdate();
              },
              
              /*
              loadYouTubeiFrame(youtube, starttime, element) {
                var src =
                "https://www.youtube.com/embed/" +
                youtube +
                "?start=" +
                Math.floor(starttime) +
                "&playsinline=1";
                var iframe =
                '<iframe src="' +
                src +
                '" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
                $(element).after(iframe); // Add the embed
              },
              */
              
              removeYouTubeAPIVars: function () {
                if (window['YT']) {
                  ['YT', 'YTConfig', 'onYTReady', 'yt', 'ytDomDomGetNextId', 'ytEventsEventsListeners', 'ytEventsEventsCounter'].forEach(function(key) {
                    window[key] = undefined;
                  });
                }
              },
              
              loadYouTubeiFrame: function (youtube, starttime, elementId, lrc) {
                var app = this;
                var player;
                // $('.youtube iframe').remove();
                this.removeYouTubeAPIVars();
                window.onYouTubePlayerAPIReady = function () {
                  // eslint-disable-next-line no-undef
                  player = new YT.Player(elementId, {
                    height: '390',
                    width: '640',
                    videoId: youtube,
                    playerVars: { 'start': parseInt(starttime), 'autoplay': 1, 'controls': 1, 'showinfo': 0, 'rel': 0 },
                    events: {
                      'onReady': onPlayerReady,
                      'onStateChange': function(playerStatus) {
                        if (playerStatus == 1) { // Playing, update time
                          lrc.timer.setCurrentTime(lrc, player.getCurrentTime());
                          lrc.timer.play();
                          
                        }
                        if (playerStatus == 2) { // Playing, update time
                          lrc.timer.setCurrentTime(lrc, player.getCurrentTime());
                          lrc.timer.pauase();
                        }
                      }
                    }
                  });
                  lrc.youtubePlayer = player
                }
                $.getScript('//www.youtube.com/iframe_api');
              },
              
              seekYouTube: function(lrc, starttime) {
                var player = lrc.youtubePlayer;
                player.seekTo(starttime);
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
                countWordsInLesson(lesson) {
                  var count = 0;
                  for (var index in lesson) {
                    var dialog = lesson[index];
                    count += dialog.length;
                  }
                  return count;
                },
                unsplashThumbClick(e) {
                  var $button = $(e.target);
                  var url = $button.attr("src");
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
                  if (url) {
                    window.location = url;
                    $(".suggestion:first-child")
                    .get(0)
                    .click();
                  }
                },
                lookupKeyup(e) {
                  app.suggestions = [];
                  var text = e.target.value;
                  if (text !== "") {
                    var suggestions = app.hsk.lookupFuzzy(text);
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
                getWordsByIds(ids) {
                  var app = this;
                  var words = [];
                  ids.forEach(function(id) {
                    var word = app.hsk.get(id);
                    if (word) {
                      words.push(word);
                    }
                  });
                  return words;
                },
                highlight(text) {
                  if (text) {
                    return text.replace(
                      this.entry.word,
                      '<span data-hsk="' +
                      this.entry.book +
                      '">' +
                      this.entry.word +
                      "</span>"
                      );
                    }
                  },
                  highlightCharacter(text, character, hsk) {
                    if (text) {
                      return text.replace(
                        character,
                        '<span data-hsk="' + hsk + '">' + character + "</span>"
                        );
                      }
                    },
                    togglePartExamples(part) {
                      part.showExamples
                      ? (part.showExamples = false)
                      : (part.showExamples = true);
                      app.$forceUpdate();
                    },
                    showMoreClick(e) {
                      var $button = $(e.currentTarget);
                      $button.siblings("[data-collapse-target]").toggleClass("collapsed");
                      $button.toggleClass("collapsed");
                    },
                    backToBrowse() {
                      this.view = "browse";
                      location.hash = "";
                    },
                    previousClick() {
                      var previous = Math.max(0, parseInt(this.entry.id) - 1);
                      location.hash = previous;
                    },
                    nextClick() {
                      var next = Math.min(this.hsk.count(), parseInt(this.entry.id) + 1);
                      location.hash = next;
                    },
                    suggestionClick() {
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
                      var $target = $(e.target);
                      if (e.target.tagName.toLowerCase() !== "div") {
                        $target = $target.parent();
                      }
                      var lesson = $target.parents("[data-lesson]").attr("data-lesson");
                      var book = $target.parents("[data-book]").attr("data-book");
                      this.wordList = this.hsk.listByBookLesson(book, lesson);
                      $target.next("ul").toggleClass("collapsed");
                    },
                    dialogClick(e) {
                      var $target = $(e.target);
                      if (e.target.tagName.toLowerCase() !== "div") {
                        $target = $target.parent();
                      }
                      var dialog = $target.parents("[data-dialog]").attr("data-dialog");
                      var lesson = $target.parents("[data-lesson]").attr("data-lesson");
                      var book = $target.parents("[data-book]").attr("data-book");
                      this.wordList = this.hsk.listBookLessonDialog(book, lesson, dialog);
                      $target.next("ul").toggleClass("collapsed");
                    },
                    songNextClick() {
                      var $songs = $(".song-caroussel .songs");
                      var $firstSong = $songs.find(".song:first-child");
                      $firstSong.appendTo($songs); // move to the last
                    },
                    songPreviousClick() {
                      var $songs = $(".song-caroussel .songs");
                      var $firstSong = $songs.find(".song:last-child");
                      $firstSong.prependTo($songs); // move to the last
                    },
                    cycleYouTube(lrc, index) {
                      var $versions = $("#lrc-" + index + "-youtube");
                      $versions.find(".youtube:first-child").appendTo($versions);
                      lrc.currentYoutubeIndex += 1;
                      if (lrc.currentYoutubeIndex > lrc.youtube.length) {
                        lrc.currentYoutubeIndex =
                        lrc.currentYoutubeIndex - lrc.youtube.length;
                      }
                      var $youtube = $versions.find('.youtube:first-child .youtube-screen')
                      $youtube.click(); // Load the iframe
                    },
                    rejectLine(line) {
                      var bannedPatterns = [
                        "www",
                        "LRC",
                        " - ",
                        "歌词",
                        "QQ",
                        "演唱：",
                        "编辑：",
                        "☆"
                      ];
                      var rejected = false;
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
                      var app = this;
                      chars.forEach(function(char) {
                        html = html + app.hsk.hanzi.animatedSvgLink(char);
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
                    },
                    showPinyinClick: function(e) {
                      var selector = $(e.target).attr("data-target-selector");
                      $(selector).addClass("add-pinyin"); // Soo it will have the pinyin looks
                      $(e.target).text("Loading...");
                      // eslint-disable-next-line no-undef
                      new Annotator().annotateBySelector(selector + " *", function() {
                        var index = $(e.target).attr("data-index");
                        app.lrcs[index].annotated = true;
                        app.$forceUpdate();
                      });
                    },
                    // ANCHOR img/anchors/save-word-button.png
                    addSavedWord: function(id) {
                      this.savedWordIds.push(id);
                      localStorage.setItem("savedWordIds", JSON.stringify(this.savedWordIds));
                      $(".btn-saved-words").addClass("blink");
                    },
                    removeSavedWord: function(id) {
                      this.savedWordIds = this.savedWordIds.filter(function(savedWordId) {
                        return id != savedWordId;
                      });
                      localStorage.setItem("savedWordIds", JSON.stringify(this.savedWordIds));
                      $(".btn-saved-words").removeClass("blink");
                    },
                    saveWordClick: function(e) {
                      var $target = $(e.target);
                      if (e.target.tagName.toLowerCase() === "i") {
                        $target = $target.parent();
                      }
                      var id = $target.attr("data-id");
                      if (!this.savedWordIds.includes(id)) {
                        this.addSavedWord(id);
                      } else {
                        this.removeSavedWord(id);
                      }
                    },
                    // ANCHOR img/anchors/saved-words-button.png
                    savedWordsButtonClick: function() {
                      this.view = "saved-words";
                      location.hash = "";
                    }
                  },
                  computed: {
                    savedWordIdsSorted: function() {
                      return this.savedWordIds.sort(function(a, b) {
                        return parseInt(a) - parseInt(b);
                      });
                    }
                  },
                  updated: function() {
                    var app = this;
                    if (app.view == "entry") {
                      app.recalculateExampleColumns(this.entry.word);
                      app.attachSpeakEventHandler();
                      var selector = ".example-wrapper > .example-sentence";
                      if ($(selector).length > 0 && !app.annotated) {
                        app.annotated = true; // Only once!
                        $(selector).addClass("add-pinyin"); // So we get the looks
                        // eslint-disable-next-line no-undef
                        new Annotator().annotateBySelector(
                          selector + ", " + selector + " *",
                          function() {
                            // success
                          }
                          );
                        }
                      }
                    }
                  });
                  
                  window.onhashchange = function() {
                    var id = decodeURI(location.hash.substr(1));
                    if (id) {
                      app.showById(id);
                      window.scrollTo(0, 0);
                    }
                  };
                  if (location.hash && location.hash.length > 1) {
                    var id = decodeURI(location.hash.substr(1));
                    app.showById(id);
                  }
                }
                
                HSK.load(function(hsk) {
                  main(hsk);
                });
                
                // eslint-disable-next-line no-undef
              })(jQuery);
              