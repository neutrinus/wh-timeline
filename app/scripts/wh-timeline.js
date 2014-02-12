(function() {
  'use strict';
  var getUnix, to_hash,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  getUnix = function(date) {
    if (date == null) {
      date = new Date();
    }
    return Math.floor(date.getTime() / 1000 + 0.0000001);
  };

  to_hash = function(pairs) {
    var hash, key, value, _i, _len, _ref;
    hash = {};
    for (_i = 0, _len = pairs.length; _i < _len; _i++) {
      _ref = pairs[_i], key = _ref[0], value = _ref[1];
      hash[key] = value;
    }
    return hash;
  };

  angular.module('wh.timeline', ['ui.date', 'ui.bootstrap.timepicker']).directive('whTimeline', [
    'wh.timeline.chart.Chart', 'wh.timeline.chart.ChartDataModel', 'wh.timeline.chart.ChartViewModel', 'wh.timeline.chart.D3ChartManager', 'wh.timeline.chart.view.Histogram', 'wh.timeline.utils.TimeInterval', '$timeout', '$interval', '$q', '$window', '$templateCache', (function(Chart, ChartDataModel, ChartViewModel, D3ChartManager, HistogramView, TimeInterval, $timeout, $interval, $q, $window, $templateCache) {
      var chartManagerDeferred;
      chartManagerDeferred = $q.defer();
      return {
        restrict: 'E',
        require: ['ngModel', 'whTimeline'],
        replace: true,
        scope: {
          ngModel: '='
        },
        template: $templateCache.get('templates/wh-timeline.html'),
        link: function(scope, element, attrs, controllers) {
          var chartManager, findDataForTimePerspective, ngModel, whTimeline,
            _this = this;
          ngModel = controllers[0], whTimeline = controllers[1];
          window.scope = scope;
          scope.adjustingSelection = false;
          scope.visibleTimePerspectives = null;
          scope.getVisibleTimeInterval = function() {
            return new TimeInterval(scope.ngModel.visible_start, scope.ngModel.visible_end, true);
          };
          findDataForTimePerspective = function(perspective, dataType) {
            var chunk, _i, _len, _ref;
            _ref = ngModel.$modelValue.data;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              chunk = _ref[_i];
              if (chunk.name === perspective) {
                return chunk[dataType];
              }
            }
          };
          ngModel.$formatters.unshift(function(value) {
            return $.extend(true, {}, value);
          });
          ngModel.$parsers.push(function(value) {
            return $.extend(true, {}, value);
          });
          scope.setTimePerspectives = function(newTimePerspectives) {
            var binWidth, chart, dataModel, elem, perspective, readyForRendering, _i, _len, _ref;
            if (angular.equals(newTimePerspectives, scope.visibleTimePerspectives)) {
              return;
            }
            console.log('la grimas - prevent additional calls');
            readyForRendering = true;
            scope.visibleTimePerspectives = newTimePerspectives;
            _ref = scope.visibleTimePerspectives;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              perspective = _ref[_i];
              elem = chartManager.getChart(perspective);
              if (elem) {
                chart = elem.chart;
                dataModel = chart.dataModel;
              } else {
                binWidth = 0;
                dataModel = new ChartDataModel(perspective, findDataForTimePerspective(perspective, 'bin_width'));
                chart = new Chart(dataModel);
                chartManager.manageChart(chart, HistogramView);
              }
              dataModel.updateRaw(findDataForTimePerspective(perspective, 'raw'));
              dataModel.updateState(findDataForTimePerspective(perspective, 'state'));
            }
            chartManager.updateVisibleTimeInterval(scope.getVisibleTimeInterval());
            chartManager.setActiveCharts(scope.visibleTimePerspectives);
            return chartManager.renderCurrentState();
          };
          scope.chartManager = chartManager = new D3ChartManager(new ChartViewModel(element.find('.wh-timeline-widget .svg-area')));
          chartManager.beforeRender = function() {
            if (!scope.$$phase && !scope.$root.$$phase) {
              return scope.$apply();
            }
          };
          chartManagerDeferred.resolve(chartManager);
          angular.element($window).bind('resize', function() {
            chartManager.refreshPaneDimensions();
            return scope.$apply();
          });
          scope.$watch((function() {
            var elem;
            return ((function() {
              var _i, _len, _ref, _results;
              _ref = ngModel.$modelValue.data;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                elem = _ref[_i];
                _results.push(elem.epoch_state + elem.epoch_raw);
              }
              return _results;
            })()).reduce(function(t, s) {
              return t + s;
            });
          }), (function(current, previous) {
            var dataModel, elem, _i, _len, _ref;
            ngModel.$modelValue.data.sort(function(e1, e2) {
              return e1.bin_width < e2.bin_width;
            });
            if (current === previous) {
              return;
            }
            _ref = chartManager.getActiveCharts();
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              elem = _ref[_i];
              dataModel = elem.chart.dataModel;
              dataModel.updateRaw(findDataForTimePerspective(dataModel.perspective, 'raw'));
              dataModel.updateState(findDataForTimePerspective(dataModel.perspective, 'state'));
            }
            return chartManager.renderCurrentState();
          }), true);
          scope.$watchCollection('[ngModel.visible_start, ngModel.visible_end]', (function() {
            chartManager.updateVisibleTimeInterval(scope.getVisibleTimeInterval());
            return chartManager.renderCurrentState();
          }));
          /*
          scope.states = []
          scope.$watch('timePerspective.active', ((newV) ->
              main = chartManager.getMainActiveChart()
              scope.states = []
              for state in main.chart.dataModel.processedStateData
                  left = chartManager.dateToX(state.startDate)
                  right = chartManager.dateToX(state.endDate)
                  scope.states.push {
                      left: left
                      width: right - left
                      state: state.state
                  }
          ))
          */

          $(document).on('click', function(e) {
            var $target;
            $target = $(e.target);
            if ($target.closest(element).length === 0 && $target.closest('.wh-timeline-config').length === 0 && $target.closest('.ui-datepicker-header').length === 0) {
              scope.adjustingSelection = false;
              scope.$digest();
            }
            return true;
          });
          return 1;
        },
        controller: function($scope, $element, $attrs) {
          this.getChartManager = function() {
            return $scope.chartManager;
          };
          this.chartManagerPromise = function() {
            return chartManagerDeferred.promise;
          };
          this.setActiveTimePerspective = function(newActive) {
            var idx, length, visible, _i, _ref;
            visible = [newActive];
            length = $scope.ngModel.data.length;
            for (idx = _i = _ref = length - 1; _i >= 0; idx = _i += -1) {
              if ($scope.ngModel.data[idx].name === newActive) {
                if (idx < length) {
                  visible.push($scope.ngModel.data[idx - 1].name);
                }
                break;
              }
            }
            return $scope.setTimePerspectives(visible);
          };
          this.setVisibleTimePerspectives = function(visible) {
            return $scope.setTimePerspectives(visible);
          };
          this.getVisibleTimePerspectives = function() {
            return $scope.visibleTimePerspectives;
          };
          this.getData = function() {
            return $scope.ngModel.data;
          };
          return this;
        }
      };
    })
  ]).directive('whTimelinePerspectivePicker', [
    '$templateCache', function($templateCache) {
      return {
        restrict: 'E',
        replace: true,
        require: ['ngModel', '^whTimeline'],
        scope: {
          ngModel: '=',
          onZoomRejected: '&'
        },
        template: $templateCache.get('templates/wh-timeline-perspective-picker.html'),
        link: function(scope, element, attrs, controllers) {
          var ngModel, whTimeline;
          ngModel = controllers[0], whTimeline = controllers[1];
          ngModel.$formatters.unshift(function(value) {
            var activeEntries, chunk, previouslyActive;
            value = $.extend({}, value);
            value.data.sort(function(e1, e2) {
              return e1.bin_width < e2.bin_width;
            });
            previouslyActive = scope.active;
            activeEntries = ((function() {
              var _i, _len, _ref, _results;
              _ref = value.data;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                chunk = _ref[_i];
                if (chunk.active) {
                  _results.push(chunk.name);
                }
              }
              return _results;
            })()).reverse();
            scope.active = activeEntries[0];
            if (previouslyActive !== scope.active) {
              whTimeline.setVisibleTimePerspectives(activeEntries);
            }
            scope.available = (function() {
              var _i, _len, _ref, _results;
              _ref = value.data;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                chunk = _ref[_i];
                _results.push(chunk.name);
              }
              return _results;
            })();
            scope.binWidths = to_hash((function() {
              var _i, _len, _ref, _results;
              _ref = value.data;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                chunk = _ref[_i];
                _results.push([chunk.name, chunk.bin_width]);
              }
              return _results;
            })());
            return value;
          });
          ngModel.$parsers.push(function(value) {
            var chunk, _i, _len, _ref, _ref1;
            value = $.extend({}, value);
            _ref = value.data;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              chunk = _ref[_i];
              chunk.active = (_ref1 = chunk.name, __indexOf.call(scope.visible, _ref1) >= 0);
            }
            return value;
          });
          scope.active = null;
          scope.visible = null;
          scope.available = null;
          scope.binWidths = null;
          scope["switch"] = function(how) {
            var binWidthRatio, currentIdx, deltaIdx, deltaVisible, factor, newActive, newIdx, projectedEnd, projectedStart, selectedSeconds, visibleSeconds, _ref, _ref1;
            switch (how) {
              case '+':
              case 1:
              case true:
                deltaIdx = 1;
                break;
              case '/':
              case 0:
                deltaIdx = 0;
                break;
              case '-':
              case -1:
              case false:
                deltaIdx = -1;
            }
            currentIdx = scope.available.indexOf(scope.active);
            if (currentIdx === -1) {
              return;
            }
            newIdx = currentIdx + deltaIdx;
            if (!(newIdx in scope.available)) {
              return;
            }
            newActive = scope.available[newIdx];
            visibleSeconds = ngModel.$modelValue.visible_end - ngModel.$modelValue.visible_start;
            selectedSeconds = ngModel.$modelValue.selected_end - ngModel.$modelValue.selected_start;
            binWidthRatio = scope.binWidths[newActive] / scope.binWidths[scope.active];
            binWidthRatio = Math.max(1, binWidthRatio) - Math.min(1, binWidthRatio);
            factor = deltaIdx > 0 ? 1 : -1;
            deltaVisible = Math.ceil(binWidthRatio * visibleSeconds / 2) * factor;
            projectedStart = ngModel.$viewValue.selected_start + selectedSeconds / 2 - visibleSeconds / 2;
            projectedEnd = projectedStart + visibleSeconds;
            projectedStart += deltaVisible;
            projectedEnd -= deltaVisible;
            if (!(((projectedStart <= (_ref1 = ngModel.$viewValue.selected_start) && _ref1 <= (_ref = ngModel.$viewValue.selected_end)) && _ref <= projectedEnd))) {
              scope.onZoomRejected();
              return;
            }
            scope.active = newActive;
            scope.visible = [newActive];
            if (newIdx - 1 in scope.available) {
              scope.visible.push(scope.available[newIdx - 1]);
            }
            ngModel.$viewValue.visible_start = projectedStart;
            ngModel.$viewValue.visible_end = projectedEnd;
            if (ngModel.$viewValue.selected_start > ngModel.$viewValue.selected_end) {
              ngModel.$viewValue.selected_start = ngModel.$viewValue.selected_end;
            }
            ngModel.$setViewValue(ngModel.$viewValue);
            return whTimeline.setVisibleTimePerspectives(scope.visible);
          };
          return element.closest('.wh-timeline').find('.chart-area').bind('mousewheel', function(e) {
            e.preventDefault();
            scope["switch"](e.deltaY > 0);
            if (!scope.$$phase && !scope.$root.$$phase) {
              return scope.$apply();
            }
          });
        }
      };
    }
  ]).directive('whTimelineSelectionConfig', [
    '$timeout', '$templateCache', (function($timeout, $templateCache) {
      return {
        restrict: 'E',
        replace: true,
        require: ['ngModel', '^whTimeline'],
        scope: {
          ngModel: '=',
          selectedStart: '=',
          selectedEnd: '=',
          isStartTracked: '=',
          isEndTracked: '=',
          visibleStart: '=',
          visibleEnd: '='
        },
        template: $templateCache.get('templates/wh-timeline-selection-config.html'),
        link: function(scope, element, attrs, controllers) {
          var ngModel, whTimeline;
          ngModel = controllers[0], whTimeline = controllers[1];
          scope.start = null;
          scope.end = null;
          scope.$watch('[start, end]', (function(timestamps, oldTimestamps) {
            if (timestamps === oldTimestamps) {
              return;
            }
            if (timestamps[0] === ngModel.$modelValue.selected_start && timestamps[1] === ngModel.$modelValue.selected_end) {
              return;
            }
            ngModel.$viewValue.selected_start = timestamps[0];
            ngModel.$viewValue.selected_end = timestamps[1];
            return ngModel.$setViewValue(ngModel.$viewValue);
          }), true);
          scope.$watch('[ngModel.is_start_tracked, ngModel.is_end_tracked]', (function(newV, oldV) {
            if (scope.ngModel.is_start_tracked && !scope.ngModel.is_end_tracked) {
              scope.ngModel.is_start_tracked = oldV[0], scope.ngModel.is_end_tracked = oldV[1];
            }
            ngModel.$viewValue.is_start_tracked = scope.ngModel.is_start_tracked;
            ngModel.$viewValue.is_end_tracked = scope.ngModel.is_end_tracked;
            return ngModel.$setViewValue(ngModel.$viewValue);
          }), true);
          ngModel.$formatters.push(function(modelValue) {
            scope.start = modelValue.selected_start;
            scope.end = modelValue.selected_end;
            return $.extend({}, modelValue);
          });
          ngModel.$parsers.push(function(viewValue) {
            var binWidthPx, calcBinWidth, chunk, i, tooLittleVisible, visible, visibleArea, visibleSeconds, _i, _j, _len, _ref, _ref1, _ref2, _ref3, _ref4;
            if (!viewValue.is_period) {
              viewValue.selected_end = viewValue.selected_start;
            }
            visibleSeconds = viewValue.visible_end - viewValue.visible_start;
            tooLittleVisible = !(((viewValue.visible_start <= (_ref1 = viewValue.selected_start) && _ref1 <= (_ref = viewValue.selected_end)) && _ref <= viewValue.visible_end));
            if (tooLittleVisible) {
              if (viewValue.visible_start > viewValue.selected_start) {
                viewValue.visible_start = viewValue.selected_start;
              }
              if (viewValue.visible_end < viewValue.selected_end) {
                viewValue.visible_end = viewValue.selected_end;
              }
              viewValue.visible_start = Math.min(viewValue.selected_start, viewValue.visible_end - visibleSeconds);
              viewValue.visible_end = Math.max(viewValue.selected_end, viewValue.visible_start + visibleSeconds);
            }
            visibleSeconds = viewValue.visible_end - viewValue.visible_start;
            visibleArea = whTimeline.getChartManager().viewModel.dataArea.width;
            calcBinWidth = function(binWidth) {
              var binWidthRatio;
              binWidthRatio = visibleSeconds / binWidth;
              return visibleArea / binWidthRatio;
            };
            binWidthPx = calcBinWidth(whTimeline.getChartManager().getMainActiveChart().chart.dataModel.binWidth);
            if (binWidthPx < 10) {
              ngModel.$viewValue.data.sort(function(e1, e2) {
                return e1.bin_width < e2.bin_width;
              });
              for (i = _i = _ref2 = ngModel.$viewValue.data.length - 1; _i >= 0; i = _i += -1) {
                chunk = ngModel.$viewValue.data[i];
                binWidthPx = calcBinWidth(chunk.bin_width);
                if (binWidthPx >= 10) {
                  break;
                }
              }
              whTimeline.setActiveTimePerspective(chunk.name);
              visible = whTimeline.getVisibleTimePerspectives();
              _ref3 = viewValue.data;
              for (_j = 0, _len = _ref3.length; _j < _len; _j++) {
                chunk = _ref3[_j];
                chunk.active = (_ref4 = chunk.name, __indexOf.call(visible, _ref4) >= 0);
              }
            }
            scope.start = viewValue.selected_start;
            scope.end = viewValue.selected_end;
            return $.extend({}, viewValue);
          });
          scope.predefinedChoice = null;
          return scope.$watch('predefinedChoice', function(newChoice) {
            var newPadding, selectedSeconds, tooMuchVisible, visibleSeconds;
            if (!newChoice) {
              return;
            }
            ngModel.$viewValue.selected_start = newChoice.start;
            ngModel.$viewValue.selected_end = newChoice.end;
            ngModel.$viewValue.is_start_tracked = newChoice.start_tracked;
            ngModel.$viewValue.is_end_tracked = newChoice.end_tracked;
            visibleSeconds = ngModel.$viewValue.visible_end - ngModel.$viewValue.visible_start;
            selectedSeconds = ngModel.$viewValue.selected_end - ngModel.$viewValue.selected_start;
            tooMuchVisible = visibleSeconds > selectedSeconds * 20;
            if (tooMuchVisible) {
              newPadding = selectedSeconds * 20 / 3;
              ngModel.$viewValue.visible_start = ngModel.$viewValue.selected_start - newPadding;
              ngModel.$viewValue.visible_end = ngModel.$viewValue.selected_end + newPadding;
            }
            ngModel.$setViewValue(ngModel.$viewValue);
            return scope.predefinedChoice = null;
          });
        }
      };
    })
  ]).directive('whTimelineSelections', [
    '$timeout', '$interval', '$templateCache', 'wh.timeline.selection.plugin.ChartPanePlugin', 'wh.timeline.selection.plugin.StickySelectionPlugin', 'wh.timeline.selection.SelectionAreaManager', 'wh.timeline.selection.strategy.SingleSelectionAreaManagementStrategy', 'wh.timeline.selection.nodeResolver.SingleSelectionAreaNodeResolver', 'wh.timeline.selection.SelectionArea', (function($timeout, $interval, $templateCache, ChartPanePlugin, StickySelectionPlugin, SelectionAreaManager, SingleSelectionAreaManagementStrategy, SingleSelectionAreaNodeResolver, SelectionArea) {
      return {
        restrict: 'E',
        require: ['ngModel', '^whTimeline'],
        replace: true,
        scope: {
          ngModel: '=',
          adjustingSelection: '='
        },
        template: $templateCache.get('templates/wh-timeline-selections.html'),
        link: function(scope, element, attrs, controllers) {
          var chartManager, ngModel, oldSelection, onUserInteraction, prevTime, selectionElement, selectionPane, throttledUpdateModel, updateModel, whTimeline,
            _this = this;
          ngModel = controllers[0], whTimeline = controllers[1];
          selectionPane = element;
          selectionElement = function() {
            return element.find('.selection-area');
          };
          oldSelection = null;
          element.on('mousedown', '.selection-area', function() {
            oldSelection = $.extend(true, {}, scope.selectionManager.selections[0]);
            return true;
          });
          element.on('mouseup', '.selection-area', function() {
            if (oldSelection && oldSelection.equals(scope.selectionManager.selections[0]) && scope.selectionManager.selections[0].overflow === 0) {
              scope.adjustingSelection = !scope.adjustingSelection;
              scope.$apply();
            }
            return true;
          });
          ngModel.$formatters.unshift(function(value) {
            value = $.extend({}, value);
            value.isNewSelection = scope.selectionManager.selections.length === 0;
            if (value.isNewSelection) {
              scope.selectionManager.selections[0] = new SelectionArea();
            }
            $timeout(function() {
              var selectionLeft, selectionRight, selectionWidth;
              selectionLeft = whTimeline.getChartManager().dateToX(new Date(value.selected_start * 1000));
              if (scope.ngModel.is_period) {
                selectionRight = whTimeline.getChartManager().dateToX(new Date(value.selected_end * 1000 + 220));
              } else {
                selectionRight = selectionLeft;
              }
              selectionWidth = selectionRight - selectionLeft;
              scope.selectionManager.selections[0].left = selectionLeft + whTimeline.getChartManager().viewModel.viewportLeft;
              return scope.selectionManager.selections[0].width = selectionWidth;
            });
            return value;
          });
          ngModel.$parsers.push(function(value) {
            return $.extend({}, value);
          });
          ngModel.$render = function() {
            return $timeout(function() {
              var method;
              method = ngModel.$viewValue.isNewSelection ? 'css' : 'animate';
              return selectionElement().stop()[method]({
                left: scope.selectionManager.selections[0].left,
                width: scope.selectionManager.selections[0].width
              }).css('overflow', 'visible');
            });
          };
          updateModel = function() {
            var from, invertedEndDate, invertedStartDate, newSelection, to, viewModel;
            if (!scope.selectionManager.selections.length) {
              return;
            }
            newSelection = scope.selectionManager.selections[0];
            viewModel = whTimeline.getChartManager().viewModel;
            from = -viewModel.viewportLeft + newSelection.left;
            to = from + newSelection.width - 2;
            if (!ngModel.$viewValue.is_period) {
              from += 1;
              to += 2;
            }
            invertedStartDate = whTimeline.getChartManager().xToDate(from);
            invertedEndDate = whTimeline.getChartManager().xToDate(to);
            ngModel.$viewValue.selected_start = getUnix(invertedStartDate);
            ngModel.$viewValue.selected_end = getUnix(invertedEndDate);
            ngModel.$viewValue.visible_start = getUnix(new Date(whTimeline.getChartManager().xToDate(-viewModel.viewportLeft)));
            ngModel.$viewValue.visible_end = getUnix(new Date(whTimeline.getChartManager().xToDate(-viewModel.viewportLeft + viewModel.dataArea.width)));
            ngModel.$setViewValue(ngModel.$viewValue);
            return scope.$apply();
          };
          throttledUpdateModel = _.throttle(updateModel, 300);
          chartManager = null;
          onUserInteraction = function(options) {
            var activeSelection;
            ++scope.viewState;
            chartManager || (chartManager = whTimeline.getChartManager());
            activeSelection = scope.selectionManager.selections[0];
            selectionElement().stop().css({
              width: activeSelection.width,
              left: Math.ceil(activeSelection.left + 0.00001) - 1
            });
            chartManager.viewModel.viewport.css({
              left: chartManager.viewModel.viewportLeft
            });
            if (options.forceUpdate) {
              return updateModel();
            } else {
              return throttledUpdateModel();
            }
          };
          scope.selectionManager = new SelectionAreaManager(selectionPane, {
            afterSelectionChange: onUserInteraction,
            strategy: new SingleSelectionAreaManagementStrategy({
              nodeResolver: new SingleSelectionAreaNodeResolver({
                selectionElementSelector: '.selection-area'
              })
            }),
            isPeriod: scope.isPeriod
          });
          whTimeline.chartManagerPromise().then(function(chartManager) {
            scope.selectionManager.addPlugin(new StickySelectionPlugin(chartManager, {
              onUpdate: onUserInteraction
            }));
            return scope.selectionManager.addPlugin(new ChartPanePlugin(chartManager, {
              onUpdate: onUserInteraction
            }));
          });
          prevTime = getUnix();
          return setInterval((function() {
            var activeSelection, deltaMs, isPoint, newTime;
            newTime = getUnix();
            activeSelection = scope.selectionManager.selections[0];
            deltaMs = Math.floor(newTime - prevTime);
            isPoint = !scope.ngModel.is_period;
            if (activeSelection && activeSelection.state === 'none' && deltaMs) {
              if (ngModel.$viewValue.is_from_tracked || ngModel.$viewValue.is_end_tracked) {
                if (ngModel.$viewValue.is_start_tracked || isPoint) {
                  ngModel.$viewValue.selected_start += deltaMs;
                }
                if (ngModel.$viewValue.is_end_tracked || isPoint) {
                  ngModel.$viewValue.selected_end += deltaMs;
                }
                ngModel.$viewValue.selected_end = Math.max(ngModel.$viewValue.selected_start, ngModel.$viewValue.selected_end);
                ngModel.$setViewValue($.extend({}, ngModel.$viewValue));
                ngModel.$render();
                scope.$apply();
              }
            }
            if (deltaMs) {
              return prevTime = newTime;
            }
          }), 400);
        }
      };
    })
  ]).directive('ngPressToggle', [
    '$parse', function($parse) {
      var mouseupCallbackNo, mouseupCallbacks;
      mouseupCallbackNo = 0;
      mouseupCallbacks = {};
      $(document).on('mouseup', function() {
        var callback, k;
        for (k in mouseupCallbacks) {
          callback = mouseupCallbacks[k];
          callback();
        }
        return null;
      });
      return {
        priority: 100,
        link: function(scope, element, attr) {
          var isPressedIn, outCallbackNo, setter;
          isPressedIn = false;
          outCallbackNo = ++mouseupCallbackNo;
          setter = $parse(attr['ngPressToggle']).assign;
          element.bind('mousedown', function(event) {
            isPressedIn = true;
            return scope.$apply(function() {
              return setter(scope, true);
            });
          });
          mouseupCallbacks[outCallbackNo] = function() {
            if (!isPressedIn) {
              return;
            }
            isPressedIn = false;
            return scope.$apply(function() {
              return setter(scope, false);
            });
          };
          return scope.$on('$destroy', function() {
            return delete mouseupCallbacks[outCallbackNo];
          });
        }
      };
    }
  ]).directive('whTimelineDebug', [
    (function() {
      return {
        priority: 91,
        restrict: 'E',
        replace: true,
        scope: {
          'config': '='
        },
        templateUrl: 'templates/wh-timeline-debug.html'
      };
    })
  ]).directive('timepickerUnix', [
    (function() {
      return {
        restrict: 'E',
        require: '^ngModel',
        scope: {},
        templateUrl: 'templates/timepicker-unix.html',
        link: function(scope, element, attr, ngModel) {
          ngModel.$render = function() {
            var date;
            date = ngModel.$modelValue ? new Date(ngModel.$modelValue * 1000) : null;
            return scope.date = date;
          };
          return scope.$watch('date', function(newV, oldV) {
            if (newV) {
              return ngModel.$setViewValue(Math.floor(newV.getTime() / 1000 + 0.0000001));
            }
          });
        }
      };
    })
  ]).directive('ngPressIn', function($parse) {
    var mouseupCallbackNo, mouseupCallbacks;
    mouseupCallbackNo = 0;
    mouseupCallbacks = {};
    $(document).on('mouseup', function() {
      var callback, k;
      for (k in mouseupCallbacks) {
        callback = mouseupCallbacks[k];
        callback();
      }
      return null;
    });
    return {
      priority: 100,
      link: function(scope, element, attr) {
        var isPressedIn, onPressEnd, onPressStart, outCallbackNo;
        isPressedIn = false;
        outCallbackNo = false;
        if (attr['ngPressIn']) {
          onPressStart = $parse(attr['ngPressIn']);
          element.bind('mousedown', function(event) {
            isPressedIn = true;
            return scope.$apply(function() {
              return onPressStart(scope, {
                $event: event
              });
            });
          });
        }
        if (attr['ngPressOut']) {
          outCallbackNo = ++mouseupCallbackNo;
          onPressEnd = $parse(attr['ngPressOut']);
          mouseupCallbacks[outCallbackNo] = function() {
            if (!isPressedIn) {
              return;
            }
            isPressedIn = false;
            return scope.$apply(function() {
              return onPressEnd(scope, {
                $event: event
              });
            });
          };
        }
        return scope.$on('$destroy', function() {
          if (outCallbackNo !== false) {
            return delete mouseupCallbacks[outCallbackNo];
          }
        });
      }
    };
  }).directive('uiUtcUnixDate', function() {
    return {
      require: 'ngModel',
      link: function(scope, element, attrs, modelCtrl) {
        modelCtrl.$formatters.push(function(unixTime) {
          var utcDate;
          if (!unixTime) {
            return;
          }
          utcDate = new Date(unixTime * 1000);
          return new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate(), utcDate.getUTCHours(), utcDate.getUTCMinutes(), utcDate.getUTCSeconds(), utcDate.getUTCMilliseconds());
        });
        return modelCtrl.$parsers.push(function(localDate) {
          var date;
          if (!localDate) {
            return;
          }
          date = new Date(Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate(), localDate.getHours(), localDate.getMinutes(), localDate.getSeconds(), localDate.getMilliseconds()));
          return parseInt((date.getTime() + '').slice(0, -3));
        });
      }
    };
  }).directive('ngBlink', function() {
    return {
      restrict: 'A',
      scope: {
        ngBlink: '='
      },
      link: function(scope, element, attr) {
        return scope.$watch('ngBlink', function(newV, oldV) {
          if (!newV || newV === oldV) {
            return;
          }
          scope.ngBlink = false;
          return element.fadeIn().delay(3500).fadeOut();
        });
      }
    };
  }).directive('ngScroll', [
    '$parse', function($parse) {
      return function(scope, element, attr) {
        var fn;
        fn = $parse(attr.ngScroll);
        return element.bind('mousewheel', function(event) {
          return scope.$apply(function() {
            return fn(scope, {
              $event: event
            });
          });
        });
      };
    }
  ]);

}).call(this);

//# sourceMappingURL=../../app/scripts/wh-timeline.js.map
