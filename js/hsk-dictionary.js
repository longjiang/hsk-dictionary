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
    entry.examples = lookupHskFussy(character, hskDictionary)
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
  hskDictionary.forEach(function(row, index) {
    if (row['Word'] == word) {
      row.index = index
      results.push(row)
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

function displayEntry(entry, app) {
  app.entry = entry
  app.index = entry.index
  app.characters = getCharactersInWord(word, app.hskDictionary, app.characterDictionary)
  getImage(entry, app)
  location.hash = entry['Word']
  app.initialized = true
  app.suggestions = []
  $('#lookup').val(entry['Word'])
}

function showIndex(index, app) {
  if (index > 0 && index < app.hskDictionary.length) {
    var entry = app.hskDictionary[index]
    if (entry) {
      entry.index = index
      displayEntry(entry, app)
    }
  }
}

function showWord(word, app) {
  var entry = lookupHsk(word, app.hskDictionary)[0];
  if (entry) {
    displayEntry(entry, app)
  }
}

function compileBooks(hskDictionary) {
  // https://www.consolelog.io/group-by-in-javascript/
  Array.prototype.groupBy = function(prop) {
    return this.reduce(function(groups, item) {
      const val = item[prop]
      groups[val] = groups[val] || []
      groups[val].push(item)
      return groups
    }, {})
  }
  books = hskDictionary.groupBy('Book')
  for(var book in books) {
    books[book] = books[book].groupBy('Lesson')
    for(var lesson in books[book]) {
      books[book][lesson] = books[book][lesson].groupBy('Dialog')
    }
  }
  return books
}

function filterBook(book, hskDictionary) {
  var getFilterFunction = function(book) {
    return function(row) {
      return row['Book'] == book
    }
  }
  return hskDictionary.filter(getFilterFunction(book))
}

function filterLesson(book, lesson, hskDictionary) {
  var getFilterFunction = function(book, lesson) {
    return function(row) {
      return row['Book'] == book && row['Lesson'] == lesson
    }
  }
  return hskDictionary.filter(getFilterFunction(book, lesson))
}

function filterDialog(book, lesson, dialog, hskDictionary) {
  var getFilterFunction = function(book, lesson, dialog) {
    return function(row) {
      return row['Book'] == book && row['Lesson'] == lesson && row['Dialog'] == dialog
    }
  }
  return hskDictionary.filter(getFilterFunction(book, lesson, dialog))
}

function filterOofC(hskDictionary) {
  return hskDictionary.filter(function(row) {
    return row['OofC'] === ''
  })
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
      wordList: filterOofC(hskDictionary),
      characterDictionary: characterDictionary,
      entry: entry,
      books: compileBooks(hskDictionary),
      characters: characters,
      index: entry.index,
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
      lookupButtonClick() {
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
              text: text,
              href: "https://en.wiktionary.org/w/index.php?search=" + text
            }]
          }
        }
      },
      showMoreClick(e) {
        $button = $(e.currentTarget);
        $button.prev().toggleClass('collapsed')
        $button.toggleClass('collapsed')
      },
      backToBrowse() {
        location.hash = ""
      },
      previousClick(e) {
        showIndex(app.index - 1, app)
      },
      nextClick(e) {
        showIndex(app.index + 1, app)
      },
      suggestionClick(e) {
        app.suggestions = []
      },
      toggleCollapsed(e) {
        $(e.target).next('ul').toggleClass('collapsed')
      },
      bookClick(e) {
        var book = $(e.target).parents('[data-book]').attr('data-book')
        this.wordList = filterBook(book, this.hskDictionary)
        $(e.target).next('ul').toggleClass('collapsed')
      },
      lessonClick(e) {
        var lesson = $(e.target).parents('[data-lesson]').attr('data-lesson')
        var book = $(e.target).parents('[data-book]').attr('data-book')
        this.wordList = filterLesson(book, lesson, this.hskDictionary)
        $(e.target).next('ul').toggleClass('collapsed')
      },
      dialogClick(e) {
        var dialog = $(e.target).parents('[data-dialog]').attr('data-dialog')
        var lesson = $(e.target).parents('[data-lesson]').attr('data-lesson')
        var book = $(e.target).parents('[data-book]').attr('data-book')
        this.wordList = filterDialog(book, lesson, dialog, this.hskDictionary)
        $(e.target).next('ul').toggleClass('collapsed')
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
  window.onhashchange = function() {
    word = decodeURI(location.hash.substr(1));
    if (word) {
      showWord(word, app)
    } else {
      app.initialized = false
    }
    window.scrollTo(0,0)
  }
  if (location.hash && location.hash.length > 1) {
    word = decodeURI(location.hash.substr(1));
    showWord(word, app)
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