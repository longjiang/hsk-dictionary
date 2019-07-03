var HSK = {
  _data: [],
  fn: "data/HSK 1-6 Vocabulary/HSK Standard Course 1-6-Table 1.csv",
  f: {
    id: "Id",
    word: "Word",
    pinyin: "Pinyin",
    english: "English",
    hsk: "Book",
    lesson: "Lesson",
    dialog: "Dialog",
    nw: "NW",
    examplePinyin: "Example Pinyin",
    example: "Example",
    exampleTranslation: "Translation"
  },

  load: function(callback) {
    var hsk = this;
    Papa.parse(hsk.fn, {
      download: true,
      header: true,
      complete: function(results) {
        hsk._data = results.data;
        callback(hsk);
      }
    });
  },

  get: function(id) {
    var hsk = this;
    var word = hsk._data.find(function(row) {
      return row[hsk.f.id] === id;
    });
    var result = {};
    for (index in hsk.f) {
      result[index] = word[hsk.f[index]];
    }
    return result;
  },

  lookup: function(word) {
    var hsk = this;
    var result = {};
    hsk._data.forEach(function(row) {
      if (row[hsk.f.word] === word) {
        for (index in hsk.f) {
          result[index] = row[hsk.f[index]];
        }
        return result;
      }
    });
    if (result) {
      return result;
    } else {
      return false;
    }
  },

  list: function() {
    var hsk = this;
    var results = [];
    hsk._data.forEach(function(row) {
      var result = {};
      for (index in hsk.f) {
        result[index] = row[hsk.f[index]];
      }
      results.push(result);
    });
    return results;
  }
};
