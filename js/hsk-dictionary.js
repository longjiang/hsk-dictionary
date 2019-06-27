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

function highlightSentence(entry) {
  var sentence = entry['Example']
  var word = entry['Word']
  var hsk = entry['Book']
  $('.example-sentence-word').html(sentence.replace(word, '<b class="hsk' + hsk + '">' + word + '</b>'))
}

function getCharactersInWord(word, hskDictionary, characterDictionary) {
  characters = []
  word.split('').forEach(function(character) {
    var entry = lookupCharacter(character, characterDictionary)
    entry.animatedSvgLink = animatedSvgLink(character)
    entry.examples = lookupHsk(character, hskDictionary)
    entry.parts = []
    var parts = entry.decomposition.substring(1).split('')
    parts.forEach(function(part){
      partObj = lookupCharacter(part, characterDictionary)
      if (partObj) {
        partObj.animatedSvgLink = animatedSvgLink(part)
        entry.parts.push(partObj)
      } else {
        entry.parts.push({
          character: part,
          animatedSvgLink: animatedSvgLink(part)
        })
      }
    })
    characters.push(entry)
  })
  return characters
}

function animatedSvgLink(char) {
  var charCode = char.charCodeAt(0)
  return '<a href="data/svgs/' + charCode + '.svg">' + char + '</a>'
}

function addAnimatedSvgLinks() {
  var $word = $('.word span')
  var $word = $word.text()
  var chars = word.split('')
  var html = ''
  chars.forEach(function(char) {
    html = html + animatedSvgLink(char)
  })
  $('.word span').html(html)
}

function attachSpeakEventHandler() {
  $('.speak').off().click(function() {
    var text = $(this).attr('data-speak')
    var utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    speechSynthesis.speak(utterance)
  })
}

function removeToneMarks(pinyin) {
  // See https://stackoverflow.com/questions/990904/remove-accents-diacritics-in-a-string-in-javascript
  return pinyin.normalize('NFD').replace(/[\u0300-\u036f]/g, "")
}

function lookupHsk(word, hskDictionary) {
  var results = [];
  hskDictionary.forEach(function(row) {
    if (row['Word'] == word) {
      if (row['OofC'] == '' && row['PN'] == '') {
        results.push(row)
      }
    }
  })
  return results
}

function lookupHskFussy(word, hskDictionary) {
  var results = []
  word = word.toLowerCase()
  hskDictionary.forEach(function(row) {
    if (row['Word'].includes(word) || removeToneMarks(row['Pinyin']).toLowerCase().includes(word) || row['English'].toLowerCase().includes(word)) {
      if (row['OofC'] == '') {
        row.href = '#' + row['Word']
        results.push(row)
      }
    }
  })
  return results
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

function show(word, app) {
  $('#lookup').val(word)
  var entry = lookupHsk(word, app.hskDictionary)[0];
  if (entry) {
    app.entry = entry
    app.characters = getCharactersInWord(word, app.hskDictionary, app.characterDictionary)
  }
  getImage(entry, app)
  location.hash = word
  app.initialized = true
  app.suggestions = []
}

function main(hskDictionary, characterDictionary) {
  var startWord = '固有'
  var entry = lookupHsk(startWord, hskDictionary)[0]
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
      hasImage: true,
      suggestions: [],
      initialized: false
    },
    methods: {
      lookupKeyupEnter() {
        const url = $('.suggestion:first-child').attr('href')
        window.location = url
        $('.suggestion:first-child').get(0).click()
      },
      lookupKeyup(e) {
        app.suggestions = []
        var text = e.target.value
        if (text !== '') {
          var suggestions = lookupHskFussy(text, hskDictionary)
          if (suggestions.length > 0) {
            app.suggestions = suggestions
          } else if (suggestions.length == 0) {
            app.suggestions = [{
              notFound: true,
              Word: text,
              href: "https://en.wiktionary.org/w/index.php?search=" + text
            }]
          }
        }
      },
      suggestionClick(e) {
        app.suggestions = []
      }
    },
    updated: function() {
      if (app.initialized) {
        recalculateExampleColumns(this.entry['Word'])
        highlightSentence(this.entry)
        addAnimatedSvgLinks()
        attachSpeakEventHandler()
      }
    }
  })
  $('.show-more').click(function() {
    $(this).parent().lookupHsk('.character-examples').toggleClass('collapsed')
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