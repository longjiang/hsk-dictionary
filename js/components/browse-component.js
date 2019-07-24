function BrowseComponent(hsk) {
  return {
    template: '#browse-template',
    data() {
      return {
        books: hsk.compileBooks(),
        browseKey: 0 // used to force re-render this component
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
        this.browseKey += 1
        if (hskDictionaryApp.$refs.search) {
          hskDictionaryApp.$refs.search.update()
        }
      },
      countWordsInLesson(lesson) {
        var count = 0;
        for (var index in lesson) {
          var dialog = lesson[index];
          count += dialog.length;
        }
        return count;
      },
      bookClick(e) {
        var book = $(e.target)
          .parents("[data-book]")
          .attr("data-book");
        this.wordList = hsk.listByBook(book);
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
        this.wordList = hsk.listByBookLesson(book, lesson);
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
        this.wordList = hsk.listBookLessonDialog(book, lesson, dialog);
        $target.next("ul").toggleClass("collapsed");
      },
    }
  }
}