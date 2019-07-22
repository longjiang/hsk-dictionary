const SketchEngine = {
  wsketch(term, callback) {
    $.getJSON(
      `sketch-engine-proxy.php?https://api.sketchengine.eu/bonito/run.cgi/wsketch?corpname=preloaded/zhtenten_lenoch&lemma=${term}`,
      function (response) {
        if (response.Gramrels && response.Gramrels.length > 0) {
          response.Gramrels.forEach(function(Gramrel)  {
            Gramrel.Words = Gramrel.Words.filter(function(Word) {
              return Word.cm !== ""
            })
          })
        }
        callback(response);
      }
    );
  }
};