angular.module('ui.bootstrap.timepicker', [])

    .constant('timepickerConfig', {
        hourStep: 1,
        minuteStep: 1,
        showMeridian: true,
        meridians: null,
        readonlyInput: false,
        mousewheel: true
    })

    .directive('timepicker', ['$parse', '$log', 'timepickerConfig', '$locale', '$templateCache', function ($parse, $log, timepickerConfig, $locale, $templateCache) {
        return {
            restrict: 'EA',
            require:'?^ngModel',
            replace: true,
            scope: {
                ngModel: '='
            },
            template: $templateCache.get('templates/timepicker.html'),
            link: function(scope, element, attrs, ngModel) {
                if ( !ngModel ) {
                    return; // do nothing if no ng-model
                }

                var selected = new Date();

                var hourStep = timepickerConfig.hourStep;
                if (attrs.hourStep) {
                    scope.$parent.$watch($parse(attrs.hourStep), function(value) {
                        hourStep = parseInt(value, 10);
                    });
                }

                var minuteStep = timepickerConfig.minuteStep;
                if (attrs.minuteStep) {
                    scope.$parent.$watch($parse(attrs.minuteStep), function(value) {
                        minuteStep = parseInt(value, 10);
                    });
                }
                var secondStep = timepickerConfig.secondStep;
                if (attrs.secondStep) {
                    scope.$parent.$watch($parse(attrs.secondStep), function(value) {
                        secondStep = parseInt(value, 10);
                    });
                }

                // Get scope.hours in 24H mode if valid
                function getHoursFromTemplate ( ) {
                    var hours = parseInt( scope.hours, 10 );
                    var valid = hours >= 0 && hours < 24;
                    if ( !valid ) {
                        return undefined;
                    }

                    return hours;
                }

                function getMinutesFromTemplate() {
                    var minutes = parseInt(scope.minutes, 10);
                    return ( minutes >= 0 && minutes < 60 ) ? minutes : undefined;
                }

                function getSecondsFromTemplate() {
                    var seconds = parseInt(scope.seconds, 10);
                    return ( seconds >= 0 && seconds < 60 ) ? seconds : undefined;
                }

                function pad( value ) {
                    return ( angular.isDefined(value) && value.toString().length < 2 ) ? '0' + value : value;
                }

                // Input elements
                var inputs = element.find('input'), hoursInputEl = inputs.eq(0), minutesInputEl = inputs.eq(1), secondsInputEl = inputs.eq(2);

                // Respond on mousewheel spin
                var mousewheel = (angular.isDefined(attrs.mousewheel)) ? scope.$eval(attrs.mousewheel) : timepickerConfig.mousewheel;
                if ( mousewheel ) {

                    var isScrollingUp = function(e) {
                        if (e.originalEvent) {
                            e = e.originalEvent;
                        }
                        //pick correct delta variable depending on event
                        var delta = (e.wheelDelta) ? e.wheelDelta : -e.deltaY;
                        return (e.detail || delta > 0);
                    };

                    hoursInputEl.bind('mousewheel wheel', function(e) {
                        scope.$apply( (isScrollingUp(e)) ? scope.incrementHours() : scope.decrementHours() );
                        e.preventDefault();
                    });

                    minutesInputEl.bind('mousewheel wheel', function(e) {
                        scope.$apply( (isScrollingUp(e)) ? scope.incrementMinutes() : scope.decrementMinutes() );
                        e.preventDefault();
                    });

                    secondsInputEl.bind('mousewheel wheel', function(e) {
                        scope.$apply( (isScrollingUp(e)) ? scope.incrementSeconds() : scope.decrementSeconds() );
                        e.preventDefault();
                    });
                }

                scope.readonlyInput = (angular.isDefined(attrs.readonlyInput)) ? scope.$eval(attrs.readonlyInput) : timepickerConfig.readonlyInput;
                if ( ! scope.readonlyInput ) {

                    var invalidate = function(invalidHours, invalidMinutes) {
                        ngModel.$setViewValue( null );
                        ngModel.$setValidity('time', false);
                        if (angular.isDefined(invalidHours)) {
                            scope.invalidHours = invalidHours;
                        }
                        if (angular.isDefined(invalidMinutes)) {
                            scope.invalidMinutes = invalidMinutes;
                        }
                    };

                    scope.updateHours = function() {
                        var hours = getHoursFromTemplate();

                        if ( angular.isDefined(hours) ) {
                            selected.setUTCHours( hours );
                            refresh( 'h' );
                        } else {
                            invalidate(true);
                        }
                    };

                    hoursInputEl.bind('blur', function(e) {
                        if ( !scope.validHours && scope.hours < 10) {
                            scope.$apply( function() {
                                scope.hours = pad( scope.hours );
                            });
                        }
                    });

                    scope.updateMinutes = function() {
                        var minutes = getMinutesFromTemplate();

                        if ( angular.isDefined(minutes) ) {
                            selected.setUTCMinutes( minutes );
                            refresh( 'm' );
                        } else {
                            invalidate(undefined, true);
                        }
                    };

                    minutesInputEl.bind('blur', function(e) {
                        if ( !scope.invalidMinutes && scope.minutes < 10 ) {
                            scope.$apply( function() {
                                scope.minutes = pad( scope.minutes );
                            });
                        }
                    });
                } else {
                    scope.updateHours = angular.noop;
                    scope.updateMinutes = angular.noop;
                    scope.updateSeconds = angular.noop;
                }

                ngModel.$render = function() {
                    var date = ngModel.$modelValue ? new Date( ngModel.$modelValue ) : null;

                    if ( isNaN(date) ) {
                        ngModel.$setValidity('time', false);
                        $log.error('Timepicker directive: "ng-model" value must be a Date object, a number of milliseconds since 01.01.1970 or a string representing an RFC2822 or ISO 8601 date.');
                    } else {
                        if ( date ) {
                            selected = date;
                        }
                        makeValid();
                        updateTemplate();
                    }
                };

                // Call internally when we know that model is valid.
                function refresh( keyboardChange ) {
                    makeValid();

                    ngModel.$setViewValue( new Date(selected) );

                    updateTemplate( keyboardChange );
                }

                function makeValid() {
                    ngModel.$setValidity('time', true);
                    scope.invalidHours = false;
                    scope.invalidMinutes = false;
                    scope.invalidSeconds = false;
                }

                function updateTemplate( keyboardChange ) {
                    var hours = selected.getUTCHours(), minutes = selected.getUTCMinutes(), seconds = selected.getUTCSeconds();

                    scope.hours =  keyboardChange === 'h' ? hours : pad(hours);
                    scope.minutes = keyboardChange === 'm' ? minutes : pad(minutes);
                    scope.seconds = keyboardChange === 's' ? seconds : pad(seconds);

                    setTimeout(function(){scope.$apply()});
                }

                function addMinutes( minutes ) {
                    selected.setTime( selected.getTime() + minutes * 60000 );
                    refresh();
                }

                scope.incrementHours = function() {
                    addMinutes( hourStep * 60 );
                };
                scope.decrementHours = function() {
                    addMinutes( - hourStep * 60 );
                };
                scope.incrementMinutes = function() {
                    addMinutes( minuteStep );
                };
                scope.decrementMinutes = function() {
                    addMinutes( - minuteStep );
                };
                scope.incrementSeconds = function() {
                    addMinutes( minuteStep / 60 );
                };
                scope.decrementSeconds = function() {
                    addMinutes( - minuteStep / 60 );
                };
            }
        };
    }]);
