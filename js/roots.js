function main(hskDictionaryData, characterDictionaryData) {
  var characterDictionary = {
    data: characterDictionaryData,
    get: function(character) {
      results = [];
      this.data.forEach(function(row) {
        if (row.character == character) {
          results.push(row);
        }
      });
      return results[0];
    }
  };
  var hskDictionary = {
    data: hskDictionaryData,
    gatherCharacterData: function() {
      var characters = {};
      this.data.forEach(function(row) {
        if (row["OofC"] == "") {
          let charsInWord = row["Word"].split("");
          charsInWord.forEach(function(char, index) {
            if (char !== "…" && char !== "（" && char != "）") {
              characters[char] = characters[char] || {
                character: char,
                data: characterDictionary.get(char),
                first: [],
                middle: [],
                last: [],
                any: []
              };
              characters[char].any.push(row);
              if (index === 0) {
                characters[char].first.push(row);
              } else if (index === charsInWord.length - 1) {
                characters[char].last.push(row);
              } else {
                characters[char].middle.push(row);
              }
            }
          });
        }
      });
      var array = [];
      for (index in characters) {
        array.push(characters[index]);
      }
      return array;
    }
  };
  var characters = hskDictionary.gatherCharacterData();
  var roots = new Vue({
    el: "#roots",
    data: {
      characters: characters,
      character: ""
    },
    methods: {
      sortBy(field) {
        this.characters = this.characters.sort(function(a, b) {
          return b[field].length - a[field].length;
        });
      },
      tableHeadingClick(e) {
        var field = $(e.target).attr("data-field");
        this.sortBy(field);
      },
      countClick(e) {
        $(e.target)
          .next()
          .toggleClass("hidden");
      },
      characterClick() {}
    }
  });
  roots.sortBy("any");
}

Papa.parse("data/HSK 1-6 Vocabulary/HSK Standard Course 1-6-Table 1.csv", {
  download: true,
  header: true,
  complete: function(csv) {
    $.getJSON("data/dictionary.txt").done(function(text) {
      main(csv.data, text);
    });
  }
});
