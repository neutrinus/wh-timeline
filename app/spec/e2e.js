'use strict';
(function () {

    describe('wh:timeline', function () {
        var ptor;

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

        var getCssNb = function(elem, name, callback) {
            elem.getCssValue(name).then(function(v) {
                callback((new Number(v.replace('px', ''))).valueOf());
            });
        }

        browser.driver.manage().window().setSize(1920, 1000);

        beforeEach(function() {
            ptor = protractor.getInstance();
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

                elems[1].click();

                ptor.waitForAngular();

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

                // Check if selection size was changed accordingly to the new time perspective
                checkSelection('left', 505);
                checkSelection('width', 39);
            });

        });

        it('should block switching time perspectives if that would affect the selection', function () {
            ptor.findElements(by.css('.wh-timeline-perspective > button')).then(bw(function(elems) {
                expect(elems.length).toBe(2);

                checkSelection('left', 882);
                checkSelection('width', 167);

                // Let's click "+" and try to zoom in to monthly perspective
                elems[0].click();

                ptor.waitForAngular();

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
            }, 15));

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


        it('should be possible to manipulate selection', bw(function () {

            var selectionPane   = ptor.findElement(by.css(".overlay.selections"));
            var selection   = ptor.findElement(by.css(".selection-area"));
            var leftHandle  = ptor.findElement(by.css(".resize-handler.left"));
            var rightHandle = ptor.findElement(by.css(".resize-handler.right"));

            // Basic selection movement:
            checkSelection('left', 882);
            checkSelection('width', 167);

            ptor.actions().dragAndDrop(selection, {x:-10,y:0}).perform().then(function() {
                ptor.waitForAngular();
                checkSelection('left', 872);
                checkSelection('width', 167);
            });

            ptor.actions().dragAndDrop(selection, {x:-90,y:0}).perform().then(function() {
                ptor.waitForAngular();
                checkSelection('left', 781);
                checkSelection('width', 167);
            });

            ptor.actions().dragAndDrop(selection, {x:-1500,y:0}).perform().then(function() {
                ptor.waitForAngular();
                checkSelection('left', 0);
                checkSelection('width', 167);
            });

            ptor.actions().dragAndDrop(selection, {x:1500,y:0}).perform().then(function() {
                ptor.waitForAngular();
                checkSelection('left', 883);
                checkSelection('width', 167);
            });

            // Resizing with left handle
            ptor.actions().dragAndDrop(leftHandle, {x:-10,y:0}).perform().then(function() {
                ptor.waitForAngular();
                checkSelection('left', 873);
                checkSelection('width', 177);
            });

            ptor.actions().dragAndDrop(leftHandle, {x:-90,y:0}).perform().then(function() {
                ptor.waitForAngular();
                checkSelection('left', 783);
                checkSelection('width', 267);
            });

            ptor.actions().dragAndDrop(leftHandle, {x:1500,y:0}).perform().then(function() {
                ptor.waitForAngular();
                checkSelection('left', 1049);
                checkSelection('width', 1);
            });

            ptor.actions().dragAndDrop(leftHandle, {x:-1500,y:0}).perform().then(function() {
                ptor.waitForAngular();
                checkSelection('left', 0);
                checkSelection('width', 1050);
            });

            // Resizing with right handle
            ptor.actions().dragAndDrop(rightHandle, {x:-10,y:0}).perform().then(function() {
                ptor.waitForAngular();
                checkSelection('left', 0);
                checkSelection('width', 1040);
            });

            ptor.actions().dragAndDrop(rightHandle, {x:-90,y:0}).perform().then(function() {
                ptor.waitForAngular();
                checkSelection('left', 0);
                checkSelection('width', 950);
            });

            ptor.actions().dragAndDrop(rightHandle, {x:1500,y:0}).perform().then(function() {
                ptor.waitForAngular();
                checkSelection('left', 0);
                checkSelection('width', 1051);
            });

            ptor.actions().dragAndDrop(rightHandle, {x:-1500,y:0}).perform().then(function() {
                ptor.waitForAngular();
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
                    ptor.waitForAngular();
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
                    ptor.waitForAngular();
                    checkSelection('left', 0);
                })
            ;

        }, 9));

        it('should be possible to use sticky selection plugin', bw(function () {

            var selectionPane = ptor.findElement(by.css(".overlay.selections"));

            ptor.actions()
                .mouseMove(selectionPane)
                .mouseMove({x: 100, y: 10})
                .click()
                .perform()
            ;

            ptor.actions()
                .mouseMove({x: -10, y: 0})
                .perform()
                .then(function() {
                    checkSelection('left',  610);
                    checkSelection('width', 20);
                })
            ;

            ptor.actions()
                .mouseMove({x: -10, y: 0})
                .perform()
                .then(function() {
                    checkSelection('left',  610);
                    checkSelection('width', 20);
                })
            ;

            ptor.actions()
                .mouseMove({x: -10, y: 0})
                .perform()
                .then(function() {
                    checkSelection('left',  610);
                    checkSelection('width', 20);
                })
            ;

            ptor.actions()
                .mouseMove({x: -10, y: 0})
                .perform()
                .then(function() {
                    checkSelection('left',  575);
                    checkSelection('width', 51);
                })
            ;

            ptor.actions()
                .mouseMove({x: -25, y: 0})
                .perform()
                .then(function() {
                    checkSelection('left',  575);
                    checkSelection('width', 51);
                })
            ;

            ptor.actions()
                .mouseMove({x: 250, y: 0})
                .perform()
                .then(function() {
                    checkSelection('left',  625);
                    checkSelection('width', 186);
                })
            ;

            ptor.actions()
                .mouseMove({x: 10, y: 0})
                .perform()
                .then(function() {
                    checkSelection('left',  625);
                    checkSelection('width', 186);
                })
            ;

            ptor.actions()
                .mouseMove({x: 20, y: 0})
                .perform()
                .then(function() {
                    checkSelection('left',  625);
                    checkSelection('width', 220);
                })
            ;

        }, 9));

        it('should be possible to scroll chart pane', bw(function () {

            var selectionPane = ptor.findElement(by.css(".overlay.selections"));
            var selection     = ptor.findElement(by.css(".selection-area"));
            var leftHandle    = ptor.findElement(by.css(".resize-handler.left"));
            var rightHandle   = ptor.findElement(by.css(".resize-handler.right"));

            ptor.actions()
                .mouseDown(rightHandle)
                .mouseMove({x: 500, y: 0})
                .perform()
                .then(function() {
                    var startLeft;  getCssNb(selection, "left",  function(v) { startLeft  = v; });
                    var startWidth; getCssNb(selection, "width", function(v) { startWidth = v; });
                    var nowLeft;
                    var nowWidth;

                    bw(function() {
                        ptor.actions()
                            .mouseUp()
                            .perform()
                            .then(function() {
                                getCssNb(selection, "left",  function(v) { nowLeft  = v; });
                                getCssNb(selection, "width", function(v) {
                                    nowWidth = v;

                                    expect(startLeft).toBeGreaterThan(nowLeft);
                                    expect(startWidth).toBeLessThan(nowWidth);
                                });
                            })
                        ;
                    }, 6)();
                })
            ;

            ptor.actions()
                .mouseDown(rightHandle)
                .mouseMove({x: -800, y: 0})
                .mouseMove({x: -100, y: 0})
                .mouseMove({x: -800, y: 0})
                .perform()
                .then(function() {
                    var startWidth; getCssNb(selection, "width", function(v) { startWidth = v; });
                    var nowWidth;

                    bw(function() {
                        ptor.actions()
                            .mouseUp()
                            .perform()
                            .then(function() {
                                getCssNb(selection, "width", function(v) {
                                    nowWidth = v;

                                    expect(startWidth).toBeLessThan(nowWidth);
                                });
                            })
                        ;
                    }, 6)();
                })
            ;

        }, 9));

        it('should track the selection if tracking is enabled', function () {
            var getSelectedFrom = function() {
                return ptor.findElement(by.css('.calendar.from .form-control[ng-model=seconds]')).getAttribute('value');
            }
            var getSelectedTo = function() {
                return ptor.findElement(by.css('.calendar.to .form-control[ng-model=seconds]')).getAttribute('value');
            }

            var checkIfTracked = function(getter, should) {
                var initialSeconds = getter();
                bw(function(){
                    var finalSeconds = getter();
                    if(should === undefined) should = true;

                    if(should)
                    {
                        expect(initialSeconds).not.toBe(finalSeconds);
                    }
                    else
                    {
                        expect(initialSeconds).toBe(finalSeconds);
                    }
                }, 15)();
            };

            var rightHandle = ptor.findElement(by.css(".resize-handler.right"));

            // Shrink the selection
            ptor.actions()
                .mouseDown(rightHandle)
                .mouseMove({x: -80, y: 0})
                .mouseUp()
                .perform()
            ;

            bw(function(){
                // Check if start is not tracked yet
                checkIfTracked(getSelectedFrom, false)

                // And just make sure the end is still tracked
                checkIfTracked(getSelectedTo)
            }, 5)();


            // Turn on start tracking
            ptor.actions()
                .click(ptor.findElement(by.css('.wh-timeline-side > .glyphicon-wrench')))
                .click(ptor.findElement(by.css('.calendar.from [ng-model*="is_start_tracked"][ng-value="true"]')))
                .perform()
            ;

            bw(function(){
                // Check if start is now tracked too
                checkIfTracked(getSelectedFrom)

                // And just make sure the end is still tracked
                checkIfTracked(getSelectedTo)
            }, 5)();

            // Make sure it is not possible to track start and not track end
            ptor.actions()
                .click(ptor.findElement(by.css('.calendar.to [ng-model*="is_end_tracked"][ng-value="false"]')))
                .perform()
                .then(function() {
                    expect(ptor.findElement(by.css('.calendar.to [ng-model*="is_end_tracked"][ng-value="false"]')).getAttribute('checked')).toBeFalsy()
                })
            ;

            // Turn off start tracking
            ptor.actions()
                .click(ptor.findElement(by.css('.calendar.from [ng-model*="is_start_tracked"][ng-value="false"]')))
                .perform()
            ;

            bw(function(){
                // Check if start is not tracked anymore
                checkIfTracked(getSelectedFrom, false)

                // And just make sure the end is still tracked
                checkIfTracked(getSelectedTo)
            }, 5)();

            // Turn off end tracking
            ptor.actions()
                .click(ptor.findElement(by.css('.calendar.to [ng-model*="is_end_tracked"][ng-value="false"]')))
                .perform()
            ;

            bw(function(){
                // Check if start is not tracked anymore
                checkIfTracked(getSelectedFrom, false)

                // Check if end is not tracked anymore
                checkIfTracked(getSelectedTo, false)
            }, 5)();

        });


        it('should reflect any changes performed in the configuration widget', function () {
            var selectionPane = ptor.findElement(by.css(".overlay.selections"));
            var selection     = ptor.findElement(by.css(".selection-area"));

            ptor.actions()
                .click(ptor.findElement(by.css('.wh-timeline-side > .glyphicon-wrench')))
                .perform()
            ;
            ptor.waitForAngular();

            var fromYearsElem = ptor.findElement(by.css('.wh-timeline-config .calendar.from [ng-model="Years"]'));
            fromYearsElem.clear();
            fromYearsElem.sendKeys("2012");
            ptor.actions()
                .click(ptor.findElement(by.css('.wh-timeline-config')))
                .perform()
            ;
            ptor.waitForAngular();

            bw(function() {
                getCssNb(selection, "left",  function(left) { expect(left).toBe(0);    })
                getCssNb(selection, "width", function(left) { expect(left).toBe(1048); })
            }, 15)();

            var day30OfDec2012 = ptor.findElement(by.css('.wh-timeline-config .calendar.from .ui-datepicker-calendar tbody tr:last-child td:first-child a'));
            ptor.actions()
                .click(day30OfDec2012)
                .perform()
            ;
            ptor.waitForAngular();

            bw(function() {
                getCssNb(selection, "left",  function(left) { expect(left).toBe(77);  })
                getCssNb(selection, "width", function(left) { expect(left).toBe(971); })
            }, 15)();
        });

        it('should reflect any changes performed on the selection directly', function () {
            var selection = ptor.findElement(by.css(".selection-area"));

            var fromYearsElem  = ptor.findElement(by.css('.wh-timeline-config .calendar.from [ng-model="Years"]'));
            var fromMonthsElem = ptor.findElement(by.css('.wh-timeline-config .calendar.from [ng-model="Months"]'));
            var fromDaysElem   = ptor.findElement(by.css('.wh-timeline-config .calendar.from [ng-model="Days"]'));

            var toYearsElem  = ptor.findElement(by.css('.wh-timeline-config .calendar.to [ng-model="Years"]'));
            var toMonthsElem = ptor.findElement(by.css('.wh-timeline-config .calendar.to [ng-model="Months"]'));
            var toDaysElem   = ptor.findElement(by.css('.wh-timeline-config .calendar.to [ng-model="Days"]'));

            ptor.actions().click(ptor.findElement(by.css('.wh-timeline-side > .glyphicon-wrench'))).perform();

            expect(fromYearsElem.getAttribute("value")).toBe("2013")
            expect(fromMonthsElem.getAttribute("value")).toBe("12")
            expect(fromDaysElem.getAttribute("value")).toBe("01")
            expect(ptor.findElement(by.css('.wh-timeline-config .calendar.from .ui-datepicker-calendar a.ui-state-active')).getText()).toBe("1");

            expect(toYearsElem.getAttribute("value")).toBe("2014")
            expect(toMonthsElem.getAttribute("value")).toBe("01")
            expect(toDaysElem.getAttribute("value")).toBe("04")
            expect(ptor.findElement(by.css('.wh-timeline-config .calendar.to .ui-datepicker-calendar a.ui-state-active')).getText()).toBe("4");

            ptor.actions()
                .mouseDown(selection)
                .mouseMove({x: -80, y: 0})
                .mouseUp()
                .perform()
            ;

            bw(function() {
                ptor.waitForAngular();

                expect(fromYearsElem.getAttribute("value")).toBe("2013")
                expect(fromMonthsElem.getAttribute("value")).toBe("11")
                expect(fromDaysElem.getAttribute("value")).toBe("14")
                expect(ptor.findElement(by.css('.wh-timeline-config .calendar.from .ui-datepicker-calendar a.ui-state-active')).getText()).toBe("14");

                expect(toYearsElem.getAttribute("value")).toBe("2013")
                expect(toMonthsElem.getAttribute("value")).toBe("12")
                expect(toDaysElem.getAttribute("value")).toBe("18")
                expect(ptor.findElement(by.css('.wh-timeline-config .calendar.to .ui-datepicker-calendar a.ui-state-active')).getText()).toBe("18");
            }, 5)();

            ptor.actions()
                .mouseDown(selection)
                .mouseMove({x: -200, y: 0})
                .mouseUp()
                .perform()
            ;

            bw(function() {
                ptor.waitForAngular();

                expect(fromYearsElem.getAttribute("value")).toBe("2013")
                expect(fromMonthsElem.getAttribute("value")).toBe("10")
                expect(fromDaysElem.getAttribute("value")).toBe("03")
                expect(ptor.findElement(by.css('.wh-timeline-config .calendar.from .ui-datepicker-calendar a.ui-state-active')).getText()).toBe("3");

                expect(toYearsElem.getAttribute("value")).toBe("2013")
                expect(toMonthsElem.getAttribute("value")).toBe("11")
                expect(toDaysElem.getAttribute("value")).toBe("07")
                expect(ptor.findElement(by.css('.wh-timeline-config .calendar.to .ui-datepicker-calendar a.ui-state-active')).getText()).toBe("7");

            }, 5)();

            ptor.actions()
                .mouseDown(selection)
                .mouseMove({x: 100, y: 0})
                .mouseUp()
                .perform()
            ;

            bw(function() {
                ptor.waitForAngular();

                expect(fromYearsElem.getAttribute("value")).toBe("2013")
                expect(fromMonthsElem.getAttribute("value")).toBe("10")
                expect(fromDaysElem.getAttribute("value")).toBe("24")
                expect(ptor.findElement(by.css('.wh-timeline-config .calendar.from .ui-datepicker-calendar a.ui-state-active')).getText()).toBe("24");

                expect(toYearsElem.getAttribute("value")).toBe("2013")
                expect(toMonthsElem.getAttribute("value")).toBe("11")
                expect(toDaysElem.getAttribute("value")).toBe("27")
                expect(ptor.findElement(by.css('.wh-timeline-config .calendar.to .ui-datepicker-calendar a.ui-state-active')).getText()).toBe("27");

            }, 5)();

        });
    });
})();

