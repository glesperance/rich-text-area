(function ($) {

  /* ======================================================================= *
   *  CONSTANTS                                                              *
   * ======================================================================= */
  var UPARROW_CHARACTER_KEYCODE   = 38
    , DOWNARROW_CHARACTER_KEYCODE = 40
    , ENTER_CHARACTER_KEYCODE     = 13

  /* ======================================================================= *
   *  MAIN                                                                   *
   * ======================================================================= */
  var $richTextArea = $('#rich-text-area')
  
  $richTextArea.richTextArea({ placeholder : 'What\'s on your mind?' })
  
  /***
   * HASH TAG CREATION
   */
  $richTextArea.richTextArea('createTagClass', {
      typeName: 'hashtag'
    , className: 'meta hashtag'

    , highlighter: function (content) {
        return content.replace(/(^|&nbsp;|<br\/>)(#[-_0-9a-zA-Z]+)/g, function ($0, $1, $2) {
          return $1 + '<span class="meta hashtag">' + $2 + '</span>'
        })
      }

    // When `matcher` is a function, it must return results in accordance with
    // `regexp.exec`

    // Note that this function is used when typing and matches against
    // the string from the start of the tag to the cursor position.
    // e.g.: If the plain text-tag we're typing in is "This is my #tag-content"
    // and that the cursor is jsut after the 'g' of '#tag' then the matcher
    // is fed with 'this is my #tag'
    , matcher: function (content) {
        var r0  = /(^|[\s])#[-_0-9a-zA-Z]+$/
          , r1  = /#[-_0-9a-zA-Z]+$/

        if (content.match(r0)) 
          return content.match(r1)
        else 
          return null
      }

    , typeahead: {
          source: ['#hiphop', '#indie', '#house', '#deep-house']

        , matcher: function (_item) {
            var item  = _item.toLowerCase().slice(1)
              , query = this.query.slice(1)

            return ~ item.indexOf(query) && item != query
          }

        , highlighter: function (item) {
            var query = this.query.slice(1).replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&')
            return item.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
              return '<strong>' + match + '</strong>'
            })
          }
      }    
  })
  
  /***
   * MENTION TAG CREATION
   */
  $richTextArea.richTextArea('createTagClass', { 
      typeName: 'mention'
    , className: 'meta mention'

    , matcher: function (content) {
        var r0  = /(^|[\s])@.+$/
          , r1  = /@.+$/

        if (content.match(r0)) 
          return content.match(r1)
        else 
          return null
      }

    , typeahead: {
          source: [{"text":"Barack Obama","id":0},{"text":"George W. Bush","id":1},{"text":"Bill Clinton","id":2},{"text":"George Herbert Walker Bush","id":3},{"text":"Ronald Reagan","id":4},{"text":"Jimmy Carter","id":5},{"text":"Gerald Ford","id":6},{"text":"Richard Nixon","id":7},{"text":"Lyndon B. Johnson","id":8},{"text":"John F. Kennedy","id":9},{"text":"Dwight D. Eisenhower","id":10},{"text":"Harry S. Truman","id":11},{"text":"Franklin D. Roosevelt","id":12},{"text":"Herbert Hoover","id":13},{"text":"Calvin Coolidge","id":14},{"text":"Warren G. Harding","id":15},{"text":"Woodrow Wilson","id":16},{"text":"William Howard Taft","id":17},{"text":"Theodore Roosevelt","id":18},{"text":"William McKinley","id":19},{"text":"Benjamin Harrison","id":20},{"text":"Grover Cleveland","id":21},{"text":"Chester A. Arthur","id":22},{"text":"James A. Garfield","id":23},{"text":"Rutherford B. Hayes","id":24},{"text":"Ulysses S. Grant","id":25},{"text":"Andrew Johnson","id":26},{"text":"Abraham Lincoln","id":27},{"text":"James Buchanan","id":28},{"text":"Franklin Pierce","id":29},{"text":"Millard Fillmore","id":30},{"text":"Zachary Taylor","id":31},{"text":"James K. Polk","id":32},{"text":"John Tyler","id":33},{"text":"William Henry Harrison","id":34},{"text":"Martin Van Buren","id":35},{"text":"Andrew Jackson","id":36},{"text":"John Quincy Adams","id":37},{"text":"James Monroe","id":38},{"text":"James Madison","id":39},{"text":"Thomas Jefferson","id":40},{"text":"John Adams","id":41},{"text":"George Washington","id":42}]
        
        , mapToText: function (o) { return o.text }

        , matcher: function (item) {
            var query = this.query.slice(1)
            return ~ this.mapToText(item).toLowerCase().indexOf(query.toLowerCase())
          }
        , highlighter: function (item) {
            var query = this.query.slice(1).replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&')
            return item.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
              return '<strong>' + match + '</strong>'
            })
          } 
      }
  })
 
  $('.get-value').click(function () {
    var value = $richTextArea.richTextArea('value')
    console.log(value)
    alert(JSON.stringify(value))
  })

}(jQuery))
