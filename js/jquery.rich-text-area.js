(function ($) {
  
  var PLAIN_TEXT_TAG_TYPE = 'PLAIN_TEXT_TAG'
  
  /* ======================================================================= *
   *  UTIL FUNCTIONS                                                         *
   * ======================================================================= */
  function getInputSelection(el) {
    var start = 0, end = 0, normalizedValue, range,
        textInputRange, len, endRange;

    if (typeof el.selectionStart == "number" && typeof el.selectionEnd == "number") {
        start = el.selectionStart;
        end = el.selectionEnd;
    } else {
        range = document.selection.createRange();

        if (range && range.parentElement() == el) {
            len = el.value.length;
            normalizedValue = el.value.replace(/\r\n/g, "\n");

            // Create a working TextRange that lives only in the input
            textInputRange = el.createTextRange();
            textInputRange.moveToBookmark(range.getBookmark());

            // Check if the start and end of the selection are at the very end
            // of the input, since moveStart/moveEnd doesn't return what we want
            // in those cases
            endRange = el.createTextRange();
            endRange.collapse(false);

            if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
                start = end = len;
            } else {
                start = -textInputRange.moveStart("character", -len);
                start += normalizedValue.slice(0, start).split("\n").length - 1;

                if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
                    end = len;
                } else {
                    end = -textInputRange.moveEnd("character", -len);
                    end += normalizedValue.slice(0, end).split("\n").length - 1;
                }
            }
        }
    }

    return {
        start: start,
        end: end
    };
  }

  /* ======================================================================= */
  /* ======================================================================= */

  /* ======================================================================= *
   *  RICH TEXT AREA CLASS                                                   *
   * ======================================================================= */
  function RichTextArea($el, options) {
    var self = this
    
    _.bindAll(this)
    
    this._tagHandlers = {}
    
    // Create Original PLAIN_TEXT_TAG
    this._tags = [{start : -Infinity, end: Infinity, type : PLAIN_TEXT_TAG_TYPE, content : ''}]
    this.$el = $el
    
    this.$el.addClass('rich-text-area')
    this.$el.html('<div class="mirror-container"><div class="mirror"></div></div><textarea></textarea>')
    
    this.$textarea = this.$el.find('textarea')
    this.$textarea.attr('placeholder', options.placeholder)
    
    this.$mirror = this.$el.find('.mirror')
                   
    // Add Default PLAIN_TEXT_TAG Handler
    this.addTagHandler({ type : PLAIN_TEXT_TAG_TYPE change this to full class})
    
    this.$el.on('change keyup', 'textarea', this._onChange)
    
    this.$textarea.scroll(function () { self.update() })
  }
  
  /* ======================================================================= *
   *  PRIVATE FUNCTIONS                                                      *
   * ======================================================================= */
  RichTextArea.prototype._getTagAt = function (pos) {
    return _.find(this._tags, function (tag) {
      if (tag.start <= pos) return true
      else return false
    })
  }
  
  RichTextArea.prototype._getTagHandler = function (tagType) {
    return this._tagHandlers[tagType]
  }
  
  RichTextArea.prototype._onChange = function (e) {
    var inputSelection = getInputSelection(this.$textarea[0])
    
    this.update()
  }
  
  RichTextArea.prototype._onPlainTextKeyUp = function(e, tag, charPos) {
    
  }
  
  // RichTextArea.prototype._getFormatedText = function () {
  //   var formatedText = _.reduce(this._tags, function(memo, tag) {
  //     if (tag.type !== PLAIN_TEXT_TAG_TYPE)
  //       memo += '<span class="meta ' + tag.type + '">' + tag.content + '</span>'
  //     else
  //       memo += tag.content
        
  //      return memo
  //   }, '')
    
  //   formatedText = formatedText.replace(/\n/g, '<br/>')
    
  //   return formatedText
  // }
  
  // RichTextArea.prototype._getUnformatedText = function () {
  //   var unformatedText = _.reduce(this._tags, function(memo, tag) {
  //     memo += tag.content
  //     return memo
  //   }, '')
    
  //   return unformatedText
  // }
  
  RichTextArea.prototype.update = function () {
    // var formatedText  = this._getFormatedText()
    // var unformatedText = this._getUnformatedText()
    // this.$mirror.html(formatedText)
    // this.$textarea.val(unformatedText)
    this.$mirror.css('margin-top', -this.$textarea.scrollTop())
  }
  
  RichTextArea.prototype.addTagHandler = function (options) {
    this._tagHandlers[options.type] = _.extend({}, options)
  }
  
  $.fn.richTextArea = function (action, options) {
    if (!this.richTextAreaInstance && typeof action === 'object')
      this.richTextAreaInstance = new RichTextArea(this, action)
      
    else if (action)
      this.richTextAreaInstance[action](options)
     
    else
      throw 'RichTextArea Plugin Called without being Initialized.'
  }
}(jQuery));