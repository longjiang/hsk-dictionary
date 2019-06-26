function find(word, dictionary) {
  var results = [];
  dictionary.forEach(function(row) {
    if (row['Word'].includes(word)) {
      results.push(row)
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
      hasImage: true,
      methods: {
        lookup: function(word) {
          this.entry = find(word, dictionary)[0]
          
        }
      }
    }
  })
  $('.show-more').click(function() {
    $(this).parent().find('.character-examples').toggleClass('collapsed')
  })
}

Papa.parse('data/HSK Standard Course 1-6-Table 1.csv', {
  download: true,
  header: true,
  complete: function(results) {
    main(results.data)
  }
})