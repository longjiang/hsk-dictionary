function EntryComponent(hsk) {
  return {
    template: '#entry-template',
    components: {
      'collocations': {
        template: '#collocations-template',
        props: ['word', 'level', 'type', 'title', 'collocation'],
        data() {
          return {
            key: 0 // used to force re-render this component
          }
        }
      },
    },
    data() {
      return {
        entry: undefined,
        characters: [],
        character: {},
        hasImage: true,
        admin: false,
        image: undefined,
        lrcs: [], // matched song lyrics, pulled from another server
        hsk: hsk,
        unsplashSrcs: [],
        unsplashSearchTerm: "",
        key: 0, // used to force re-render this component
        collocationsKey: 0,
        concordanceKey: 0,
        webImagesKey: 0
      }
    },
    computed: {
      hasPrevious: function () {
        var thisId = parseInt(this.entry.id);
        if (SavedWords.count() < 2) {
          return hsk.hasPrevious(thisId);
        } else {
          i = SavedWords.getIdsSorted().indexOf(thisId.toString())
          return i > 0;
        }
      },
      hasNext: function () {
        var thisId = parseInt(this.entry.id);
        if (SavedWords.count() < 2) {
          return hsk.hasNext(thisId);
        } else {
          i = SavedWords.getIdsSorted().indexOf(thisId.toString())
          return i + 1 < SavedWords.count()
        }
      }
    },
    methods: {
      // TODO reduced repeated saveWordClick definitions by making word lists into a component
      saveWordClick: function (e) {
        var $target = $(e.target);
        if (e.target.tagName.toLowerCase() === "i") {
          $target = $target.parent();
        }
        var id = $target.attr("data-id");
        if (!SavedWords.getIds().includes(id)) {
          SavedWords.add(id);
        } else {
          SavedWords.remove(id);
        }
        this.key += 1 // force re-render this component
        if (hskDictionaryApp.$refs.search) {
          hskDictionaryApp.$refs.search.update()
        }
      },
      previousClick() {
        var thisId = parseInt(this.entry.id)
        var previousId;
        if (SavedWords.count() < 2) {
          var previousId = Math.max(hsk.first(), thisId - 1)
        } else {
          const savedIds = SavedWords.getIdsSorted()
          i = savedIds.indexOf(thisId.toString())
          var previousIndex = Math.max(0, i - 1);
          previousId = savedIds[previousIndex]
        }
        location.hash = "view/hsk/" + previousId;
      },
      nextClick() {
        var thisId = parseInt(this.entry.id);
        var nextId;
        if (SavedWords.count() < 2) {
          var nextId = Math.min(hsk.last(), thisId + 1)
        } else {
          const savedIds = SavedWords.getIdsSorted()
          i = savedIds.indexOf(thisId.toString())
          var nextIndex = Math.min(SavedWords.count() - 1, i + 1)
          nextId = savedIds[nextIndex]
        }
        location.hash = "view/hsk/" + nextId
      },
      highlight(text) {
        if (text) {
          return text.replace(this.entry.word, '<span data-hsk="' + this.entry.book + '">' + this.entry.word + "</span>");
        }
      },
      recalculateExampleColumns: function (word) {
        var $div = $(".character-example-wrapper > div");
        var span = 12 / word.length;
        $div.removeClass();
        $div.addClass("col-md-" + span);
      },
      show(entry) {
        const app = this;
        app.entry = entry;
        if (SavedWords.includes(entry.id)) {
          entry.saved = true;
        }
        app.characters = hsk.hanzi.getCharactersInWord(entry.word);
        app.characters.forEach(function (character) {
          character.examples = hsk.lookupFuzzy(character.character);
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
        SketchEngine.wsketch(entry.word, function(response) {
          entry.sketch = response
          app.collocationsKey += 1
        });
        SketchEngine.concordance(entry.word, function(response) {
          entry.examples = response
          app.concordanceKey += 1
        });
        WordPhotos.getWebImages(entry.word, function(srcs) {
          entry.images = srcs
          app.webImagesKey += 1
        })
        app.getImage(entry);
        app.suggestions = [];
        $(".btn-saved-words").removeClass("blink");
        $("#lookup").val(entry.word);
        $(".youtube iframe").remove(); // Show new videos;
        app.$forceUpdate();
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
      highlightCharacter(text, character, hsk) {
        if (text) {
          return text.replace(character, '<span data-hsk="' + hsk + '">' + character + "</span>"
          );
        }
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
      togglePartExamples(part) {
        var app = this;
        if (!part.hskCharacters) {
          part.hskCharacters = hsk.getHSKCharactersByRadical(part.character);
        }
        part.showExamples
          ? (part.showExamples = false)
          : (part.showExamples = true);
        app.$forceUpdate();
      },
      searchImageKeyupEnter(e) {
        const app = this
        WordPhotos.getSrcsFromUnsplash($(e.target).val(), function (srcs) {
          app.unsplashSrcs = srcs;
        });
      },
      imageUrlKeyupEnter(e) {
        var $input = $(e.target);
        var url = $(e.target).val();
        this.uploadPhotoAndUpdate(url, $input);
      },
      uploadPhotoAndUpdate(url, $button) {
        const app = this
        WordPhotos.savePhoto(app.entry, url, function (response) {
          $button.after('<span class="success">Uploaded</span>');
          app.hasImage = true;
          app.image = response.url + '?' + Date.now();
          setTimeout(function () {
            $(".success").remove();
          }, 3000);
        });
      },
      unsplashThumbClick(e) {
        var $button = $(e.target);
        var url = $button.attr("src");
        this.uploadPhotoAndUpdate(url, $button);
      },
    },
    mounted() {
      this.show(entry)
    },
    updated() {
      const app = this
      app.recalculateExampleColumns(this.entry.word);
      app.attachSpeakEventHandler();
      var selector = ".example-wrapper > .example-sentence *";
    }
  }
}