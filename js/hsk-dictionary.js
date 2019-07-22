/**
* v3.7.7
*/


(function ($) {
  function main(hsk) {
    const HSKDictionaryApp = {
      entryVue: EntryVue(hsk),
      processHash() {
        const app = this;
        const hash = decodeURI(location.hash).slice(1).split('/')
        const controller = hash[0]
        const method = hash[1]
        const args = hash[2] ? hash[2].split(',') : []
        if (controller === 'view') {
          if (method == 'hsk') {
            if (args.length > 0) {
              const id = args[0]
              app.entryVue.showById(id)
            }
          } else if (method === 'cedict') {
            if (args.length > 0) {
              const text = args[0]
              app.entryVue.showCedict(text)
            }
          }
        } else if (controller === 'saved-words') {
          app.entryVue.view = "saved-words";
        } else if (controller === 'browse') {
          app.entryVue.view = "browse";
        }
        window.scrollTo(0, 0)
      }
    }
    HSKDictionaryApp.processHash()
    window.onhashchange = function() {
      HSKDictionaryApp.processHash()
    }
  }

  HSK.load(function (hsk) {
    // CEDICT.load(function(cedict) {
      main(hsk);
    // })
  });

  // eslint-disable-next-line no-undef
})(jQuery);