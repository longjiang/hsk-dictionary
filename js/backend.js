var json = [];

var concatVue = new Vue({
  el: "#concat",
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
        var time = 1000;
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
          setTimeout(function() {
            searchYouTubeByProxy(
              file.artist + " 《" + file.title + "》",
              function(ids) {
                if (ids && ids.length > 0) {
                  file.youtube = ids;
                }
              }
            );
          }, time);
          time += Math.floor(Math.random() * 3000);
        });
      };
    }
  }
});

var auditVue = new Vue({
  el: "#audit",
  data: {
    audited: false,
    youtubeCount: 0,
    totalCount: 0,
    wordsWithNoSong: [],
    lrcs: [],
    words: []
  },
  methods: {
    auditeButtonClick: function() {
      $.getJSON("data/lrcs-compiled.json").done(function(data) {
        auditVue.youtubeCount = 0;
        auditVue.totalCount = data.length;
        data.forEach(function(song) {
          if (song.youtube) {
            auditVue.youtubeCount++;
          }
        });
        auditVue.lrcs = data;
        analyzeWords(data);
        auditVue.audited = true;
      });
    },
    tableHeadingClick(e) {
      this.words = this.words.sort(function(a, b) {
        return b.matches.length - a.matches.length;
      });
    }
  },
  updated: function() {
    // $(".datatable").DataTable();
  }
});

function analyzeWords(lrcs) {
  Papa.parse(
    "data/HSK 1-6 Vocabulary/Official Word List-Source: http:  www.chinesetest.cn userfiles file HSK HSK-2012.xls.csv",
    {
      download: true,
      header: true,
      complete: function(results) {
        var words = results.data;
        words.forEach(function(word) {
          word.matches = findWordInLrcs(word.word, lrcs);
          if (word.word == "今天") {
            findWordInLrcs("今天", lrcs);
          }
        });
        auditVue.words = words;
        auditVue.words.forEach(function(word) {
          if (word.matches.length == 0) {
            auditVue.wordsWithNoSong.push(word);
          }
        });
      }
    }
  );
}

function findWordInLrcs(word, lrcs) {
  results = [];
  for (var i = 0; i < lrcs.length; i++) {
    var song = lrcs[i];
    if (Array.isArray(song.content) && song.youtube) {
      // song.content.splice(0, 1); // Reject first four lines
      // song.content.splice(song.content.length - 1, 1); // Reject last four lines
      song.content.forEach(function(line) {
        if (line.line.includes(word)) {
          results[i] = {
            starttime: line.starttime,
            line: line.line,
            artist: song.artist,
            title: song.title,
            youtube: song.youtube
          };
        }
      });
    }
  }
  results = results.filter(function(item) {
    return item !== undefined;
  });
  return results;
}

function searchYouTubeThen(searchTerm, callback) {
  gapi.client.setApiKey("AIzaSyCD_lv7OJzuMu4fwv5N_qi4NdIw8U8gVWM");
  gapi.client.load("youtube", "v3", function() {
    var request = gapi.client.youtube.search.list({
      part: "snippet",
      type: "video",
      q: searchTerm
    });
    request.execute(callback);
  });
}

function searchYouTubeByProxy(searchTerm, callback) {
  $.ajax(
    "proxy.php?" + "https://www.youtube.com/results?search_query=" + searchTerm
  ).done(function(response) {
    var videoIds = [];
    $html = $(response);
    $html.find(".item-section li .yt-uix-tile-link").each(function() {
      videoIds.push(
        $(this)
          .attr("href")
          .replace("/watch?v=", "")
      );
    });
    callback(videoIds);
  });
}
