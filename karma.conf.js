module.exports = function(config) {
    config.set({
        singleRun:   true,
        basePath:    '../..',
        browsers: ['Chrome'],
        frameworks: ['jasmine']
    });
};
