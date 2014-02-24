'use strict';
(function () {

    describe('wh:timeline', function () {
        var ptor;

        browser.driver.manage().window().setSize(1920, 1000);

        beforeEach(function() {
            ptor = protractor.getInstance();
            ptor.ignoreSynchronization = true;
            ptor.get('http://127.0.0.1:9000/');
        });

        it('should find timeline-related elements', function () {
            ptor.debugger();
            expect(element(by.css('.wh-timeline-test')).isPresent()).toBe(false);
            expect(element(by.css('.wh-timeline')).isPresent()).toBe(true);
            expect(element(by.css('.wh-timeline-warning')).isPresent()).toBe(true);
            expect(element(by.css('.wh-timeline-config')).isPresent()).toBe(true);
            expect(element(by.css('.wh-timeline-config .from datepicker-inputs')).isPresent()).toBe(true);
            expect(element(by.css('.wh-timeline-config .from .ui-datepicker')).isPresent()).toBe(true);
            expect(element(by.css('.wh-timeline-config .from timepicker-unix')).isPresent()).toBe(true);
            expect(element(by.css('.wh-timeline-config .to datepicker-inputs')).isPresent()).toBe(true);
            expect(element(by.css('.wh-timeline-config .to .ui-datepicker')).isPresent()).toBe(true);
            expect(element(by.css('.wh-timeline-config .to timepicker-unix')).isPresent()).toBe(true);

            expect(element(by.css('.wh-timeline-side')).isPresent()).toBe(true);
            expect(element(by.css('.wh-timeline-side button')).isPresent()).toBe(true);

            expect(element(by.css('.wh-timeline-widget')).isPresent()).toBe(true);
            expect(element(by.css('.wh-timeline-widget .chart-component')).isPresent()).toBe(true);
            expect(element(by.css('.wh-timeline-widget .chart-component .y-axis-pane')).isPresent()).toBe(true);
            expect(element(by.css('.wh-timeline-widget .chart-component .chart-viewport')).isPresent()).toBe(true);
            expect(element(by.css('.wh-timeline-widget .chart-component .chart-viewport .chart-pane .x-axis-pane')).isPresent()).toBe(true);
            expect(element(by.css('.wh-timeline-widget .chart-component .chart-viewport .chart-pane .state-data')).isPresent()).toBe(true);
            expect(element(by.css('.wh-timeline-widget .chart-data-overlay')).isPresent()).toBe(true);
            expect(element(by.css('.wh-timeline-widget .chart-data-overlay .selections')).isPresent()).toBe(true);
            expect(element(by.css('.wh-timeline-widget .chart-data-overlay .selections .selection-area.period')).isPresent()).toBe(true);
            expect(element(by.css('.wh-timeline-widget .chart-data-overlay .selections .selection-area.period .fixation-delimiter.left')).isPresent()).toBe(true);
            expect(element(by.css('.wh-timeline-widget .chart-data-overlay .selections .selection-area.period .fixation-delimiter.right')).isPresent()).toBe(true);
        });

        it('should draw two charts (monthly and weekly)', function () {
            ptor.findElements(by.css('.wh-timeline-widget .charts > .active')).then(function(elems) {
                expect(elems.length).toBe(2);
            });

            ptor.findElements(by.css('.wh-timeline-widget .charts > .active.main .bar')).then(function(elems) {
                expect(elems.length).toBe(30);
            });

            ptor.findElements(by.css('.wh-timeline-widget .charts > .active.secondary .bar')).then(function(elems) {
                expect(elems.length).toBe(4);
            });
        });

        it('should allow switching time perspectives', function () {
            ptor.findElements(by.css('.wh-timeline-perspective > button')).then(function(elems) {
                expect(elems.length).toBe(2);

                // Let's click "-" and zoom out to monthly perspective
                elems[1].click().then(function() {

                    ptor.findElements(by.css('.wh-timeline-widget .charts > .active')).then(function(elems) {
                        expect(elems.length).toBe(2);
                    });

                    ptor.findElements(by.css('.wh-timeline-widget .charts > .inactive')).then(function(elems) {
                        expect(elems.length).toBe(1);
                    });

                    ptor.findElements(by.css('.wh-timeline-widget .charts > div')).then(function(elems) {
                        expect(elems.length).toBe(3);
                    });

                    ptor.findElements(by.css('.wh-timeline-widget .charts > .active.main .bar')).then(function(elems) {
                        expect(elems.length).toBe(4);
                    });

                    ptor.findElements(by.css('.wh-timeline-widget .charts > .active.secondary .bar')).then(function(elems) {
                        expect(elems.length).toBe(0);
                    });
                });
            });

        });

        it('should block switching time perspectives if that would affect the selection', function () {
            ptor.findElements(by.css('.wh-timeline-perspective > button')).then(function(elems) {
                expect(elems.length).toBe(2);

                // Let's click "+" and try to zoom in to monthly perspective
                elems[0].click().then(function() {
                    ptor.findElements(by.css('.wh-timeline-warning')).then(function(elems) {
                        expect(elems[0].getCssValue('display')).toBe('block');
                        expect(elems[0].getText()).toContain('Ooops, zoom not possible, shrink your selection!');
                    });

                    ptor.findElements(by.css('.wh-timeline-widget .charts > .active')).then(function(elems) {
                        expect(elems.length).toBe(2);
                    });

                    ptor.findElements(by.css('.wh-timeline-widget .charts > .inactive')).then(function(elems) {
                        expect(elems.length).toBe(0);
                    });

                    ptor.findElements(by.css('.wh-timeline-widget .charts > div')).then(function(elems) {
                        expect(elems.length).toBe(2);
                    });

                    ptor.findElements(by.css('.wh-timeline-widget .charts > .active.main .bar')).then(function(elems) {
                        expect(elems.length).toBe(30);
                    });

                    ptor.findElements(by.css('.wh-timeline-widget .charts > .active.secondary .bar')).then(function(elems) {
                        expect(elems.length).toBe(4);
                    });
                });
            });

        });

        it('should make it possible to display a configuration widget', function () {
            var checkIsVisible = function(should) {
                var asserter = expect(ptor.findElement(by.css('.wh-timeline-config')).getAttribute("class"));
                if(should) asserter = asserter.not;
                asserter.toContain("ng-hide")
            };

            checkIsVisible(false);
            ptor.findElements(by.css('.wh-timeline-side > .glyphicon-wrench')).then(function(elems) {
                elems[0].click().then(function() {
                    checkIsVisible(true);

                    ptor.findElements(by.css('.container')).then(function(elems) {
                        elems[0].click().then(function(){
                            checkIsVisible(false);

                            ptor.findElements(by.css('.selection-area.period')).then(function(elems) {
                                elems[0].click().then(function() {
                                    checkIsVisible(true);
                                })
                            });
                        });
                    });
                })
            })
        });


        it('should be possible to manipulate selection', function () {
            var bw = function(callback, i) {
                var cnt = 0;
                return function() {
                    var args = arguments;
                    ptor.wait(function() {
                        if(++cnt < i) return false;
                        callback.apply(null, args);
                        return true;
                    }, 2000);
                };
            };

            var checkSelection = bw(function(css, base, range) {
                if(range === undefined) range = 5
                ptor.findElement(by.css(".selection-area")).getCssValue(css).then(function(value) {
                    var numberVal = (new Number(value.replace("px", ""))).valueOf();
                    expect(numberVal).toBeGreaterThan(base-range)
                    expect(numberVal).toBeLessThan(base+range)
                });
                return true;
            }, 7);

            // Let's wait until timeline is initialized
            bw(function(){
                var selectionPane   = ptor.findElement(by.css(".overlay.selections"));
                var selection   = ptor.findElement(by.css(".selection-area"));
                var leftHandle  = ptor.findElement(by.css(".resize-handler.left"));
                var rightHandle = ptor.findElement(by.css(".resize-handler.right"));

                // Basic selection movement:
                checkSelection('left', 882);
                checkSelection('width', 167);

                ptor.actions().dragAndDrop(selection, {x:-10,y:0}).perform().then(function() {
                    checkSelection('left', 872);
                    checkSelection('width', 167);
                });

                ptor.actions().dragAndDrop(selection, {x:-90,y:0}).perform().then(function() {
                    checkSelection('left', 781);
                    checkSelection('width', 167);
                });

                ptor.actions().dragAndDrop(selection, {x:-1500,y:0}).perform().then(function() {
                    checkSelection('left', 0);
                    checkSelection('width', 167);
                });

                ptor.actions().dragAndDrop(selection, {x:1500,y:0}).perform().then(function() {
                    checkSelection('left', 883);
                    checkSelection('width', 167);
                });

                // Resizing with left handle
                ptor.actions().dragAndDrop(leftHandle, {x:-10,y:0}).perform().then(function() {
                    checkSelection('left', 873);
                    checkSelection('width', 177);
                });

                ptor.actions().dragAndDrop(leftHandle, {x:-90,y:0}).perform().then(function() {
                    checkSelection('left', 783);
                    checkSelection('width', 267);
                });

                ptor.actions().dragAndDrop(leftHandle, {x:1500,y:0}).perform().then(function() {
                    checkSelection('left', 1049);
                    checkSelection('width', 1);
                });

                ptor.actions().dragAndDrop(leftHandle, {x:-1500,y:0}).perform().then(function() {
                    checkSelection('left', 0);
                    checkSelection('width', 1050);
                });

                // Resizing with right handle
                ptor.actions().dragAndDrop(rightHandle, {x:-10,y:0}).perform().then(function() {
                    checkSelection('left', 0);
                    checkSelection('width', 1040);
                });

                ptor.actions().dragAndDrop(rightHandle, {x:-90,y:0}).perform().then(function() {
                    checkSelection('left', 0);
                    checkSelection('width', 950);
                });

                ptor.actions().dragAndDrop(rightHandle, {x:1500,y:0}).perform().then(function() {
                    checkSelection('left', 0);
                    checkSelection('width', 1051);
                });

                ptor.actions().dragAndDrop(rightHandle, {x:-1500,y:0}).perform().then(function() {
                    checkSelection('left', 0);
                    checkSelection('width', 1);
                });

                // Compose new selection
                ptor.actions()
                    .mouseMove(selectionPane)
                    .mouseMove({x: 300, y: 10})
                    .mouseDown()
                    .mouseMove({x: -100, y: 0})
                    .perform()
                    .then(function() {
                        checkSelection('left', 726);
                        checkSelection('width', 100);
                    })
                ;

                ptor.actions()
                    .mouseMove(selectionPane)
                    .mouseMove({x: 0, y: 10})
                    .mouseDown()
                    .mouseMove({x: -1000, y: 0})
                    .perform()
                    .then(function() {
                        checkSelection('left', 0);
                        checkSelection('width', 867);
                    })
                ;

                return true;
            }, 9)();
        });

        /*
        it('should be possible to use sticky selection plugin', function () {

        });

        it('should be possible to scroll chart pane', function () {

        });

        it('should track the selection if tracking is enabled', function () {

        });
        */
    });
})();

