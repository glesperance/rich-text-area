var webdriver = require('selenium-webdriver')
  , path      = require('path')
  , expect    = require('chai').expect

var DUMMY_STRING = 'Simple Programmer'
var LONG_PARAGRAPH = 'Donec ut lorem eget est sollicitudin hendrerit. Duis accumsan enim dapibus adipiscing porta. Curabitur eu suscipit nulla. Proin a odio risus. Maecenas sit amet ante id risus adipiscing fringilla. Nulla lacinia molestie elit. Aliquam vel suscipit ipsum. Interdum et malesuada fames ac ante ipsum primis in faucibus. Mauris a magna et eros placerat porttitor. Etiam luctus nulla quis augue placerat iaculis. Curabitur bibendum iaculis augue a pretium. Etiam condimentum condimentum sollicitudin. Etiam semper et mi id dapibus.'

describe('Rich Text Area', function () {
  
  var driver

  before(function () {
    driver = new webdriver.Builder()
      .withCapabilities(webdriver.Capabilities.chrome())
      .build()
  })

  beforeEach(function (callback) {
    this.timeout(5000)
    driver.get('file://' + path.join(process.cwd(), 'index.html'))
      .then(callback)
  })

  it('Should be able to avoid race conditions', function (callback) {
    var textareaSelector = webdriver.By.css('#rich-text-area textarea')

    var textarea = driver.findElement(webdriver.By.css('#rich-text-area textarea'))
    
    textarea.sendKeys(DUMMY_STRING)
    
    textarea.getAttribute('value').then(function (value) {
      expect(value).to.equal(DUMMY_STRING)
      callback(null)
    })

  })

  it('Should be able to avoid race conditions with long paragraphs', function (callback) {
    this.timeout(10000)

    var textareaSelector = webdriver.By.css('#rich-text-area textarea')

    var textarea = driver.findElement(webdriver.By.css('#rich-text-area textarea'))
    
    textarea.sendKeys(LONG_PARAGRAPH)
    
    textarea.getAttribute('value').then(function (value) {
      expect(value).to.equal(LONG_PARAGRAPH)
      callback(null)
    })

  })

  after(function (callback) {
    driver.quit()
      .then(callback)
  })
})