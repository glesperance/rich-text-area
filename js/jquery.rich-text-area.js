/*
* Rich Text Area JS Framework v0.0.4
* Copyright (c) 2013 Wavo.me Inc. (https://wavo.me)
* Licensed under the MIT license.
*/
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define(['jquery', 'underscore'], function ($, _) {
      factory(root, $, _);
    });
  } else {
    // Browser globals
    factory(root, root.jQuery, root._);
  }
}(this, function (root, $, _) {

  /* ======================================================================= *
   *  CONSTANTS                                                              *
   * ======================================================================= */
  var BACKSPACE_CHARACTER_KEYCODE = 8
    , DELETE_CHARACTER_KEYCODE    = 46
    , PLAIN_TEXT_TAG_TYPE         = 'plain-text'

  /* ======================================================================= *
   *  UTIL FUNCTION: getInputSelection                                       *
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

  /* ======================================================================= *
   *  UTIL OBJECT: BasicOject                                                *
   * ======================================================================= */

  // Shared empty constructor function to aid in prototype-chain creation.
  var ctor = function(){};

  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var inherits = function(parent, protoProps, staticProps) {
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && protoProps.hasOwnProperty('constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ parent.apply(this, arguments); };
    }

    // Inherit class (static) properties from parent.
    _.extend(child, parent);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Add static properties to the constructor function, if supplied.
    if (staticProps) _.extend(child, staticProps);

    // Correctly set child's `prototype.constructor`.
    child.prototype.constructor = child;

    // Set a convenience property in case the parent's prototype is needed later.
    child.__super__ = parent.prototype;

    return child;
  };

  // The self-propagating extend function that Backbone classes use.
  var extend = function (protoProps, classProps) {
    var child = inherits(this, protoProps, classProps);
    child.extend = this.extend;
    return child;
  };
    
  BasicObject.extend = extend;
    
  function BasicObject() {
    /* silence is golden */
  };

  /* ======================================================================= */
  /* ======================================================================= *
   *   EVENT EMITTER CLASS                                                   *
   * ======================================================================= */
  var EventEmitter = BasicObject.extend({
      constructor: function () {
        this._events = {}
      }

    , on: function (event, callback) {
        if (!this._events[event]) this._events[event] = $.Callbacks('unique')
        this._events[event].add(callback)
        return this
      }

    , off: function (event, callback) {
        if (!event)
          this._events = {}

        if (!this._events[event]) return this

        if (callback) 
          this._events[event].remove(callback)
        else 
          delete this._events[event]

        return this
      }

    , trigger: function() {
        var args  = Array.prototype.slice.call(arguments)
          , event = args.shift()

        if (!this._events[event]) return this

        this._events[event].fire.apply(this._events[event], args)

        return this
      }
  })

  /* ======================================================================= */
  /* ======================================================================= *
   *  TYPEAHEAD CLASS                                                        *
   * ======================================================================= */
  var Typeahead = EventEmitter.extend({

      constructor: function (element, options) {
        this.$element = $(element)
        this.options = $.extend({}, {
          source: []
        , items: 8
        , menu: '<ul class="typeahead dropdown-menu"></ul>'
        , item: '<li><a href="#"></a></li>'
        , minLength: 1
        }, options)
        this.matcher = this.options.matcher || this.matcher
        this.sorter = this.options.sorter || this.sorter
        this.highlighter = this.options.highlighter || this.highlighter
        this.updater = this.options.updater || this.updater
        this.source = this.options.source
        this.mapToText = this.options.mapToText || _.identity
        this.$menu = $(this.options.menu)
        this.shown = false
        this._events = {}
        this.listen()

        EventEmitter.apply(this)
      }

    , select: function () {
        var val = this.$menu.find('.active').data('value')
        
        // this.$element
        //   .val(this.updater(val))
        //   .change()

        this.trigger('select', val)

        return this.hide()
      }

    , updater: function (item) {
        return item
      }

    , show: function () {
        var pos = $.extend({}, this.$element.position(), {
          height: this.$element[0].offsetHeight
        })

        this.$menu
          .insertAfter(this.$element)
          .css({
            top: pos.top + pos.height
          , left: pos.left
          })
          .show()

        this.shown = true
        return this
      }

    , hide: function () {
        this.$menu.hide()
        this.shown = false
        return this
      }

    , remove: function ()  {
        this.hide()
        this.off()
        this.$menu.remove()
      }

    , lookup: function (query) {
        var items

        if (this.query == query)
          return
        
        this.query = query

        if (!this.query || this.query.length < this.options.minLength) {
          return this.shown ? this.hide() : this
        }

        items = $.isFunction(this.source) ? this.source(this.query, $.proxy(this.process, this)) : this.source

        return items ? this.process(items) : this
      }

    , process: function (items) {
        var that = this

        items = $.grep(items, function (item) {
          return that.matcher(item)
        })

        items = this.sorter(items)

        if (!items.length) {
          return this.shown ? this.hide() : this
        }

        return this.render(items.slice(0, this.options.items)).show()
      }

    , matcher: function (item) {
        return ~this.mapToText(item).toLowerCase().indexOf(this.query.toLowerCase())
      }

    , sorter: function (items) {
        var beginswith = []
          , caseSensitive = []
          , caseInsensitive = []
          , item

        while (item = items.shift()) {
          if (!this.mapToText(item).toLowerCase().indexOf(this.query.toLowerCase())) beginswith.push(item)
          else if (~this.mapToText(item).indexOf(this.query)) caseSensitive.push(item)
          else caseInsensitive.push(item)
        }

        return beginswith.concat(caseSensitive, caseInsensitive)
      }

    , highlighter: function (item) {
        var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&')
        return item.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
          return '<strong>' + match + '</strong>'
        })
      }

    , render: function (items) {
        var that = this

        items = $(items).map(function (i, item) {
          i = $(that.options.item).data('value', item)
          i.find('a').html(that.highlighter(that.mapToText(item)))
          return i[0]
        })

        items.first().addClass('active')
        this.$menu.html(items)
        return this
      }

    , next: function (event) {
        var active = this.$menu.find('.active').removeClass('active')
          , next = active.next()

        if (!next.length) {
          next = $(this.$menu.find('li')[0])
        }

        next.addClass('active')
      }

    , prev: function (event) {
        var active = this.$menu.find('.active').removeClass('active')
          , prev = active.prev()

        if (!prev.length) {
          prev = this.$menu.find('li').last()
        }

        prev.addClass('active')
      }

    , listen: function () {
        // this.$element
        //   .on('focus',    $.proxy(this.focus, this))
        //   .on('blur',     $.proxy(this.blur, this))
        //   .on('keypress', $.proxy(this.keypress, this))
        //   .on('keyup',    $.proxy(this.keyup, this))

        // if (this.eventSupported('keydown')) {
        //   this.$element.on('keydown', $.proxy(this.keydown, this))
        // }

        this.$menu
          .on('click', $.proxy(this.click, this))
          .on('mouseenter', 'li', $.proxy(this.mouseenter, this))
          .on('mouseleave', 'li', $.proxy(this.mouseleave, this))
      }

    , eventSupported: function(eventName) {
        var isSupported = eventName in this.$element
        if (!isSupported) {
          this.$element.setAttribute(eventName, 'return;')
          isSupported = typeof this.$element[eventName] === 'function'
        }
        return isSupported
      }

    , move: function (e) {
        if (!this.shown) return

        switch(e.keyCode) {
          case 9: // tab
          case 13: // enter
            if (!this.shown) return
            e.preventDefault()
            this.select()
            break

          case 27: // escape
            if (!this.shown) return
            e.preventDefault()
            this.hide()
            break

          case 38: // up arrow
            e.preventDefault()
            this.prev()
            break

          case 40: // down arrow
            e.preventDefault()
            this.next()
            break
        }
      }

    , keydown: function (e) {
        this.suppressKeyPressRepeat = ~$.inArray(e.keyCode, [40,38,9,13,27])
        this.move(e)
      }

    , focus: function (e) {
        this.focused = true
      }

    , blur: function (e) {
        this.focused = false
        if (!this.mousedover && this.shown) this.hide()
      }

    , click: function (e) {
        e.stopPropagation()
        e.preventDefault()
        this.select()
        this.$element.focus()
      }

    , mouseenter: function (e) {
        this.mousedover = true
        this.$menu.find('.active').removeClass('active')
        $(e.currentTarget).addClass('active')
      }

    , mouseleave: function (e) {
        this.mousedover = false
      }
  })

  /* ======================================================================= */
  /* ======================================================================= *
   *  BASE TAG CLASS                                                         *
   * ======================================================================= */
  var BaseTag = EventEmitter.extend({
      constructor: function (options) {
        _.bindAll(this)

        options = _.defaults(options || {}, {
            content : ''
          , id      : _.uniqueId()
        })

        this._content = typeof options.content === 'string'
                          ? options.content.split('')
                          : option.content

        this._value = options.value

        delete options.content
        delete options.value

        this.options = options

        this._events = {}
      
        _.extend(this, options)

        EventEmitter.apply(this)
      }

    , length: function () {
        return this._content.length
      }

    , blur: function () { /* silence is golden */ }

    , start: function() {
        var pos = 0
        for (var i = 0, ii = this.richTextArea.tags.length; i < ii; i++) {
          if (this.richTextArea.tags[i] == this) return pos
          pos += this.richTextArea.tags[i].length()
        }
        return null
      }

    , end: function () {
        return this.start() + this.length()
     }

    , isIn: function (selection) {
        // The tag is contained in the selection
        if (selection.start <= this.start() && this.start() <= selection.end)
          return true

        // The selection.start is within the tag
        else if (this.start() <= selection.start && selection.start < this.end())
          return true

        // The selection.end is within the tag
        else if (this.start() <= selection.end && selection.end < this.end())
          return true

        else
          return false
      }

    , isEmpty: function () {
        return this._content.length == 0
      }

    , clone: function (options) {
        return new this.constructor(_.extend({}, this.options, { 
            content : this.content()
          , value   : this._value
        }, options))
      }

    , remove: function () {
        this.off()
      }

    , insertChars: function (params) {
        var clone = new PlainTextTag({ content : this.content(), richTextArea : this.richTextArea })
          , chars = params.content
        if (typeof chars === 'string') chars = chars.split('')
        clone._content.splice.apply(clone._content, [params.at, 0].concat(chars))
        return clone
      }

    , removeChars: function (params) {
        var clone = new PlainTextTag({ content : this.content(), richTextArea : this.richTextArea })
        clone._content.splice(params.at, params.length)
        return clone
      }

    , content: function (start, end) {
        return this._content.slice(start, end).join('')
      }

    , value: function () {
        return this._value || this.content()
      }

    , htmlContent: function () {

        var content = this.content()

        // Make sure there aren't any text converted to html entities
        content = content.replace(/&/g, '&amp;')

        // Make sure there are no '<' or '>' in the mirrored content
        content = content.replace(/</g, '&lt;')
        content = content.replace(/>/g, '&gt;')

        // Replace all cariage new-line charaters by line breaks
        content = content.replace(/\n/g, '<br/>')
        
        // Replace all spaces by non-breaking space
        content = content.replace(/\s/g, '&nbsp;')

        return content
      }

    , mirrorContent: function () {
        // Wrap the htmlContent within a span
        var $el = $('<span class="tag">' + this.htmlContent() + '</span>')

        // Add the defined className, if provided
        if (this.className) $el.addClass(this.className)

        // Append the element to a temporary div and return its html content
        // The content will correspond to the element's html value
        return $('<div>').append($el).html()
      }
  })
  /* ======================================================================= */
  /* ======================================================================= *
   *  TYPEAHEAD TAG                                                          *
   * ======================================================================= */
  var TypeaheadTag = BaseTag.extend({
      _matchTags: function (selection) {
        var content = this.content().slice(0,  selection.start)
          , match

        var matchingTagClass = _.find(this.richTextArea._tagClasses, function (tagClass) {
          if (_.isRegExp(tagClass.matcher))
            return match = content.match(tagClass.matcher)
          else if (_.isFunction(tagClass.matcher))
            return match = tagClass.matcher(content)
        })

        if (this.typeahead && this.match.tagClass !== matchingTagClass) {
          this.typeahead.remove()
          delete this.typeahead
        }

        if (matchingTagClass) {

          // Save the match information
          this.match = {
              match     : match
            , tagClass  : matchingTagClass
          }

          // If the matched tag has a typeahead configuration...
          var typeaheadConf = matchingTagClass && matchingTagClass.typeahead
          if (typeaheadConf) {

            // If there are no typeadhed instance attached
            // ==> Create one
            if (!this.typeahead) {
              this.typeahead = new Typeahead(this.richTextArea.$textarea, typeaheadConf)
              this.typeahead.on('select', this.onTypeaheadSelect)
            }

            // Tell the typahead instance to lookup for a match
            this.typeahead.lookup(this.match.match[0])
          }

          // If the matching tag class is different from the current one
          // AND there is *no* typeahead config --or-- free form is allowed
          // ==> immediately replace the match with the corresponding tag class
          if (!(this instanceof matchingTagClass) && (!typeaheadConf || typeaheadConf.freeForm))
            this._replaceMatchWithTag()
        }
        
        // If there is no matching tag class found,
        // ==> make sure we mark the current match as such. (null)
        else
          this.match = null
      }

    , _replaceMatchWithTag: function (options) {
        if (!options) options = {}

        if (!this.match) return

        var match             = this.match.match
          , content           = options.content || match[0]

          , matchingTagClass  = this.match.tagClass.highlighter
                                  ? PlainTextTag
                                  : this.match.tagClass

          , tags              = []

        // If there is some plain text before the tag
        // ==> create a plain-text tag with it and push it at the front
        if (match.index > 0)
          tags.push(new PlainTextTag({ content : this.content(0, match.index) }))

        // Insert the tag, replacing the matched text
        tags.push(new matchingTagClass({ 
            content : content
          , value   : options.value
        }))

        // Create a plain-text tag with a space a teh start and
        // if there is some plain-text left after the tag, push it at the end
        // of it
        if (match.input.length < this.length())
          tags.push(new PlainTextTag({ 
            content : ' ' + this.content(match.input.length)
          }))

        // Position the cursor after the space added after the tag
        var cursorPos = match.index + content.length + this.start() + 1
        this.trigger('replace', this, tags, { 
            start : cursorPos
          , end   : cursorPos
        })
      }

    , blur: function () {
        if (this.typeahead) {
          this.typeahead.remove()
          delete this.typeahead
        }
      }

    , remove: function () {
        BaseTag.prototype.remove.apply(this, arguments)
        
        if (this.typeahead)
          this.typeahead.off('select', this.onTypeaheadSelect)
      }

    , onSelect: function(selection) { this._matchTags(selection) }

    , onKeyDown: function(e) {
        if (this.typeahead)
          this.typeahead.keydown(e)
      }

    , onTypeaheadSelect: function (selection) {
        this._replaceMatchWithTag({ 
            value   : selection
          , content : this.typeahead.mapToText(selection) 
        })
      }

    , clone: function () {
        return BaseTag.prototype.clone.call(this, {
            typeahead : this.typeahead
          , match     : this.match
        })
      }

    , constructor: function (options) {
        BaseTag.apply(this, arguments)

        // If a typeahead instance has been passed
        // ==> listen to the events we're interrested in.
        if (this.typeahead)
          this.typeahead.on('select', this.onTypeaheadSelect)
      }
  })

  /* ======================================================================= */
  /* ======================================================================= *
   *  PLAIN TEXT TAG CLASS                                                   *
   * ======================================================================= */
  var PlainTextTag = TypeaheadTag.extend({ 
      typeName: PLAIN_TEXT_TAG_TYPE

    , mirrorContent: function () {
        var content = this.htmlContent() 
        
        var highlightTagClasses = _.filter(this.richTextArea._tagClasses, function (t) {
          return !!t.highlighter
        })

        // Pass the content through the highlighter
        _.each(highlightTagClasses, function (highligthTagClass) {
          content = highligthTagClass.highlighter(content)
        })

        // Finally wrap the tag within a span
        var $el = $('<span class="tag">' + content + '</span>')

        // Add the defined className, if provided
        if (this.className) $el.addClass(this.className)

        // Append the element to a temporary div and return its html content
        // The content will correspond to the element's html value
        return $('<div>').append($el).html()
      }

    , isIn: function (selection) {
        // The tag is contained in the selection
        if (selection.start <= this.start() && this.start() <= selection.end)
          return true

        // The selection.start is within the tag
        else if (this.start() <= selection.start && selection.start <= this.end())
          return true

        // The selection.end is within the tag
        else if (this.start() <= selection.end && selection.end <= this.end())
          return true

        else
          return false
      }

    , insertChars: function (params) {
        var clone = this.clone()
          , chars  = params.content
        if (typeof chars === 'string') chars = chars.split('')
        clone._content.splice.apply(clone._content, [params.at, 0].concat(chars))
        return clone
      }

    , removeChars: function (params) {
        var clone = this.clone()
        clone._content.splice(params.at, params.length)
        return clone
      }
  })

  /* ======================================================================= */
  /* ======================================================================= *
   *  RICH TEXT AREA                                                         *
   * ======================================================================= */

  /* ===================================================================== *
   *  PRIVATE FUNCTIONS                                                    *
   * ===================================================================== */

  RichTextArea.prototype._getOffsetSelection = function (selection) {
    var length = this.content().length
    return { fromStart : selection.start, fromEnd : length - selection.end }
  }

  RichTextArea.prototype._onKeyDown = function (e) {
    var selection   = _.clone(this._selection)

    var firstSelectedTag = _.find(this.tags, function (tag) {
      return tag.isIn(selection)
    })

    if (firstSelectedTag && firstSelectedTag.onKeyDown)
      firstSelectedTag.onKeyDown(e)
  }

  RichTextArea.prototype._onChange = function (e) {
    var selection   = _.clone(this._selection)
      , isSelection = selection.start < selection.end
      , self        = this
      , updatedTags
      , selectedTags

    function computeSelectedTags () {
      if (selectedTags) return
      selectedTags = _.filter(self.tags, function (tag) {
        return tag.isIn(selection)
      })
    }

    function _removeSelection() {
      
      computeSelectedTags()

      updatedTags = _.map(self.tags, function (tag) {
        if (_.contains(selectedTags, tag))
          return tag.removeChars({
              at      : tag.start() >= selection.start 
                          ? 0
                          : selection.start - tag.start()
            , length  : Math.min(
                            selection.end - tag.start()
                          , selection.end - selection.start
                        )
          })
        else
          return tag.clone()
      })
    }

    switch (e.keyCode) {
      case BACKSPACE_CHARACTER_KEYCODE:
        // If this is a deletion w/o selection, go backward...
        if (!isSelection) 
          selection.start = selection.start - 1
        _removeSelection()
        self._selection.end = selection.start
        done()
        break

      case DELETE_CHARACTER_KEYCODE:
        // If this is a deletion w/o selection, go forward...
        if (!isSelection) 
          selection.end = selection.end + 1
        _removeSelection()
        self._selection.end = selection.start
        done()
        break

      default:

        _.defer(function () {

          var selectionContent = self.content().slice(selection.start, selection.end)

          var offsetSelection = self._getOffsetSelection(selection)
          var addedContent = self.$textarea.val().slice(
              offsetSelection.fromStart
            , -offsetSelection.fromEnd || undefined
          )

          if (addedContent && addedContent != selectionContent) {
            
            if (isSelection)
              _removeSelection()

            if (!updatedTags)
              updatedTags = _.map(self.tags, function (tag) { 
                return tag.clone()
              })

            computeSelectedTags()

            var firstTagIndex     = _.indexOf(self.tags, selectedTags[0])
              , originalFirstTag  = self.tags[firstTagIndex]
              , firstTag          = updatedTags[firstTagIndex]

            updatedTags.splice(
                firstTagIndex
              , 1
              , firstTag.insertChars({ at : selection.start - originalFirstTag.start(), content : addedContent })
            )[0].remove()

            self._selection.end = selection.start
          }

          done()

        })

    }

    function done() {
      if (updatedTags) {
        _.each(self.tags, function (tag) { tag.remove() })
        _.each(updatedTags, self._listenToTag)
        self.tags = updatedTags
      }

      _.defer(self.update)
    } 

  }

  RichTextArea.prototype._onSelect = function () {
    this.refreshSelection()
  }

  RichTextArea.prototype._listenToTag = function (tag) {
    tag.on('replace', this.replaceTag)
  }

  RichTextArea.prototype._cleanTags = function () {
    var self = this

    this.tags =  _.reject(_.flatten(this.tags), function (tag) {
      if (_.isNull(tag))
        return true
      
      else if (!tag.length()) {
        tag.remove()
        return true
      }

      else
        return false
    })

    this.tags = _.reduce(this.tags, function (memo, tag, index) {
      var prevTag         = _.last(memo)
        , isPlainText     = (tag.typeName === PLAIN_TEXT_TAG_TYPE)
        , isPrevPlainText = (prevTag && prevTag.typeName === PLAIN_TEXT_TAG_TYPE)

      if (isPrevPlainText && isPlainText) {
        memo[memo.length - 1] = prevTag.insertChars({ 
            at      : prevTag.length()
          , content : tag.content()
        })

        tag.remove()
        prevTag.remove()
        prevTag = memo[memo.length - 1]
        self._listenToTag(prevTag)
      }

      else
        memo.push(tag)

      return memo

    }, [])

  }

  /* ===================================================================== *
   *  PUBLIC FUNCTIONS                                                     *
   * ===================================================================== */

  RichTextArea.prototype.replaceTag = function (tag, replacement, selection) {
    var tagIndex  = _.indexOf(this.tags, tag)
      , self      = this

    this.tags.splice.apply(this.tags, _.flatten([
        tagIndex
      , 1
      , replacement
    ]))

    tag.remove()
    _.each(replacement, this._listenToTag)
    _.each(replacement, function (tag) { 
      tag.options.richTextArea = tag.richTextArea = self 
    })

    this.update({ selection : selection })
  }

  RichTextArea.prototype.update = function (options) {

    this._cleanTags()

    this.$mirror.html(this.mirrorContent())
    
    // Refresh the selection data in case of cursor move.
    // e.g.: By typing arrows...
    this.refreshSelection(options)

    if (this.$textarea.val() != this.content()) {
      this.$textarea.val(this.content())
      this.$textarea.setSelectionRange(this._selection)
    }

    this.$mirror.css('margin-top', -this.$textarea.scrollTop())

    return this
  }

  RichTextArea.prototype.refreshSelection = function(options) {
    
    if (!options) options = {}

    if (options.selection)
       this.$textarea.setSelectionRange(options.selection)

    var selection = this._selection = options.selection || getInputSelection(this.$textarea[0])

    var firstSelectedTag = _.find(this.tags, function (tag) {
      return tag.isIn(selection)
    })

    if (!firstSelectedTag)
      firstSelectedTag = this._pushTag({ type : PLAIN_TEXT_TAG_TYPE, content : '' })

    if (this._firstSelectedTag && this._firstSelectedTag.id !== firstSelectedTag.id)
      this._firstSelectedTag.blur()

    this._firstSelectedTag = firstSelectedTag
    
    if (!options.silent && firstSelectedTag && firstSelectedTag.onSelect)
      firstSelectedTag.onSelect({
          start : selection.start - firstSelectedTag.start()
        , end   : Math.min(selection.end - firstSelectedTag.start(), firstSelectedTag.length())
      })

    return this
  }
  
  RichTextArea.prototype.createTagClass = function () {
    var args          = Array.prototype.slice.call(arguments)
      , tagClassProps = args.pop()
      , tagProtoProps = args.pop()

    this._tagClasses[tagClassProps.typeName] = BaseTag.extend(
        _.extend({}, tagProtoProps, { 
            typeName  : tagClassProps.typeName
          , className : tagClassProps.className
        })
      , tagClassProps
    )
    return this
  }

  RichTextArea.prototype._pushTag = function(options) {
    var tagClass  = options.type === PLAIN_TEXT_TAG_TYPE
                      ? PlainTextTag
                      : this._tagClasses[options.type]

    var tag = new tagClass(_.extend(options, {
      richTextArea: this
    }))

    this.tags.push(tag)

    return tag
  }

  RichTextArea.prototype.focus = function () {
    this.$textarea.focus()
  }

  RichTextArea.prototype.content = function () {
    return _.reduce(this.tags, function (memo, tag) {
      return memo += tag.content()
    }, '')
  }

  RichTextArea.prototype.mirrorContent = function () {
    return _.reduce(this.tags, function (memo, tag) {
      memo += tag.mirrorContent()
      return memo
    }, '')
  }

  RichTextArea.prototype.value = function (newTags) {
    var self = this

    if (!newTags)
      return _.reduce(this.tags, function (mapped, tags) { 
        var value = tags.value()
        if (value) mapped.push(value)
        return mapped
      }, [])

    _.each(newTags, function (tag) {
      self._pushTag(typeof tag == 'object' ? tag : { content : tag, type : PLAIN_TEXT_TAG_TYPE })
    })

    this.update()

  }

  /* ===================================================================== *
   *  RICH TEXT AREA CONSTRUCTOR                                           *
   * ===================================================================== */
  function RichTextArea($el, options) {
    var self = this
    
    _.bindAll(this)
    
    this._tagClasses = {}
    this.tags = []

    this.$el = $el
    
    this.$el.addClass('rich-text-area')
    this.$el.html('<div class="mirror-container"><div class="mirror"></div></div><textarea></textarea>')
    
    this.$textarea = this.$el.find('textarea')
    this.$textarea.attr('placeholder', options.placeholder)
    
    this.$mirror = this.$el.find('.mirror')
                   
    this.$el.on('change keydown paste', 'textarea', this._onChange)
    this.$el.on('keydown', 'textarea', this._onKeyDown)

    this.$textarea.on('select mousemove click', this._onSelect)
    
    this.$textarea.scroll(function () { self.update() })

    this.update()
  }

  /* ======================================================================= */
  /* ======================================================================= */

  $.fn.setSelectionRange = function(options) {
    var start = options.start
      , end   = !isNaN(options.end) ? options.end : options.start
    if (this[0].setSelectionRange) {
      this[0].setSelectionRange(start, end)
    } else if (this[0].createTextRange) {
      var range = this[0].createTextRange()
      range.collapse(true)
      range.moveEnd('character', end)
      range.moveStart('character', start)
      range.select()
    }
  }

  $.fn.richTextArea = function (action) {
    var args    = Array.prototype.slice.call(arguments)
      , action  = args.shift()

    if (!this.richTextAreaInstance && typeof action === 'object')
      return this.richTextAreaInstance = new RichTextArea(this, action)
      
    else if (action)
      return this.richTextAreaInstance[action].apply(this.richTextAreaInstance, args)
     
    else
      throw 'RichTextArea Plugin Called without being Initialized.'
  }
  
}));
