/**
* v3.7.7
*/

const SavedWords = {
  getIds() {
    return localStorage.getItem("savedWordIds")
    ? JSON.parse(localStorage.getItem("savedWordIds"))
    : []
  },
  count() {
    return this.getIds().length
  },
  getIdsSorted() {
    return this.getIds().sort(function (a, b) {
      return parseInt(a) - parseInt(b)
    });
  },
  add(id) {
    const savedWordIds = this.getIds()
    savedWordIds.push(id)
    localStorage.setItem("savedWordIds", JSON.stringify(savedWordIds));
    $(".btn-saved-words").addClass("blink")
  },
  remove(id) {
    const savedWordIds = this.getIds().filter(function (savedWordId) {
      return id != savedWordId
    });
    localStorage.setItem("savedWordIds", JSON.stringify(savedWordIds))
    $(".btn-saved-words").removeClass("blink")
  },
  removeAll() {
    localStorage.removeItem('savedWordIds')
  },
  includes(id) {
    return this.getIds().includes(id)
  }
};

var entry = undefined;

(function ($) {
  function main(hsk, cedict) {
    hskDictionaryApp = new Vue({
      el: "#hsk-dictionary",
      components: {
        'search': SearchComponent(hsk, cedict),
        'browse': BrowseComponent(hsk, cedict),
        'saved-words': SavedWordsComponent(hsk, cedict),
        'entry': EntryComponent(hsk, cedict),
      },
      data: {
        wordList: hsk.listWhere(function (word) {
          word.oofc === "";
        }),
        // savedWordIds: SavedWords.getIds(),
        view:
          "browse" /* Default view is "browse words by course", can also set to "entry" (when viewing a word), or "saved-words" */,
      },
      methods: {
        adminClick: function () {
          if (this.$refs.entry) {
            this.$refs.entry.admin = true
          }
        },
        toggleCollapsed(e) {
          $(e.target)
            .next("ul")
            .toggleClass("collapsed");
        },
        // ANCHOR img/anchors/save-word-button.png
        showCedict: function (text) {
          console.log(text, 'showCedict')
        },
        processHash() {
          const app = this;
          const hash = decodeURI(location.hash).slice(1).split('/')
          const controller = hash[0]
          const method = hash[1]
          const args = hash[2] ? hash[2].split(',') : []
          if (controller === 'view') {
            app.view = 'entry'
            if (method == 'hsk') {
              if (args.length > 0) {
                const id = args[0]
                entry = hsk.get(id)
                if (this.$refs.entry) {
                  this.$refs.entry.show(entry)
                }
              }
            } else if (method === 'cedict') {
              if (args.length > 0) {
                const traditional = args[0]
                const results = cedict.lookup(traditional)
                if (results.length > 0) {
                  entry = results[0]
                  entry.word = entry.simplified
                  entry.book = "outside"
                  if (this.$refs.entry) {
                    this.$refs.entry.show(entry)
                  }
                  console.log(entry)
                }
              }
            }
          } else if (controller === 'saved-words') {
            app.view = "saved-words"
          } else if (controller === 'browse') {
            app.view = "browse"
          } else {
            location.hash = "browse"
          }
          window.scrollTo(0, 0)
        }
      }
    });
    hskDictionaryApp.processHash()
    window.onhashchange = function() {
      hskDictionaryApp.processHash()
    }
  }

  HSK.load(function (hsk) {
    CEDICT.load(function(cedict) {
      main(hsk, cedict);
    })
  });

  // eslint-disable-next-line no-undef
})(jQuery);