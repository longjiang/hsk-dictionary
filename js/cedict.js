var CEDICT = {
  _data: [],
  load(callback) {
    const cedict = this
    $.get('data/cedict_ts.u8', function(cedictText){
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
              definitionObj.type = "variant"
              definitionObj.variant = cedict.parseWord(m[1])
              definitionObj.text = `variant of ${definitionObj.variant.simplified} (${definitionObj.variant.pinyin})`
            }
            row.definitions[index] = definitionObj
          })
          cedict._data.push(row)
        }
      })
      callback(cedict)
    })
  },
  parsePinyin(pinyin) {
    return pinyinify(pinyin) // use the pinyinify library to parse tones
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
  lookup(traditional) {
    return this._data.filter(function(row) {
      return row.traditional === traditional
    })
  },
  lookupFuzzy(text) {
    text = text.toLowerCase().replace(' ', '');
    return this._data.filter(function(row) {
      return row.search.includes(text)
    })
  }
}