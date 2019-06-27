function find(word, dictionary) {
  var results = [];
  dictionary.forEach(function(row) {
    if (row['Word'].includes(word)) {
      if (row['OofC'] == '' && row['PN'] == '') {
        results.push(row)
      }
    }
  })
  return results
}

function getImage(entry, app) {
  $.ajax('img/words/' + entry['Word'] + '.jpg').done(function() {
    app.image = 'img/words/' + entry['Word'] + '.jpg'
    app.hasImage = true
  }).fail(function() {
    app.unsplashImage = 'https://source.unsplash.com/300x300/?' + entry['English']
    app.hasImage = false
  })
}

function recalculateExampleColumns(word) {
  var $div = $('.character-example-wrapper > div')
  var span = 12 / word.length;
  $div.removeClass()
  $div.addClass('col-md-' + span)
}

function show(word, app) {
  $('#lookup').val(word)
  app.lookup()
}

function highlightSentence(entry) {
  var sentence = entry['Example']
  var word = entry['Word']
  var hsk = entry['Book']
  $('.example-sentence-word').html(sentence.replace(word, '<b class="hsk' + hsk + '">' + word + '</b>'))
}

function lookupCharacter(character, characterDictionary) {
  results = []
  characterDictionary.forEach(function(row) {
    if (row.character == character) {
      results.push(row)
    }
  })
  return results[0]
}

function getCharactersInWord(word, hskDictionary, characterDictionary) {
  characters = []
  word.split('').forEach(function(character) {
    var entry = lookupCharacter(character, characterDictionary)
    entry.examples = find(character, hskDictionary)
    entry.parts = []
    var parts = entry.decomposition.substring(1).split('')
    parts.forEach(function(part){
      partObj = lookupCharacter(part, characterDictionary)
      if (partObj) {
        entry.parts.push(partObj)
      } else {
        entry.parts.push({
          character: part
        })
      }
    })
    characters.push(entry)
  })
  return characters
}

function main(hskDictionary, characterDictionary) {
  var startWord = '固有'
  var entry = find(startWord, hskDictionary)[0]
  var characters = getCharactersInWord(startWord, hskDictionary, characterDictionary)
  var app = new Vue({
    el: '#hsk-dictionary',
    data: {
      character: {},
      hskDictionary: hskDictionary,
      characterDictionary: characterDictionary,
      entry: entry,
      characters: characters,
      image: 'img/words/' + entry['Word'] + '.jpg',
      unsplashImage: 'https://source.unsplash.com/300x300/?' + entry['English'],
      hasImage: true
    },
    methods: {
      lookup() {
        var word = $('#lookup').val()
        var entry = find(word, this.hskDictionary)[0];
        if (entry) {
          this.entry = entry
          this.characters = getCharactersInWord(word, hskDictionary, characterDictionary)
        }
        getImage(entry, app)
        location.hash = word
      }
    },
    updated: function() {
      recalculateExampleColumns(this.entry['Word'])
      highlightSentence(this.entry)
    }
  })
  $('.show-more').click(function() {
    $(this).parent().find('.character-examples').toggleClass('collapsed')
  })
  window.onhashchange = function() {
    word = decodeURI(location.hash.substr(1));
    show(word, app)
  }
  if (location.hash && location.hash.length > 1) {
    word = decodeURI(location.hash.substr(1));
    show(word, app)
  }
}




Papa.parse('data/HSK 1-6 Vocabulary/HSK Standard Course 1-6-Table 1.csv', {
  download: true,
  header: true,
  complete: function(csv) {
    $.getJSON('data/dictionary.txt').done(function(characterDictionary) {
      main(csv.data, characterDictionary)
    })
  }
})