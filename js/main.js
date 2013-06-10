(function ($) {
  var $richTextArea = $('#rich-text-area')
  
  $richTextArea.richTextArea({ placeholder : 'What\'s on your mind?' })
  $richTextArea.richTextArea('addTagHandler', {
      type    : 'hashtag'
    , color   : 'hsl(145,53%,74%)'
    , trigger : '#'
  })
  
  $richTextArea.richTextArea('addTagHandler', {
      type    : 'mention'
    , color   : 'hsl(217, 30%, 88%)'
    , trigger : '@'
    , handler : function () {} 
  })
 
  
}(jQuery))
