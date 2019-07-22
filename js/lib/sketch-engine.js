const SketchEngine = {
  wsketch(term, callback) {
    $.getJSON(
      `sketch-engine-proxy.php?https://api.sketchengine.eu/bonito/run.cgi/wsketch?corpname=preloaded/zhtenten_lenoch&lemma=${term}`,
      function (response) {
        callback(response);
      }
    );
  }
};