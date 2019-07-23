class Character {
  constructor(row, hanzi) {
    for (var index in row) {
      this[index] = row[index];
    }
    this.hanzi = hanzi;
    this.animatedSvgLink = this.hanzi.animatedSvgLink(row.character);
    this.parts = [];
    var parts = this.decomposition.split("").filter(function(char) {
      return ! hanzi.isIdeographicDescCharacter(char)
    });
    var character = this;
    parts.forEach(function (part) {
      var partObj = character.hanzi.lookup(part);
      if (partObj) {
        partObj.animatedSvgLink = character.hanzi.animatedSvgLink(part);
      } else {
        partObj = {
          character: part
        };
      }
      partObj.animatedSvgLink = character.hanzi.animatedSvgLink(part);
      character.parts.push(partObj);
    });
  }
}

/**
 * The library associated with the character information in data/dictionary.txt provided by Make Me a Hanzi (https://github.com/skishore/makemeahanzi) project.
 */
var Hanzi = {
  _hanziData: [],
  _makeMeAHanziDictionaryTxt: "data/hanzi.json",
  load: function (callback) {
    var hanzi = this;
    jQuery.getJSON(hanzi._makeMeAHanziDictionaryTxt).done(function (data) {
      hanzi._hanziData = data;
      callback(hanzi);
    });
  },

  lookup: function (char) {
    var hanzi = this;
    var character = false;
    this._hanziData.forEach(function (row) {
      if (row.character == char) {
        character = new Character(row, hanzi);
        return;
      }
    });
    return character;
  },

  chineseOnly: function (string) {
    return string.replace(/[\u4E00-\u9FFF]+/, "") === "";
  },

  searchByRadical: function (radical) {
    var rows = [];
    var hanzi = this;
    // Filter out description characters and "？ - other elements"
    if (hanzi.chineseOnly(radical)) {
      rows = hanzi._hanziData.filter(function (row) {
        return row.decomposition.includes(radical) || row.character.includes(radical);
      });
    }
    return rows;
  },

  getCharactersInWord: function (word) {
    var characters = [];
    var hanzi = this;
    word.split("").forEach(function (char) {
      var character = hanzi.lookup(char);
      if (character) {
        // new character
        characters.push(character);
      }
    });
    return characters;
  },

  animatedSvgUrl: function (char) {
    var charCode = char.charCodeAt(0);
    return "data/svgs/" + charCode + ".svg";
  },

  animatedSvgLink: function (char) {
    return (
      '<a href="' +
      this.animatedSvgUrl(char) +
      '" target="_blank">' +
      char +
      "</a>"
    );
  },

  isIdeographicDescCharacter(char) {
    if (char.replace(/[\u2ff0-\u2ffe]/, "") === "") {
      return true;
    } else {
      return false;
    }
  }
};

var HSK = {
  hanzi: undefined, // The Hanzi library, loaded async in the constructor
  _standardCourseData: [],
  _standardCourseCSV:
    "data/hsk.csv",
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

  /**
   * Loads the data and returns this via a callback.
   * @param {function} callback A callback function that takes the HSK library object as an argument.
   */
  load: function (callback) {
    var hsk = this;
    const loader = new Loader(['hanzi.json', 'hsk.csv'], function() {
      callback(hsk);
    })
    Hanzi.load(function (hanzi) {
      hsk.hanzi = hanzi;
      loader.loaded('hanzi.json')
    });
    Papa.parse(hsk._standardCourseCSV, {
      download: true,
      header: true,
      complete: function (results) {
        results.data.forEach(function (row) {
          var result = {};
          for (var index in hsk._standardCourseCSVFields) {
            result[index] = row[hsk._standardCourseCSVFields[index]];
          }
          hsk._standardCourseData.push(result);
        });
        loader.loaded('hsk.csv')
      }
    });
  },

  /**
   * Get a word by id
   * @param {int} id The id of the word
   */

  get: function (id) {
    var word = this._standardCourseData.find(function (row) {
      return parseInt(row.id) === parseInt(id);
    });
    return word;
  },

  count: function () {
    return this._standardCourseData.length;
  },

  lookup: function (word, oofc = 'include') {
    var hsk = this;
    var results = [];
    hsk._standardCourseData.forEach(function (row) {
      if (row.word === word) {
        if (oofc === 'include' || row.oofc === '') {
          results.push(row);
        }
      }
    });
    return results;
  },

  removeToneMarks: function (pinyin) {
    // See https://stackoverflow.com/questions/990904/remove-accents-diacritics-in-a-string-in-javascript
    return pinyin.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  },

  lookupFuzzy: function (word) {
    var results = [];
    word = word.toLowerCase();
    var hsk = this;
    this._standardCourseData.forEach(function (row) {
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

  getFirstHSKWordWithCharacter: function (char) {
    var words = this._standardCourseData.filter(function (row) {
      return row.word.includes(char) && row.oofc == "" && row.pn == "";
    });
    if (words[0]) {
      return words[0];
    }
  },

  getHSKCharactersByRadical: function (radical) {
    var hsk = this;
    var characters = this.hanzi.searchByRadical(radical);
    var hskCharacters = [];
    characters.forEach(function (character) {
      var firstWord = hsk.getFirstHSKWordWithCharacter(character.character);
      if (firstWord) {
        character.firstHSKWord = firstWord;
        hskCharacters.push(character);
      }
    });
    return hskCharacters.sort(function (a, b) {
      return a.firstHSKWord.book - b.firstHSKWord.book;
    });
  },

  simplifyEnglish: function (english) {
    return english
      .replace("/", ", ")
      .replace(/, .*/, "")
      .replace(/\(.*\)/, "")
      .replace("to ", "")
      .replace(".", "");
  },

  list: function () {
    var hsk = this;
    return hsk._standardCourseData;
  },

  listWhere: function (filterFunction) {
    return this._standardCourseData.filter(filterFunction);
  },

  listByBook: function (book) {
    var getFilterFunction = function (book) {
      return function (row) {
        return row.book == book;
      };
    };
    return this.listWhere(getFilterFunction(book));
  },

  listByBookLesson: function (book, lesson) {
    var getFilterFunction = function (book, lesson) {
      return function (row) {
        return row.book == book && row.lesson == lesson;
      };
    };
    return this.listWhere(getFilterFunction(book, lesson));
  },

  listBookLessonDialog: function (book, lesson, dialog) {
    var getFilterFunction = function (book, lesson, dialog) {
      return function (row) {
        return row.book == book && row.lesson == lesson && row.dialog == dialog;
      };
    };
    return this.listWhere(getFilterFunction(book, lesson, dialog));
  },

  first: function () {
    const min = Math.min(...this._standardCourseData.map(function(word) {
      return word.id
    }))
    return min
  },

  last: function () {
    const max = Math.max(...this._standardCourseData.map(function(word) {
      return word.id
    }))
    return max
  },

  hasPrevious: function (id) {
    return id > this.first();
  },

  hasNext: function (id) {
    return id < this.last();
  },

  compileBooks: function () {
    // https://www.consolelog.io/group-by-in-javascript/
    Array.prototype.groupBy = function (prop) {
      return this.reduce(function (groups, item) {
        const val = item[prop];
        groups[val] = groups[val] || [];
        groups[val].push(item);
        return groups;
      }, {});
    };
    var books = this._standardCourseData.groupBy("book");
    for (var book in books) {
      books[book] = books[book].groupBy("lesson");
      for (var lesson in books[book]) {
        books[book][lesson] = books[book][lesson].groupBy("dialog");
      }
    }
    return books;
  }
};
