## Timeline

### Installation

`bower install`
`npm install`
`node_modules/protractor/bin/webdriver-manager update --standalone`
`grunt server`

### Building templates:

`grunt ngtemplates`

### Tests:

#### Unit:
`grunt karma:unit` (PhantomJS)

#### End to end:

1. Start selenium server: `node_modules/protractor/bin/webdriver-manager start`
2. Start Grunt server: `grunt server`
3. Run tests: `node_modules/protractor/bin/protractor protractor_conf.js` (Protractor + Selenium WebDriver + Google Chrome)

Note: sometimes a few tests may fail if chrome jams for a second - we don't know when exactly animations are finished. If tests
are just fine after re-running, everything is okay.
