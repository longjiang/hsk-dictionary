function SearchComponent(hsk, cedict) {
  return {
    template: '#search-template',
    data() {
      return {
        suggestions: [],
        savedWordIds: SavedWords.getIds(),
        key: 0,
      }
    },
    methods: {
      // ANCHOR img/anchors/saved-words-button.png
      savedWordsButtonClick: function () {
        location.hash = "saved-words";
      },
      suggestionClick() {
        this.suggestions = [];
      },
      backToBrowse() {
        location.hash = "#browse";
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
          const hskSuggestions = hsk.lookupFuzzy(text).slice(0, 5);
          const cedictSuggestions = cedict.lookupFuzzy(text).slice(0, 5);
          var suggestions = [];
          var hskWordStrArray = []
          hskSuggestions.forEach(function(hskSuggestion) {
            hskWordStrArray.push(hskSuggestion.word)
            suggestions.push({
              type: 'hsk',
              href: "#view/hsk/" + hskSuggestion.id,
              row: hskSuggestion
            })
          })
          const cedictFiltered = cedictSuggestions.filter(function(cedictSuggestion) {
            return ! hskWordStrArray.includes(cedictSuggestion.simplified)
          })
          cedictFiltered.forEach(function(cedictSuggestion){
            suggestions.push({
              type: 'cedict',
              href: "#view/cedict/" + cedictSuggestion.traditional,
              row: cedictSuggestion
            })
          })
          if (suggestions.length === 0) {
            suggestions.push({
              type: "notFound",
              text: text,
              href: "https://en.wiktionary.org/w/index.php?search=" + text
            })
          }
          app.suggestions = suggestions;
        }
      },
      update() {
        this.savedWordIds = SavedWords.getIds()
      }
    }
  }
}