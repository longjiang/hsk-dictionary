var t = []
var CEDICT = {
  _data: [],
  load(callback) {
    const cedict = this
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        cedict.loadData(this.responseText, callback);
      }
    };
    xhttp.open("GET", 'data/cedict_ts.u8', true);
    xhttp.send();
  },
  loadData(cedictText, callback) {
    const cedict = this
    cedictText.split("\n").forEach(function(line){
      const matches = line.match(/^([^\s]+) ([^\s]+) \[(.+)\] \/(.*)\//)
      if (matches) {
        var row = {
          simplified: matches[2],
          traditional: matches[1],
          pinyin: cedict.parsePinyin(matches[3]),
          definitions: matches[4].split('/'),
          search: matches[1] + ' ' + matches[2] + ' ' + matches[3].toLowerCase().replace(/[\s\d]/gi, '') + ' ' + matches[4]
        }
        row.definitions.forEach(function(definition, index){
          definitionObj = {
            type: "definition",
            text: definition.replace(/\[(.*)\]/, function(match, p1) {
              return ' (' + cedict.parsePinyin(p1) + ')'
            }).replace(/([^\s]+)\|([^\s]+)/, '$2')
          }
          var m = definition.match(/variant of (.*)/);
          if (m) {
            definitionObj.type = "variant"
            definitionObj.variant = cedict.parseWord(m[1])
            definitionObj.text = `variant of ${definitionObj.variant.simplified} (${definitionObj.variant.pinyin})`
          }
          m = definition.match(/see (.*)/);
          if (m) {
            definitionObj.type = "reference"
            definitionObj.variant = cedict.parseWord(m[1])
            definitionObj.text = `see ${definitionObj.variant.simplified} (${definitionObj.variant.pinyin})`
          }
          m = definition.match(/CL:(.*)/);
          if (m) {
            let measureWords = []
            for (let item of m[1].split(',')) {
              const mw = cedict.parseWord(item)
              if (mw.simplified !== '个') {
                measureWords.push(mw)
              }
            }
            if (measureWords.length > 0) {
              row.measureWords = measureWords
            }
            row.definitions.splice(index, 1) // Remove CL:  definition
          } else {
            row.definitions[index] = definitionObj
          }
        })
        cedict._data.push(row)
      }
    })
    cedict._data = cedict._data.sort(function(a, b) {
      return b.simplified.length - a.simplified.length;
    })
    callback(cedict)
  },
  subdict(data) {
    let newDict = Object.assign({}, this)
    return Object.assign(newDict, {_data: data})
  },
  subdictFromText(text) {
    return this.subdict(this._data.filter(function(row){
      return text.includes(row.simplified) || text.includes(row.traditional)
    }))
  },
  /* Returns the longest word in the dictionary that is inside `text` */
  longest(text) {
    t.push(text)
    var matchedText = undefined
    for (let [i, row] of this._data.entries()) {
      if (text.includes(row.simplified)) {
        matchedText = row.simplified
        break
      } else if (text.includes(row.traditional)) {
        matchedText = row.traditional
        break
      }
    }
    const result = {
      text: matchedText,
      matches: this.lookup(matchedText)
    }
    return result;
  },
  parsePinyin(pinyin) {
    return pinyinify(pinyin.replace(/u:/gi, 'ü')) // use the pinyinify library to parse tones
    .replace(/\d/g, '') // pinyinify does not handle 'r5', we remove all digits
  },
  // text = 涎[xian2]
  // text = 協|协[xie2]
  parseWord(text) {
    var m = text.match(/(.*)\[(.*)\]/);
    if (!m) {
      m = [text, text, '']
    }
    const c = m[1].split('|')
    const cedict = this
    return {
      simplified: c.length > 1 ? c[1] : c[0], // 涎, 协
      traditional: c[0], // 涎, 協
      pinyin: cedict.parsePinyin(m[2])
    }
  },
  lookup(text) {
    const candidates = this._data.filter(function(row) {
      return row.traditional === text || row.simplified === text
    }).sort(function(a, b) {
      return b.search.length - a.search.length // Longer search string = longer definition = likely more common word
    })
    return candidates
  },
  lookupFuzzy(text) {
    text = text.toLowerCase().replace(' ', '');
    return this._data.filter(function(row) {
      return row.search.includes(text)
    }).sort(function(a, b) {
      return a.simplified.length - b.simplified.length
    })
  }
}