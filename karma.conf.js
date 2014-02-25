module.exports = function(config) {
    config.set({
        basePath: './',

        files: [
            'app/bower_components/angular/angular.js',
            'app/bower_components/angular-mocks/angular-mocks.js',
            // 'app/bower_components/angular-scenario/angular-scenario.js',
            "app/bower_components/jquery/jquery.js",
            "app/bower_components/modernizr/modernizr.js",
            "app/bower_components/bootstrap/dist/js/bootstrap.js",
            "app/bower_components/angular/angular.js",
            "app/bower_components/jquery-ui/ui/jquery-ui.js",
            "app/bower_components/d3/d3.js",
            "app/bower_components/angular-ui-date/src/date.js",
            "app/bower_components/jquery-mousewheel/jquery.mousewheel.js",
            "app/bower_components/underscore/underscore.js",

            "app/bower_components/jquery/jquery.js",

            "app/scripts/angular.timepicker.js",
            "app/scripts/jquery-selectableArea.js",
            "app/scripts/wh-timeline.js",
            "app/scripts/wh-timeline-selection.js",
            "app/scripts/wh-timeline-chart.js",
            "app/scripts/wh-timeline-utils.js",
        
            "app/scripts/templates.js",

            // 'test/lib/angular/angular-mocks.js',
            'test/unit/**/*.js'
        ],

        exclude: [ ],
        autoWatch: true,
        frameworks: ['jasmine'],
        browsers: ['PhantomJS'],

        plugins: [
            'karma-junit-reporter',
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-jasmine',
            'karma-phantomjs-launcher'
        ],

        junitReporter: {
            outputFile: 'test_out/unit.xml',
            suite: 'unit'
        }

    })
};
