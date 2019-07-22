function SavedWordsComponent(hsk) {
  return {
    template: '#saved-words-template',
    data() {
      return {
        key: 0 // used to force re-render this component
      }
    },
    methods: {
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
      },
      showImportClick: function () {
        $('.import-wrapper').toggleClass('hidden');
      },
      getWordsByIds(ids) {
        var words = [];
        ids.forEach(function (id) {
          var word = hsk.get(id);
          if (word) {
            words.push(word);
          }
        });
        return words;
      },
      removeAllClick: function () {
        const confirmed = confirm("Are you sure you want to remove all your saved words?");
        if (confirmed) {
          SavedWords.removeAll()
        }
        this.key += 1 // force re-render this component
      },
      importClick: function () {
        const list = $('#import-textarea').val().split("\n");
        const app = this;
        var notMatched = []
        list.forEach(function (item) {
          const words = hsk.lookup(item, 'exclude');
          if (words[0] && !SavedWords.getIds().includes(words[0].id)) {
            SavedWords.add(words[0].id);
          } else {
            notMatched.push(item)
          }
        })
        const words = hsk.listWhere(function (word) {
          found = false;
          notMatched.forEach(function (item) {
            if (item.includes(word.word)) found = true;
          })
          return found;
        })
        words.forEach(function (word) {
          if (!SavedWords.getIds().includes(word.id)) SavedWords.add(word.id)
        })
        $('.import-wrapper').addClass('hidden')
        this.key += 1
      },
    }
  }
}