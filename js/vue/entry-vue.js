function EntryVue(hskObj) {
  return new Vue({
    el: "#hsk-dictionary",
    data: {
      character: {},
      hsk: hskObj,
      lrcs: [], // matched song lyrics, pulled from another server
      wordList: hskObj.listWhere(function (word) {
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
      adminClick: function () {
        this.admin = true;
      },
      showById: function (id) {
        var entry = this.hsk.get(id);
        if (entry) {
          this.displayEntry(entry);
        }
      },
      getImage() {
        var app = this;
        WordPhotos.getPhoto(app.entry, function (imagePath) {
          app.image = imagePath;
          app.hasImage = true;
        }, function () {
          app.hasImage = false;
        })
      },
      displayEntry: function (entry) {
        app = this;
        app.entry = entry;
        if (app.savedWordIds.includes(entry.id)) {
          entry.saved = true;
        }
        app.characters = app.hsk.hanzi.getCharactersInWord(entry.word);
        app.characters.forEach(function (character) {
          character.examples = app.hsk.lookupFuzzy(character.character);
        });

        getLrcs(entry.word, function (lrcs) {
          lrcs.forEach(function (lrc) {
            lrc.matchedLines = [];
            lrc.content.forEach(function (line, index) {
              if (line.line.includes(entry.word)) {
                lrc.matchedLines.push(index);
              }
            });
            lrc.currentYoutubeIndex = 1; // "Showing 1 of 23 videos..."
          });
          app.lrcs = lrcs.sort(function (a, b) {
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
        getSrcsFromUnsplash($(e.target).val(), function (srcs) {
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
        app = this;
        app.suggestions = [];
        var text = e.target.value;
        if (text !== "") {
          var suggestions = app.hsk.lookupFuzzy(text).slice(0, 5);
          if (suggestions.length > 0) {
            app.suggestions = suggestions;
            suggestions.forEach(function (suggestion) {
              suggestion.href = "#view/hsk/" + suggestion.id;
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
        ids.forEach(function (id) {
          var word = app.hsk.get(id);
          if (word) {
            words.push(word);
          }
        });
        return words;
      },
      highlight(text) {
        if (text) {
          return text.replace(this.entry.word, '<span data-hsk="' + this.entry.book + '">' + this.entry.word + "</span>");
        }
      },
      highlightCharacter(text, character, hsk) {
        if (text) {
          return text.replace(character, '<span data-hsk="' + hsk + '">' + character + "</span>"
          );
        }
      },
      togglePartExamples(part) {
        var app = this;
        if (!part.hskCharacters) {
          part.hskCharacters = app.hsk.getHSKCharactersByRadical(part.character);
        }
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
        location.hash = "#browse";
      },
      previousClick() {
        var thisId = parseInt(this.entry.id);
        var previousId;
        if (app.savedWordIds.length < 2) {
          var previousId = Math.max(this.hsk.first(), thisId - 1);
        } else {
          i = app.savedWordIdsSorted.indexOf(thisId.toString())
          var previousIndex = Math.max(0, i - 1);
          previousId = app.savedWordIds[previousIndex]
        }
        location.hash = "view/hsk/" + previousId;
      },
      nextClick() {
        var thisId = parseInt(this.entry.id);
        var nextId;
        if (app.savedWordIds.length < 2) {
          var nextId = Math.min(this.hsk.last(), thisId + 1);
        } else {
          i = app.savedWordIdsSorted.indexOf(thisId.toString())
          var nextIndex = Math.min(app.savedWordIds.length - 1, i + 1);
          nextId = app.savedWordIds[nextIndex]
        }
        location.hash = "view/hsk/" + nextId;
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
      recalculateExampleColumns: function (word) {
        var $div = $(".character-example-wrapper > div");
        var span = 12 / word.length;
        $div.removeClass();
        $div.addClass("col-md-" + span);
      },
      attachSpeakEventHandler: function () {
        $(".speak")
          .off()
          .click(function () {
            var text = $(this).attr("data-speak");
            var utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = "zh-CN";
            speechSynthesis.speak(utterance);
          });
      },
      showPinyinClick: function (e) {
        var selector = $(e.target).attr("data-target-selector");
        $(selector).addClass("add-pinyin"); // Soo it will have the pinyin looks
        $(e.target).text("Loading...");
        // eslint-disable-next-line no-undef
        new Annotator().annotateBySelector(selector + " *", function () {
          var index = $(e.target).attr("data-index");
          app.lrcs[index].annotated = true;
          app.$forceUpdate();
        });
      },
      // ANCHOR img/anchors/save-word-button.png
      addSavedWord: function (id) {
        this.savedWordIds.push(id);
        localStorage.setItem("savedWordIds", JSON.stringify(this.savedWordIds));
        $(".btn-saved-words").addClass("blink");
      },
      removeSavedWord: function (id) {
        this.savedWordIds = this.savedWordIds.filter(function (savedWordId) {
          return id != savedWordId;
        });
        localStorage.setItem("savedWordIds", JSON.stringify(this.savedWordIds));
        $(".btn-saved-words").removeClass("blink");
      },
      saveWordClick: function (e) {
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
      savedWordsButtonClick: function () {
        location.hash = "saved-words";
      },
      showImportClick: function () {
        $('.import-wrapper').toggleClass('hidden');
      },
      importClick: function () {
        const list = $('#import-textarea').val().split("\n");
        const app = this;
        var notMatched = []
        list.forEach(function (item) {
          const words = app.hsk.lookup(item, 'exclude');
          if (words[0] && !app.savedWordIds.includes(words[0].id)) {
            app.addSavedWord(words[0].id);
          } else {
            notMatched.push(item)
          }
        })
        const words = app.hsk.listWhere(function (word) {
          found = false;
          notMatched.forEach(function (item) {
            if (item.includes(word.word)) found = true;
          })
          return found;
        })
        words.forEach(function (word) {
          if (!app.savedWordIds.includes(word.id)) app.addSavedWord(word.id)
        })
        $('.import-wrapper').addClass('hidden')
      },
      removeAllClick: function () {
        const confirmed = confirm("Are you sure you want to remove all your saved words?");
        if (confirmed) {
          this.savedWordIds = []
          localStorage.removeItem('savedWordIds')
        }
      },
      showCedict: function (text) {
        console.log(text, 'showCedict')
      }
    },
    computed: {
      savedWordIdsSorted: function () {
        return this.savedWordIds.sort(function (a, b) {
          return parseInt(a) - parseInt(b);
        });
      },
      hasPrevious: function () {
        var thisId = parseInt(this.entry.id);
        if (app.savedWordIds.length < 2) {
          return this.hsk.hasPrevious(thisId);
        } else {
          i = app.savedWordIdsSorted.indexOf(thisId.toString())
          return i > 0;
        }
      },
      hasNext: function () {
        var thisId = parseInt(this.entry.id);
        if (app.savedWordIds.length < 2) {
          return this.hsk.hasNext(thisId);
        } else {
          i = app.savedWordIdsSorted.indexOf(thisId.toString())
          return i + 1 < app.savedWordIds.length
        }
      }
    },
    updated: function () {
      var app = this;
      if (app.view == "entry") {
        app.recalculateExampleColumns(this.entry.word);
        app.attachSpeakEventHandler();
        var selector = ".example-wrapper > .example-sentence *";
        if ($(selector).length > 0 && !app.annotated) {
          app.annotated = true; // Only once!
          // eslint-disable-next-line no-undef
          new Annotator().annotateBySelector(
            selector,
            function () {
              // success
            }
          );
        }
      }
    }
  });
}
