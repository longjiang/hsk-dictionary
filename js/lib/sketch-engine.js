const SketchEngine = {
  corpname: 'preloaded/zhtenten17_simplified_stf2',
  wsketch(term, callback) {
    $.getJSON(
      `sketch-engine-proxy.php?https://api.sketchengine.eu/bonito/run.cgi/wsketch?corpname=${this.corpname}&lemma=${term}`,
      function (response) {
        if (response.Gramrels && response.Gramrels.length > 0) {
          response.Gramrels.forEach(function (Gramrel) {
            Gramrel.Words = Gramrel.Words.filter(function (Word) {
              return Word.cm !== ""
            })
            for (Word of Gramrel.Words) {
              Word.cm = Word.cm.replace(/-\w( ?)/gi, '')
            }
          })
        }
        callback(response);
      }
    );
  },
  concordance(term, callback) {
    $.post(
      `sketch-engine-proxy.php?https://app.sketchengine.eu/bonito/run.cgi/concordance?corpname=${this.corpname}`,
      {
        json: `{"lpos":"","wpos":"","default_attr":"word","attrs":"word","refs":"=doc.website","ctxattrs":"word","attr_allpos":"all","usesubcorp":"","viewmode":"kwic","cup_hl":"q","cup_err":"true","cup_corr":"","cup_err_code":"true","structs":"s,g","gdex_enabled":0,"fromp":1,"pagesize":1000,"concordance_query":[{"queryselector":"iqueryrow","iquery":"${term}"}],"kwicleftctx":"100#","kwicrightctx":"100#"}`
      },
      function (response) {
        const data = JSON.parse(response);
        var result = []
        data.Lines.slice(0, 500).forEach(function (Line) {
          var line = Line.Left.map(function (item) {
            return item ? item.str : ''
          }).join('') + Line.Kwic[0].str + Line.Right.map(function (item) {
            return item ? item.str : ''
          }).join('')
          line = '。' + line + '。';
          line = line.replace(new RegExp(`.*[。！？“]([^。！？”]*${term}[^。！？”]*[。！？”]).*`, 'gi'), '$1')
          line = line.replace(/[”]$/, '');
          if (line.length > term.length + 4 && line.match(/[。！？]$/) && !line.match(/，。$/)) {
            result.push(line)
          }
        })
        result = result.sort(function (a, b) {
          return a.length - b.length;
        })
        callback(Helper.unique(result));
      }
    );
  },
  thesaurus(term, callback) {
    $.post(
      `sketch-engine-proxy.php?https://app.sketchengine.eu/bonito/run.cgi/thes?corpname=${this.corpname}`,
      {
        lemma: term,
        lpos: '',
        clusteritems: 0,
        maxthesitems: 100,
        minthesscore: 0,
        minsim: 0.3
      },
      function (response) {
        const data = JSON.parse(response);
        console.log(data)
        callback(data)
      }
    )
  },
  mistakes(term, callback) {
    $.post(
      `sketch-engine-proxy.php?https://app.sketchengine.eu/bonito/run.cgi/concordance?corpname=preloaded/guangwai`,
      {
        json: `{"lpos":"","wpos":"","default_attr":"word","attrs":"word","refs":"=text.id","ctxattrs":"word","attr_allpos":"all","usesubcorp":"","viewmode":"kwic","cup_hl":"q","cup_err":"","cup_corr":"","cup_err_code":"","structs":"s,g","gdex_enabled":0,"fromp":1,"pagesize":50,"concordance_query":[{"queryselector":"iqueryrow","iquery":"${term}","sca_err.level":["col","form","mean","orth","punct"],"sca_err.type":["anom","incl","omit","wo"]}],"kwicleftctx":"100#","kwicrightctx":"100#"}`
      },
      function (response) {
        const data = JSON.parse(response);
        console.log(data)
        let results = []
        for (let Line of data.Lines) {
          const left = Line.Left.map(function (item) {
            return item.str || item.strc
          }).join('').replace(/.*<s>([^<s>]*?)$/, '$1')
          const right = Line.Right.map(function (item) {
            return item.str || item.strc
          }).join('').replace(/^([^</s>]*)<\/s>.*/, '$1')
          const country = Line.ref.replace(/^[^_]*_[^_]*_[^_]*_[^_]*_([^_]*).*/g, '$1')
          results.push({
            left: left,
            right: right,
            text: left + term + right,
            country: Helper.country(country),
            ref: Line.ref
          })
        }
        results = results.sort(function (a, b) {
          return a.text.length - b.text.length
        })
        callback(results)
      }
    )
  }
};