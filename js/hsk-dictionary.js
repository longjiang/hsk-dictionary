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

function findCharacterExamples(word, dictionary) {
  characterExamples = []
  word.split('').forEach(function(character) {
    characterExamples.push({
      character: character,
      examples: find(character, dictionary)
    })
  })
  return characterExamples;
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
  console.log(entry)
  var sentence = entry['Example']
  var word = entry['Word']
  var hsk = entry['Book']
  $('.example-sentence-word').html(sentence.replace(word, '<b class="hsk' + hsk + '">' + word + '</b>'))
}

function main(dictionary) {
  var startWord = '固有'
  var entry = find(startWord, dictionary)[0]
  var characterExamples = findCharacterExamples(startWord, dictionary)
  var app = new Vue({
    el: '#hsk-dictionary',
    data: {
      dictionary: dictionary,
      entry: entry,
      characterExamples: characterExamples,
      image: 'img/words/' + entry['Word'] + '.jpg',
      unsplashImage: 'https://source.unsplash.com/300x300/?' + entry['English'],
      hasImage: true
    },
    methods: {
      lookup() {
        var word = $('#lookup').val()
        var entry = find(word, this.dictionary)[0];
        if (entry) {
          this.entry = entry
          this.characterExamples = findCharacterExamples(word, dictionary)
        }
        getImage(entry, app)
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

Papa.parse('data/HSK Standard Course 1-6-Table 1.csv', {
  download: true,
  header: true,
  complete: function(results) {
    main(results.data)
  }
})