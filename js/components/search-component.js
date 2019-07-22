function SearchComponent(hsk) {
  return {
    template: '#search-template',
    data() {
      return {
        suggestions: [],
        savedWordIds: SavedWords.getIds()
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
          var suggestions = hsk.lookupFuzzy(text).slice(0, 5);
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
    }
  }
}