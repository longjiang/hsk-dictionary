var json = [];

var vue = new Vue({
  el: "#backend",
  data: {},
  methods: {
    concatenateButtonClick: function(e) {
      const fileList = $("#lrc-file-input").get(0).files;
      for (var i = 0; i < fileList.length; i++) {
        var file = fileList[i];
        var reader = new FileReader();
        reader.onload = (function(aFile) {
          return function(e) {
            var content = e.target.result;
            var fileTitle = aFile.name.replace(".lrc", "");
            var split = fileTitle.split(" - ");
            var artist = split[0];
            var title = split[1];
            json.push({
              filename: aFile.name,
              artist: artist,
              title: title,
              content: content
            });
          };
        })(file);
        reader.readAsText(fileList[i], "gb2312");
      }
      reader.onloadend = function() {
        json.forEach(function(file, index) {
          var lyricer = new Lyricer();
          lyricer.setLrc(file.content);
          if (lyricer.tags.ar) {
            file.artist = lyricer.tags.ar;
          }
          if (lyricer.tags.ti) {
            file.title = lyricer.tags.ti;
          }
          file.content = lyricer.lrc;
          searchYouTubeThen(file.artist + " 《" + file.title + "》", function(
            response
          ) {
            if (response.items && response.items.length > 0) {
              response.items.forEach(function(item) {
                file.youtube = file.youtube || [];
                file.youtube.push(item.id.videoId);
              });
            }
          });
        });
        console.log(json);
      };
    }
  }
});

function searchYouTubeThen(searchTerm, callback) {
  gapi.client.setApiKey("AIzaSyDkooB1uWHG72DeDSHrMnPeSEqbeEKWnSU");
  gapi.client.load("youtube", "v3", function() {
    var request = gapi.client.youtube.search.list({
      part: "snippet",
      type: "video",
      q: searchTerm
    });
    request.execute(callback);
  });
}
