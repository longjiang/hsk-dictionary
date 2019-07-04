var HSK = {
  _standardCourseData: [],
  _characterData: [],
  _standardCourseCSV:
    "data/HSK 1-6 Vocabulary/HSK Standard Course 1-6-Table 1.csv",
  _standardCourseCSVFields: {
    id: "Id",
    word: "Word",
    pinyin: "Pinyin",
    english: "English",
    book: "Book",
    lesson: "Lesson",
    dialog: "Dialog",
    nw: "NW",
    examplePinyin: "Example Pinyin",
    example: "Example",
    exampleTranslation: "Translation",
    oofc: "OofC",
    pn: "PN",
    songLyrics: "Song Lyrics",
    songYouTube: "Song YouTube"
  },

  count: function() {
    return this._standardCourseData.length;
  },

  load: function(callback) {
    var hsk = this;
    $.getJSON("data/dictionary.txt").done(function(data) {
      hsk._characterData = data;
      Papa.parse(hsk._standardCourseCSV, {
        download: true,
        header: true,
        complete: function(results) {
          results.data.forEach(function(row) {
            var result = {};
            for (index in hsk._standardCourseCSVFields) {
              result[index] = row[hsk._standardCourseCSVFields[index]];
            }
            hsk._standardCourseData.push(result);
          });
          callback(hsk);
        }
      });
    });
  },

  get: function(id) {
    var word = this._standardCourseData.find(function(row) {
      return parseInt(row.id) === parseInt(id);
    });
    return word;
  },

  lookup: function(word) {
    var hsk = this;
    var results = [];
    hsk._standardCourseData.forEach(function(row) {
      if (row.word === word) {
        results.push(row);
      }
    });
    return results;
  },

  removeToneMarks: function(pinyin) {
    // See https://stackoverflow.com/questions/990904/remove-accents-diacritics-in-a-string-in-javascript
    return pinyin.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  },

  lookupHskFussy: function(word) {
    var results = [];
    word = word.toLowerCase();
    var hsk = this;
    this._standardCourseData.forEach(function(row) {
      if (
        row.word.includes(word) ||
        hsk
          .removeToneMarks(row.pinyin)
          .toLowerCase()
          .includes(word) ||
        row.english.toLowerCase().includes(word)
      ) {
        if (row.oofc == "") {
          results.push(row);
        }
      }
    });
    return results;
  },

  getCharactersInWord: function(word) {
    characters = [];
    hsk = this;
    word.split("").forEach(function(character) {
      var entry = hsk.lookupCharacter(character);
      entry.animatedSvgLink = hsk.animatedSvgLink(character);
      entry.examples = hsk.lookupHskFussy(character);
      entry.parts = [];
      var parts = entry.decomposition.substring(1).split("");
      parts.forEach(function(part) {
        partObj = hsk.lookupCharacter(part);
        if (partObj) {
          partObj.animatedSvgLink = hsk.animatedSvgLink(part);
          entry.parts.push(partObj);
        } else {
          entry.parts.push({
            character: part,
            animatedSvgLink: hsk.animatedSvgLink(part)
          });
        }
      });
      characters.push(entry);
    });
    return characters;
  },

  simplifyEnglish: function(english) {
    return english
      .replace("/", ", ")
      .replace(/, .*/, "")
      .replace(/\(.*\)/, "")
      .replace("to ", "")
      .replace(".", "");
  },

  animatedSvgLink: function(char) {
    var charCode = char.charCodeAt(0);
    return '<a href="data/svgs/' + charCode + '.svg">' + char + "</a>";
  },

  lookupCharacter: function(character) {
    result = false;
    this._characterData.forEach(function(row) {
      if (row.character == character) {
        result = row;
        return;
      }
    });
    return result;
  },

  list: function() {
    var hsk = this;
    return hsk._standardCourseData;
  },

  listWhere: function(filterFunction) {
    return this._standardCourseData.filter(filterFunction);
  },

  listByBook: function(book) {
    var getFilterFunction = function(book) {
      return function(row) {
        return row.book == book;
      };
    };
    return this.listWhere(getFilterFunction(book));
  },

  listByBookLesson: function(book, lesson) {
    var getFilterFunction = function(book, lesson) {
      return function(row) {
        return row.book == book && row.lesson == lesson;
      };
    };
    return this.listWhere(getFilterFunction(book, lesson));
  },

  listBookLessonDialog: function(book, lesson, dialog) {
    var getFilterFunction = function(book, lesson, dialog) {
      return function(row) {
        return row.book == book && row.lesson == lesson && row.dialog == dialog;
      };
    };
    return this.listWhere(getFilterFunction(book, lesson, dialog));
  },

  compileBooks: function() {
    // https://www.consolelog.io/group-by-in-javascript/
    Array.prototype.groupBy = function(prop) {
      return this.reduce(function(groups, item) {
        const val = item[prop];
        groups[val] = groups[val] || [];
        groups[val].push(item);
        return groups;
      }, {});
    };
    books = this._standardCourseData.groupBy("book");
    for (var book in books) {
      books[book] = books[book].groupBy("lesson");
      for (var lesson in books[book]) {
        books[book][lesson] = books[book][lesson].groupBy("dialog");
      }
    }
    return books;
  }
};
