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
          source: ["Barack Obama", "George W. Bush", "Bill Clinton", "George Herbert Walker Bush", "Ronald Reagan", "Jimmy Carter", "Gerald Ford", "Richard Nixon", "Lyndon B. Johnson", "John F. Kennedy", "Dwight D. Eisenhower", "Harry S. Truman", "Franklin D. Roosevelt", "Herbert Hoover", "Calvin Coolidge", "Warren G. Harding", "Woodrow Wilson", "William Howard Taft", "Theodore Roosevelt", "William McKinley", "Benjamin Harrison", "Grover Cleveland", "Chester A. Arthur", "James A. Garfield", "Rutherford B. Hayes", "Ulysses S. Grant", "Andrew Johnson", "Abraham Lincoln", "James Buchanan", "Franklin Pierce", "Millard Fillmore", "Zachary Taylor", "James K. Polk", "John Tyler", "William Henry Harrison", "Martin Van Buren", "Andrew Jackson", "John Quincy Adams", "James Monroe", "James Madison", "Thomas Jefferson", "John Adams", "George Washington"]
        , matcher: function (item) {
            var query = this.query.slice(1)
            return ~ item.toLowerCase().indexOf(query.toLowerCase()) && item != query
          }
        , highlighter: function (item) {
            var query = this.query.slice(1).replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&')
            return item.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
              return '<strong>' + match + '</strong>'
            })
          } 
      }
  })
 
  
}(jQuery))
