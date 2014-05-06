var webdriver = require('selenium-webdriver')
  , path      = require('path')
  , expect    = require('chai').expect

var DUMMY_STRING = 'Simple Programmer'

describe('Rich Text Area', function () {
  
  var driver

  before(function () {
    driver = new webdriver.Builder()
      .withCapabilities(webdriver.Capabilities.chrome())
      .build()
  })

  it('Should be able to be loaded without errors', function (callback) {
    this.timeout(5000)

    driver.get('file://' + path.join(process.cwd(), 'index.html'))
      .then(callback)
  })

  it('Should be able to avoid race conditions', function (callback) {
    var textareaSelector = webdriver.By.css('#rich-text-area textarea')

    var textarea = driver.findElement(webdriver.By.css('#rich-text-area textarea'))
    
    textarea.sendKeys(DUMMY_STRING)
    
    textarea.getAttribute('value').then(function (value) {
      console.log('--->', value)
      expect(value).to.equal(DUMMY_STRING)
      callback(null)
    })

  })

  after(function (callback) {
    driver.quit()
      .then(callback)
  })
})