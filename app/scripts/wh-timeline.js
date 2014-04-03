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

  angular.module('wh.timeline', ['ui.date', 'ui.bootstrap.timepicker']).filter('timestamptoutcdate', [
    'dateConverter', function(dateConverter) {
      return function(timestamp) {
        return dateConverter.utcToLocal(new Date(timestamp));
      };
    }
  ]);

  /**
  * @ngdoc service
  * @name wh.timeline.utils.configIsolator
  *
  * @description
  * Handy service for isolating and merging part of configuration from more complex objects
  * Used by child directives of wh:timeline.
  *
  * @example
  <example>
      <file name="app.js">
          angular.module('test')
             .directive('isolated', [
                  'wh.timeline.utils.configIsolator',
                  function(configIsolator) {
                      return {
                          scope: { config: '=' },
                          require: 'ngModel',
                          link: function(scope, element, attrs, ngModel)
                          {
                              ngModel.$formatters.unshift(function(modelValue) {
                                  return configIsolator.isolate(modelValue, ['is_period', 'selected_start', 'selected_end', 'visible_start', 'visible_end', 'is_end_tracked', 'is_start_tracked', ])
                              });
  
                              ngModel.$parsers.push(function(viewValue) {
                                  return configIsolator.merge(scope.ngModel, viewValue)
                              });
                          }
                      }
                  }
              ])
          ;
      </file>
  </example>
  */


  angular.module('wh.timeline').service('wh.timeline.utils.configIsolator', function() {
    var def;
    def = {};
    /**
    * @ngdoc method
    * @methodOf wh.timeline.utils.configIsolator
    * @name     wh.timeline.utils.configIsolator#isolate
    * @param {object}  Complete Full configuration to process
    * @param {array}   Properties Object keys to extract
    * @description     Extracts given properties from object
    * @return {object} Extracted properties
    * @example
    <example></example>
    */

    def.isolate = function(complete, properties) {
      var p, viewValue, _i, _len;
      viewValue = {};
      for (_i = 0, _len = properties.length; _i < _len; _i++) {
        p = properties[_i];
        viewValue[p] = complete[p];
      }
      return viewValue;
    };
    /**
    * @ngdoc method
    * @methodOf wh.timeline.utils.configIsolator
    * @name     wh.timeline.utils.configIsolator#merge
    * @param {object}  complete Full configuration
    * @param {array}   isolated Processed isolated object
    * @description     Merges processed properties back to the object
    * @return {object} Merged properties
    * @example
    <example></example>
    */

    def.merge = function(complete, isolated) {
      var k, modelValue, v;
      modelValue = {};
      for (k in isolated) {
        v = isolated[k];
        if (k in complete) {
          modelValue[k] = v;
        }
      }
      for (k in complete) {
        v = complete[k];
        if (!(k in modelValue)) {
          modelValue[k] = v;
        }
      }
      return modelValue;
    };
    return def;
  });

  /**
  * @ngdoc directive
  * @name wh:timeline
  * @requires wh.timeline.chart.Chart wh.timeline.chart.ChartDataModel wh.timeline.chart.ChartViewModel wh.timeline.chart.D3ChartManager wh.timeline.chart.view.Histogram wh.timeline.utils.TimeInterval wh.timeline.utils.configIsolator $timeout $interval $q $window $templateCache
  * @param {databinding} ngModel configuration object used by this directive and child directives, See example below
  *
  * @description
  * Creates a timeline widget that allows selection of either time range, or point in time (depending on configuration)
  *
  * @example
  <example>
      <file name="app.js">
          $scope.timelineConfig = {
              is_period: true,               # Select either period of time or point in time
  
              selected_start: 1385856000,    # December 1, 2013, midnight
              selected_end: 1388849426,      # January 4, 2013, 15:30:26
  
              visible_start: 1370044800,     # - 3600 # June 1, 2013, midnight
              visible_end:   1388849426,     # January 4, 2013, 15:30:26 # 1388530800
  
              is_start_tracked: false,       # Initial state of selection start tracking (changing the date as time passes)
              is_end_tracked: true,          # Initial state of selection end tracking (changing the date as time passes) - may not be false if is_start_tracked is true
  
              predefined_choices: [
                  # December 1, 2013 -- January 1, 2014
                  {
                    start: 1385856000,    end: 1388534400,
                    start_tracked: false, end_tracked: false,
                    name: "Last full month"
                  },
  
                  # December 5, 2013, 15:30:26 -- January 4, 2013, 15:30:26
                  {
                    start: 1386257426,   end: 1388849426,
                    start_tracked: true, end_tracked: true,
                    name: "Last 30 days"
                  },
  
                  # January 1, 1970, 0:00 -- January 4, 2013, 15:30:26
                  {
                    start: 1199464226,    end: 1388849426,
                    start_tracked: false, end_tracked: true,
                    name: "Last 5 years"
                  }
              ],
              data: [
                  {
                      name: "Yearly",            # name of time perspective, allowed names: Yearly, Monthly, Weekly, Daily, Hourly, Minutely
                      bin_width: 60*60*24*365,   # about 365 days
                      active: false,             # not visible
                      epoch_raw: 0,              # when this is changed, raw data is re-rendered
                      raw: [],                   # no data loaded yet
                      epoch_state: 0,            # when this is changed, state data is re-rendered
                      state: []                  # no data loaded yet
                  },
                  {
                      name: "Daily",
                      bin_width: 60*60*24,
                      active: false,
                      epoch_raw: 123,
                      raw: [
                          { start: 1377993600, end: 1377993600 + 60*60*24, value: 14 } # September 2013
                      ],
                      epoch_state: 442,
                      state: [
                      ]
                  },
                  {
                      name: "Monthly",
                      bin_width: 60*60*24*30,    # about 30 days
                      active: true,
                      epoch_raw: 314159,
                      raw: [
                          #{ start: 1391212800, end: 1393632000, value: 5 }, # February 2013
                          #{ start: 1393632000, end: 1396310400, value: 10 }, # March 2013
  
                          { start: 1377993600, end: 1380585600, value: 11 }, # September 2013
                          { start: 1380585600, end: 1383271200, value: 13 }, # October 2013
                          # note: missing November data.
                          { start: 1385863200, end: 1388541600-7200, value: 14 }  # December 2013
                          { start: 1388541600-7200, end: 1391541600, value: 15 }  # December 2013
                      ],
                      epoch_state: 924657,
                      state: [
                          # September 2013 - October 15, 2013
                          { start: 1377993600, end: 1381795200, state: "loaded" },
  
                          # October 15, 2013 - October 22, 2013
                          { start: 1381795200, end: 1382400000, state: "missing" },
  
                          # October 22, 2013 - December 1, 2013
                          { start: 1382400000, end: 1385856000, state: "computing" },
  
                          # December 1, 2013 - January 1, 2014
                          { start: 1385856000, end: 1388541600, state: "loaded" }
                      ]
                  },
                  {
                      name: "Weekly",
                      bin_width: 60*60*24*7,     # about 7 days
                      active: true,
                      epoch_raw: 123,
                      raw: [
                          { start: 1377302400, end: 1377907200, value: 10.000000 },
                          { start: 1377907200, end: 1378512000, value: 10.499167 },
                          { start: 1378512000, end: 1379116800, value: 10.993347 },
                          { start: 1379116800, end: 1379721600, value: 11.477601 },
                          { start: 1379721600, end: 1380326400, value: 11.947092 },
                          { start: 1380326400, end: 1380931200, value: 12.397128 },
                          { start: 1380931200, end: 1381536000, value: 12.823212 },
                          { start: 1381536000, end: 1382140800, value: 13.221088 },
                          { start: 1382140800, end: 1382745600, value: 13.586780 },
                          { start: 1382745600, end: 1383350400, value: 13.916635 },
                          { start: 1383350400, end: 1383955200, value: 14.207355 },
                          { start: 1383955200, end: 1384560000, value: 14.456037 },
                          { start: 1384560000, end: 1385164800, value: 14.660195 },
                          { start: 1385164800, end: 1385769600, value: 14.817791 },
                          { start: 1385769600, end: 1386374400, value: 14.927249 },
                          { start: 1386374400, end: 1386979200, value: 14.987475 },
                          { start: 1386979200, end: 1387584000, value: 14.997868 },
                          { start: 1387584000, end: 1388188800, value: 14.958324 },
                          { start: 1388188800, end: 1388793600, value: 14.869238 },
                          { start: 1388793600, end: 1389398400, value: 14.731500 },
                          { start: 1389398400, end: 1390003200, value: 14.546487 },
                          { start: 1390003200, end: 1390608000, value: 14.316047 },
                          { start: 1390608000, end: 1391212800, value: 14.042482 },
                          { start: 1391212800, end: 1391817600, value: 13.728526 },
                          { start: 1391817600, end: 1392422400, value: 13.377316 },
                          { start: 1392422400, end: 1393027200, value: 12.992361 },
                          { start: 1393027200, end: 1393632000, value: 12.577507 },
                          { start: 1393632000, end: 1394236800, value: 12.136899 },
                          { start: 1394236800, end: 1394841600, value: 11.674941 },
                          { start: 1394841600, end: 1395446400, value: 11.196247 }
                      ],
                      epoch_state: 442,
                      state: [
                          { start: 1377302400, end: 1395446400, state: "loaded" }
                      ]
                  }
              ]
          }
      </file>
      <file name="index.html">
          <wh-timeline ng-model="timelineConfig"></wh-timeline>
      </file>
  </example>
  */


  angular.module('wh.timeline').directive('whTimeline', [
    'wh.timeline.chart.Chart', 'wh.timeline.chart.ChartDataModel', 'wh.timeline.chart.ChartViewModel', 'wh.timeline.chart.D3ChartManager', 'wh.timeline.chart.view.Histogram', 'wh.timeline.utils.TimeInterval', 'wh.timeline.utils.configIsolator', '$timeout', '$interval', '$q', '$window', '$templateCache', (function(Chart, ChartDataModel, ChartViewModel, D3ChartManager, HistogramView, TimeInterval, configIsolator, $timeout, $interval, $q, $window, $templateCache) {
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
          scope.setTimePerspectives = function(newTimePerspectives) {
            var binWidth, chart, dataModel, elem, perspective, readyForRendering, _i, _len, _ref;
            if (angular.equals(newTimePerspectives, scope.visibleTimePerspectives)) {
              return;
            }
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
            return whTimeline.render();
          };
          scope.chartManager = chartManager = new D3ChartManager(new ChartViewModel(element.find('.wh-timeline-widget .chart-component')));
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
            return whTimeline.render();
          }), true);
          scope.$watchCollection('[ngModel.visible_start, ngModel.visible_end]', (function() {
            chartManager.updateVisibleTimeInterval(scope.getVisibleTimeInterval());
            return whTimeline.render();
          }));
          scope.$watch((function() {
            return configIsolator.isolate(scope.ngModel, ['selected_start', 'selected_end']);
          }), (function(newV, oldV) {
            if (newV === oldV) {
              return;
            }
            if (scope.selectionModifiedByUser) {
              scope.selectionModifiedByUser = false;
              return;
            }
            return scope.ngModel = configIsolator.merge(scope.ngModel, newV);
          }), true);
          scope.states = [];
          scope.updateStateData = function() {
            var left, main, right, state, _i, _len, _ref;
            main = chartManager.getMainActiveChart();
            scope.states = [];
            _ref = main.chart.dataModel.processedStateData;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              state = _ref[_i];
              left = chartManager.dateToX(new Date(state.start * 1000));
              right = chartManager.dateToX(new Date(state.end * 1000));
              scope.states.push({
                left: left,
                width: right - left,
                state: state.state
              });
            }
            return scope.states;
          };
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
            var binPerspectiveData, idx, length, visible, _i, _ref;
            visible = [newActive];
            binPerspectiveData = this.getSortedPerspectiveDetails();
            length = binPerspectiveData.length;
            for (idx = _i = _ref = length - 1; _i >= 0; idx = _i += -1) {
              if (binPerspectiveData[idx].name === newActive) {
                if (idx < length && idx > 0) {
                  visible.push(binPerspectiveData[idx - 1].name);
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
          this.getSortedPerspectiveDetails = function() {
            var binPerspectiveData, item;
            binPerspectiveData = (function() {
              var _i, _len, _ref, _results;
              _ref = $scope.ngModel.data;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                item = _ref[_i];
                _results.push({
                  bin_width: item.bin_width,
                  name: item.name,
                  active: item.active
                });
              }
              return _results;
            })();
            binPerspectiveData.sort(function(e1, e2) {
              return e1.bin_width < e2.bin_width;
            });
            return binPerspectiveData;
          };
          this.setSelectionModifiedByUser = function() {
            return scope.selectionModifiedByUser = true;
          };
          this.isSelectionModifiedByUser = function() {
            return scope.selectionModifiedByUser;
          };
          this.updateStateData = function() {
            return $scope.updateStateData();
          };
          this.render = function(force) {
            if (force == null) {
              force = false;
            }
            this.getChartManager().renderCurrentState(force);
            return $scope.updateStateData();
          };
          return this;
        }
      };
    })
  ]);

  /**
  * @ngdoc directive
  * @name wh:timeline-perspective-picker
  * @requires $templateCache wh.timeline.utils.configIsolator
  * @param {databinding} ngModel the same configuration object as wh:timeline which is used for rendering and is also updated whenever user is interacting with the widget
  *
  * @description
  * Perspective switcher for the timeline widget, rendered as +/- buttons, provides event handler for mouse scroll.
  * If perspective level can't be zoomed more (because selected time period is too long), then
  * code from on-zoom-rejected attribute is called.
  *
  * @example
  <example>
      <file name="index.html">
          <wh:timeline-perspective-picker
              ng-model="ngModel"
              on-zoom-rejected="zoomRejected=true"></wh:timeline-perspective-picker>
      </file>
  </example>
  */


  angular.module('wh.timeline').directive('whTimelinePerspectivePicker', [
    '$templateCache', 'wh.timeline.utils.configIsolator', function($templateCache, configIsolator) {
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
          ngModel.$formatters.unshift(function(modelValue) {
            var activeEntries, binPerspectiveData, chunk, previouslyActive, viewValue;
            viewValue = configIsolator.isolate(modelValue, ['is_period', 'selected_start', 'selected_end', 'visible_start', 'visible_end', 'is_end_tracked', 'is_start_tracked']);
            binPerspectiveData = whTimeline.getSortedPerspectiveDetails();
            previouslyActive = scope.active;
            activeEntries = ((function() {
              var _i, _len, _results;
              _results = [];
              for (_i = 0, _len = binPerspectiveData.length; _i < _len; _i++) {
                chunk = binPerspectiveData[_i];
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
              var _i, _len, _results;
              _results = [];
              for (_i = 0, _len = binPerspectiveData.length; _i < _len; _i++) {
                chunk = binPerspectiveData[_i];
                _results.push(chunk.name);
              }
              return _results;
            })();
            scope.binWidths = to_hash((function() {
              var _i, _len, _results;
              _results = [];
              for (_i = 0, _len = binPerspectiveData.length; _i < _len; _i++) {
                chunk = binPerspectiveData[_i];
                _results.push([chunk.name, chunk.bin_width]);
              }
              return _results;
            })());
            return viewValue;
          });
          ngModel.$parsers.push(function(viewValue) {
            var chunk, modelValue, _i, _len, _ref, _ref1;
            modelValue = configIsolator.merge(scope.ngModel, viewValue);
            _ref = modelValue.data;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              chunk = _ref[_i];
              chunk.active = (_ref1 = chunk.name, __indexOf.call(scope.visible, _ref1) >= 0);
            }
            return modelValue;
          });
          scope.active = null;
          scope.visible = null;
          scope.available = null;
          scope.binWidths = null;
          scope["switch"] = function(how) {
            var binWidthRatio, cm, currentIdx, deltaIdx, deltaVisible, factor, newActive, newIdx, projectedEnd, projectedEndX, projectedStart, projectedStartX, selectedEndX, selectedSeconds, selectedStartX, visibleSeconds;
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
            visibleSeconds = ngModel.$viewValue.visible_end - ngModel.$viewValue.visible_start;
            selectedSeconds = ngModel.$viewValue.selected_end - ngModel.$viewValue.selected_start;
            binWidthRatio = scope.binWidths[newActive] / scope.binWidths[scope.active];
            binWidthRatio = Math.max(1, binWidthRatio) - Math.min(1, binWidthRatio);
            factor = deltaIdx > 0 ? 1 : -1;
            deltaVisible = Math.ceil(binWidthRatio * visibleSeconds / 2) * factor;
            projectedStart = ngModel.$viewValue.selected_start + selectedSeconds / 2 - visibleSeconds / 2;
            projectedEnd = projectedStart + visibleSeconds;
            projectedStart += deltaVisible;
            projectedEnd -= deltaVisible;
            cm = whTimeline.getChartManager();
            projectedStartX = cm.dateToX(new Date(projectedStart * 1000));
            projectedEndX = cm.dateToX(new Date(projectedEnd * 1000));
            selectedStartX = cm.dateToX(new Date(ngModel.$viewValue.selected_start * 1000));
            selectedEndX = cm.dateToX(new Date(ngModel.$viewValue.selected_end * 1000));
            if (!(((projectedStartX <= selectedStartX && selectedStartX <= selectedEndX) && selectedEndX <= projectedEndX))) {
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
          return element.closest('.wh-timeline').find('.chart-data-overlay').bind('mousewheel', function(e) {
            e.preventDefault();
            scope["switch"](e.deltaY > 0);
            if (!scope.$$phase && !scope.$root.$$phase) {
              return scope.$apply();
            }
          });
        }
      };
    }
  ]);

  /**
  * @ngdoc directive
  * @name wh:timeline-selection-config
  * @requires $timeout $templateCache wh.timeline.utils.configIsolator'
  * @param {databinding} ngModel the same configuration object as wh:timeline which is used for rendering and is also updated whenever user is interacting with the widget
  
  * @description
  * Selection configuration widget, allows selection manipulation with following widgets:
  * * calendar
  * * timepicker (3 inputs with arrows and scrolling)
  * * datepicker (3 inputs)
  *
  * This directive may influence following ngModel:
  *
  * * selected_start    - basic feature, there is GUI for that
  * * selected_end      - basic feature, there is GUI for that
  * * visible_start     - if chosen selection either cannot fit within current visible bounds, or is so small it would be barely visible
  * * visible_end       - same as above
  * * is_start_tracked  - basic feature, there is GUI for that
  * * is_end_tracked    - basic feature, there is GUI for that
  * * data[].active     - visible time perspective may be modified if selected time span is too long/short
  *
  * @example
  <example>
      <file name="index.html">
          <wh:timeline-selection-config ng-model="ngModel"></wh:timeline-selection-config>
      </file>
  </example>
  */


  angular.module('wh.timeline').directive('whTimelineSelectionConfig', [
    '$timeout', '$templateCache', 'wh.timeline.utils.configIsolator', 'dateConverter', (function($timeout, $templateCache, configIsolator, dateConverter) {
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
          var ngModel, prepareDate, whTimeline;
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
            if (timestamps[0] >= timestamps[1]) {
              timestamps[0] = timestamps[1];
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
            return configIsolator.isolate(modelValue, ['is_period', 'selected_start', 'selected_end', 'visible_start', 'visible_end', 'is_end_tracked', 'is_start_tracked']);
          });
          ngModel.$parsers.push(function(viewValue) {
            var binPerspectiveData, binWidthPx, calcBinWidth, chunk, i, tooLittleVisible, visible, visibleArea, visibleSeconds, _i, _j, _len, _ref, _ref1, _ref2, _ref3, _ref4;
            if (!viewValue.is_period) {
              viewValue.selected_end = viewValue.selected_start;
            }
            setTimeout(function() {
              return element.find('[ui-date]').datepicker("refresh");
            });
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
            visibleArea = whTimeline.getChartManager().viewModel.viewportOverlay.width;
            calcBinWidth = function(binWidth) {
              var binWidthRatio;
              binWidthRatio = visibleSeconds / binWidth;
              return visibleArea / binWidthRatio;
            };
            binWidthPx = calcBinWidth(whTimeline.getChartManager().getMainActiveChart().chart.dataModel.binWidth);
            if (binWidthPx < 10) {
              binPerspectiveData = whTimeline.getSortedPerspectiveDetails();
              for (i = _i = _ref2 = binPerspectiveData.length - 1; _i >= 0; i = _i += -1) {
                chunk = binPerspectiveData[i];
                binWidthPx = calcBinWidth(chunk.bin_width);
                if (binWidthPx >= 10) {
                  break;
                }
              }
              whTimeline.setActiveTimePerspective(chunk.name);
              visible = whTimeline.getVisibleTimePerspectives();
              _ref3 = ngModel.$modelValue.data;
              for (_j = 0, _len = _ref3.length; _j < _len; _j++) {
                chunk = _ref3[_j];
                chunk.active = (_ref4 = chunk.name, __indexOf.call(visible, _ref4) >= 0);
              }
            }
            scope.start = viewValue.selected_start;
            scope.end = viewValue.selected_end;
            whTimeline.setSelectionModifiedByUser();
            return configIsolator.merge(scope.ngModel, viewValue);
          });
          scope.predefinedChoice = null;
          scope.$watch('predefinedChoice', function(newChoice) {
            var binPerspectiveData, binWidthPx, calcBinWidth, chunk, i, newPadding, selectedSeconds, tooMuchVisible, visible, visibleArea, visibleSeconds, _i, _j, _len, _ref, _ref1, _ref2;
            if (!newChoice) {
              return;
            }
            whTimeline.setSelectionModifiedByUser();
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
              visibleSeconds = ngModel.$viewValue.visible_end - ngModel.$viewValue.visible_start;
              visibleArea = whTimeline.getChartManager().viewModel.viewportOverlay.width;
              calcBinWidth = function(binWidth) {
                var binWidthRatio;
                binWidthRatio = visibleSeconds / binWidth;
                return visibleArea / binWidthRatio;
              };
              binWidthPx = calcBinWidth(whTimeline.getChartManager().getMainActiveChart().chart.dataModel.binWidth);
              if (binWidthPx > 100) {
                binPerspectiveData = whTimeline.getSortedPerspectiveDetails();
                for (i = _i = 0, _ref = binPerspectiveData.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
                  chunk = binPerspectiveData[i];
                  binWidthPx = calcBinWidth(chunk.bin_width);
                  if (binWidthPx < 100) {
                    break;
                  }
                }
                whTimeline.setActiveTimePerspective(chunk.name);
                visible = whTimeline.getVisibleTimePerspectives();
                _ref1 = ngModel.$modelValue.data;
                for (_j = 0, _len = _ref1.length; _j < _len; _j++) {
                  chunk = _ref1[_j];
                  chunk.active = (_ref2 = chunk.name, __indexOf.call(visible, _ref2) >= 0);
                }
              }
            }
            ngModel.$setViewValue(ngModel.$viewValue);
            return scope.predefinedChoice = null;
          });
          element.find('.calendar.from').on('mousedown', '.ui-datepicker-next, .ui-datepicker-prev', function(e) {
            if (ngModel.$modelValue.is_start_tracked) {
              ngModel.$modelValue.is_start_tracked = false;
              ngModel.$setViewValue(ngModel.$modelValue);
              return scope.$apply();
            }
          });
          element.find('.calendar.to').on('mousedown', '.ui-datepicker-next, .ui-datepicker-prev', function(e) {
            if (ngModel.$modelValue.is_end_tracked) {
              ngModel.$modelValue.is_end_tracked = false;
              ngModel.$setViewValue(ngModel.$modelValue);
              return scope.$apply();
            }
          });
          prepareDate = function(date) {
            date.setHours(0);
            date.setMinutes(0);
            date.setSeconds(0);
            date.setMilliseconds(0);
            return date;
          };
          scope.startCalendarConfig = {
            beforeShowDay: function(date) {
              var localDate, selectedStart;
              localDate = prepareDate(dateConverter.localToUtc(date));
              selectedStart = prepareDate(new Date(ngModel.$modelValue.selected_end * 1000));
              return [localDate <= selectedStart, ""];
            }
          };
          return scope.endCalendarConfig = {
            beforeShowDay: function(date) {
              var localDate, selectedStart;
              localDate = prepareDate(dateConverter.localToUtc(date));
              selectedStart = prepareDate(new Date(ngModel.$modelValue.selected_start * 1000));
              return [localDate >= selectedStart, ""];
            }
          };
        }
      };
    })
  ]);

  /**
  * @ngdoc directive
  * @name wh:timeline-selections
  * @requires $timeout $interval $templateCache wh.timeline.selection.plugin.ChartPanePlugin wh.timeline.selection.plugin.StickySelectionPlugin wh.timeline.selection.SelectionAreaManager wh.timeline.selection.strategy.SingleSelectionAreaManagementStrategy wh.timeline.selection.nodeResolver.SingleSelectionAreaNodeResolver wh.timeline.selection.SelectionArea wh.timeline.utils.configIsolator
  * @scope
  * @restrict E
  * @param {databinding} ngModel which is used for rendering and is also updated whenever user is interacting with the widget
  * @param {databinding} adjustingSelection which is set to true whenever user is interacting with the widget
  *
  * @description
  * Selection rendering / updating widget. Selection can be composed / updated via drag & drop
  *
  * It requires the same configuration object as wh:timeline directive and it may influence following values:
  * * selected_start    - basic feature
  * * selected_end      - basic feature
  * * visible_start     - if selection is moved close to the left  boundary
  * * visible_end       - if selection is moved close to the right boundary
  *
  * @example
  <example>
      <file name="index.html">
          <wh:timeline-selections
              ng-model="ngModel"
              adjusting-selection="adjustingSelection"></wh:timeline-selections>
      </file>
  </example>
  */


  angular.module('wh.timeline').directive('whTimelineSelections', [
    '$timeout', '$interval', '$templateCache', 'wh.timeline.selection.plugin.ChartPanePlugin', 'wh.timeline.selection.plugin.StickySelectionPlugin', 'wh.timeline.selection.SelectionAreaManager', 'wh.timeline.selection.strategy.SingleSelectionAreaManagementStrategy', 'wh.timeline.selection.nodeResolver.SingleSelectionAreaNodeResolver', 'wh.timeline.selection.SelectionArea', 'wh.timeline.utils.configIsolator', (function($timeout, $interval, $templateCache, ChartPanePlugin, StickySelectionPlugin, SelectionAreaManager, SingleSelectionAreaManagementStrategy, SingleSelectionAreaNodeResolver, SelectionArea, configIsolator) {
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
          var chartManager, hasScheduledUpdate, ngModel, oldSelection, onUserInteraction, prevTime, recalculateSelectionView, selectionElement, selectionPane, throttledUpdateModel, updateModel, whTimeline,
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
          recalculateSelectionView = function(viewValue) {
            var selectionLeft, selectionRight, selectionWidth;
            selectionLeft = whTimeline.getChartManager().dateToX(new Date(viewValue.selected_start * 1000 + 999)) + 1;
            if (scope.ngModel.is_period) {
              selectionRight = whTimeline.getChartManager().dateToX(new Date(viewValue.selected_end * 1000)) + 2;
            } else {
              selectionRight = selectionLeft;
            }
            selectionWidth = selectionRight - selectionLeft;
            scope.selectionManager.selections[0].left = selectionLeft + whTimeline.getChartManager().viewModel.paneLeft;
            return scope.selectionManager.selections[0].width = selectionWidth;
          };
          ngModel.$formatters.unshift(function(modelValue) {
            var viewValue;
            viewValue = configIsolator.isolate(modelValue, ['is_period', 'selected_start', 'selected_end', 'visible_start', 'visible_end', 'is_end_tracked', 'is_start_tracked']);
            viewValue.isNewSelection = scope.selectionManager.selections.length === 0;
            if (viewValue.isNewSelection) {
              scope.selectionManager.selections[0] = new SelectionArea();
            }
            $timeout(function() {
              return recalculateSelectionView(viewValue);
            });
            return viewValue;
          });
          ngModel.$parsers.push(function(viewValue) {
            return configIsolator.merge(scope.ngModel, viewValue);
          });
          ngModel.$render = function() {
            return $timeout(function() {
              var elem, method, pos;
              elem = selectionElement().stop();
              if (ngModel.$viewValue.isNewSelection) {
                method = 'css';
              } else {
                pos = elem.position();
                if (Math.abs(scope.selectionManager.selections[0].left - pos.left) < 3 || Math.abs(scope.selectionManager.selections[0].width - pos.width) < 3) {
                  method = 'css';
                } else {
                  method = 'animate';
                }
              }
              return elem[method]({
                left: scope.selectionManager.selections[0].left,
                width: scope.selectionManager.selections[0].width
              }).css('overflow', 'visible');
            });
          };
          hasScheduledUpdate = false;
          updateModel = function() {
            var calcTo, calcWidth, calcX, from, invertedEndDate, invertedStartDate, newSelection, to, viewModel, width;
            hasScheduledUpdate = false;
            if (!scope.selectionManager.selections.length) {
              return;
            }
            newSelection = scope.selectionManager.selections[0];
            viewModel = whTimeline.getChartManager().viewModel;
            from = -viewModel.paneLeft + newSelection.left;
            to = from + newSelection.width;
            if (ngModel.$viewValue.is_period) {
              from -= 2;
              to -= 3;
            } else {
              from += 1;
              to += 2;
            }
            invertedStartDate = whTimeline.getChartManager().xToDate(from);
            invertedEndDate = whTimeline.getChartManager().xToDate(to);
            calcX = whTimeline.getChartManager().dateToX(invertedStartDate);
            calcTo = whTimeline.getChartManager().dateToX(invertedEndDate);
            width = to - from;
            calcWidth = calcTo - calcX;
            ngModel.$viewValue.selected_start = getUnix(invertedStartDate);
            ngModel.$viewValue.selected_end = getUnix(invertedEndDate);
            ngModel.$viewValue.visible_start = getUnix(new Date(whTimeline.getChartManager().xToDate(-viewModel.paneLeft)));
            ngModel.$viewValue.visible_end = getUnix(new Date(whTimeline.getChartManager().xToDate(-viewModel.paneLeft + viewModel.viewportOverlay.width)));
            whTimeline.setSelectionModifiedByUser();
            ngModel.$setViewValue(ngModel.$viewValue);
            return scope.$apply();
          };
          throttledUpdateModel = _.throttle(updateModel, 300);
          chartManager = null;
          onUserInteraction = function(options) {
            var activeSelection;
            if (options.type === "onCloseToBoundary") {
              whTimeline.render(true);
            }
            activeSelection = scope.selectionManager.selections[0];
            selectionElement().stop().css({
              width: activeSelection.width,
              left: Math.round(activeSelection.left + 0.00001) - 1
            });
            chartManager.viewModel.pane.css({
              left: chartManager.viewModel.paneLeft
            });
            hasScheduledUpdate = true;
            if (options.forceUpdate) {
              return updateModel();
            } else {
              return throttledUpdateModel();
            }
          };
          whTimeline.chartManagerPromise().then(function(createdChartManager) {
            chartManager = createdChartManager;
            scope.selectionManager = new SelectionAreaManager(selectionPane, {
              afterSelectionChange: onUserInteraction,
              strategy: new SingleSelectionAreaManagementStrategy({
                nodeResolver: new SingleSelectionAreaNodeResolver({
                  selectionElementSelector: '.selection-area'
                })
              }),
              isPeriod: scope.ngModel.is_period
            });
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
            if (hasScheduledUpdate) {
              return;
            }
            newTime = getUnix();
            activeSelection = scope.selectionManager.selections[0];
            deltaMs = Math.floor(newTime - prevTime);
            isPoint = !scope.ngModel.is_period;
            if (activeSelection && activeSelection.state === 'none' && deltaMs) {
              if (ngModel.$viewValue.is_from_tracked || ngModel.$viewValue.is_end_tracked) {
                console.log("interval", ngModel.$viewValue.selected_start);
                if (ngModel.$viewValue.is_start_tracked || isPoint) {
                  ngModel.$viewValue.selected_start += deltaMs;
                }
                if (ngModel.$viewValue.is_end_tracked || isPoint) {
                  ngModel.$viewValue.selected_end += deltaMs;
                }
                ngModel.$viewValue.selected_end = Math.max(ngModel.$viewValue.selected_start, ngModel.$viewValue.selected_end);
                ngModel.$viewValue.visible_end = Math.max(ngModel.$viewValue.visible_end, ngModel.$viewValue.selected_end);
                ngModel.$setViewValue($.extend({}, ngModel.$viewValue));
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
  ]);

  /**
  * @ngdoc directive
  * @name wh:press-toggle
  * @requires $parse
  * @restrict A
  * @param {databinding} ngPressToggle value that is set to true when toggle is active and to false when it is not
  *
  * @description
  * Tracks toggle state of an element. When mouse button pressed on given element, toggle state is 1. When mouse
  * button is released (on this or any other element), toggle state is set to 0
  *
  * @example
  <example>
      <file name="index.html">
          <input wh-press-toggle="isToggled" />
      </file>
  </example>
  */


  angular.module('wh.timeline').directive('whPressToggle', [
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
        link: function(scope, element, attr) {
          var isPressedIn, outCallbackNo, setter;
          isPressedIn = false;
          outCallbackNo = ++mouseupCallbackNo;
          setter = $parse(attr['whPressToggle']).assign;
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
  ]);

  /**
  * @ngdoc directive
  * @name wh:timeline-debug
  * @restrict E
  * @param {databinding} config whTimeline configuration object
  *
  * @description
  * Displays some debugging information related to the current state of whTimeline directive
  *
  * @example
  <example>
      <file name="index.html">
          <wh:timeline-debug config="timelineConfig"></wh:timeline-debug>
      </file>
  </example>
  */


  angular.module('wh.timeline').directive('whTimelineDebug', [
    (function() {
      return {
        restrict: 'E',
        replace: true,
        scope: {
          'config': '='
        },
        templateUrl: 'templates/wh-timeline-debug.html'
      };
    })
  ]);

  /**
  * @ngdoc directive
  * @name wh:timepicker-unix
  * @restrict E
  * @scope
  * @param {databinding} ngModel Date object
  *
  * @description
  * Slim wrapper around the timepicker directive to ensure UTC timezone
  *
  * @example
  <example>
      <file name="app.js">
          $scope.date = new Date();
      </file>
      <file name="index.html">
          <timepicker ng-model="date"></timepicker>
      </file>
  </example>
  */


  angular.module('wh.timeline').directive('timepickerUnix', [
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
  ]);

  /**
  * @ngdoc directive
  * @name ui:utc-unix-date
  * @param {databinding} ngModel Date object
  *
  * @description
  * Slim wrapper ensuring UTC timezone processing. May be used with any directive working with the date object
  * which assumes local timezone should be used.
  *
  * @example
  <example>
      <file name="app.js">
          $scope.date = new Date();
      </file>
      <file name="index.html">
          <div ui-date ui-utc-unix-date ng-model="date"></div>
      </file>
  </example>
  */


  angular.module('wh.timeline').service('dateConverter', function() {
    return {
      localToUtc: function(localDate) {
        var date;
        return date = new Date(Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate(), localDate.getHours(), localDate.getMinutes(), localDate.getSeconds(), localDate.getMilliseconds()));
      },
      utcToLocal: function(utcDate) {
        return new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate(), utcDate.getUTCHours(), utcDate.getUTCMinutes(), utcDate.getUTCSeconds(), utcDate.getUTCMilliseconds());
      }
    };
  }).directive('uiUtcUnixDate', [
    'dateConverter', function(dateConverter) {
      return {
        require: 'ngModel',
        link: function(scope, element, attrs, modelCtrl) {
          modelCtrl.$formatters.push(function(unixTime) {
            var utcDate;
            if (!unixTime) {
              return;
            }
            utcDate = new Date(unixTime * 1000);
            return dateConverter.utcToLocal(utcDate);
          });
          return modelCtrl.$parsers.push(function(localDate) {
            var date;
            if (!localDate) {
              return;
            }
            date = dateConverter.localToUtc(localDate);
            return parseInt((date.getTime() + '').slice(0, -3));
          });
        }
      };
    }
  ]);

  /**
  * @ngdoc directive
  * @name ui:utc-unix-date
  * @param {databinding} ngModel Unix timestamp
  *
  * @description
  * Slim wrapper that allows passing unix timestamp to any directive which
  * expects Date object
  *
  * @example
  <example>
      <file name="app.js">
          $scope.timestamp = 1199464226;
      </file>
      <file name="index.html">
          <div ui-date ui-unix-date ng-model="timestamp"></div>
      </file>
  </example>
  */


  angular.module('wh.timeline').directive('uiUnixDate', function() {
    return {
      require: 'ngModel',
      link: function(scope, element, attrs, modelCtrl) {
        modelCtrl.$formatters.push(function(unixTime) {
          if (!unixTime) {
            return;
          }
          return new Date(unixTime * 1000);
        });
        return modelCtrl.$parsers.push(function(utcDate) {
          if (!utcDate) {
            return;
          }
          return parseInt((utcDate.getTime() + '').slice(0, -3));
        });
      }
    };
  });

  /**
  * @ngdoc directive
  * @name datepicker-inputs
  * @restrict: E
  * @scope
  * @require $templateCache $log
  * @param {databinding} ngModel Date object
  *
  * @description
  * Widget that allows easy modification of year/month/day parts of any date object
  *
  * @example
  <example>
      <file name="app.js">
          $scope.date = new Date();
      </file>
      <file name="index.html">
          <datepicker-inputs ng-model="date"></datepicker-inputs>
      </file>
  </example>
  */


  angular.module('wh.timeline').directive('datepickerInputs', [
    '$templateCache', '$log', function($templateCache, $log) {
      return {
        restrict: 'E',
        require: 'ngModel',
        scope: {
          ngModel: '='
        },
        template: $templateCache.get('templates/datepicker-inputs.html'),
        link: function(scope, element, attrs, ngModel) {
          var pad, updateScope;
          pad = function(value) {
            return ("0" + value).slice(-2);
          };
          ngModel.$render = function() {
            return updateScope(ngModel.$viewValue);
          };
          updateScope = function(date) {
            scope.Years = "" + date.getUTCFullYear();
            scope.Months = "" + pad(date.getUTCMonth() + 1);
            return scope.Days = "" + pad(date.getUTCDate());
          };
          scope.invalid = {
            years: false,
            months: false,
            days: false
          };
          return scope.updateDate = function() {
            var date, days, k, months, time, v, years;
            years = parseInt(scope.Years, 10);
            months = parseInt(scope.Months, 10);
            days = parseInt(scope.Days, 10);
            scope.invalid.years = !((1 <= years && years <= 3000));
            scope.invalid.months = !((1 <= months && months <= 12));
            scope.invalid.days = !((1 <= days && days <= 31));
            if (((function() {
              var _ref, _results;
              _ref = scope.invalid;
              _results = [];
              for (k in _ref) {
                v = _ref[k];
                if (v) {
                  _results.push(v);
                }
              }
              return _results;
            })()).length) {
              ngModel.$setValidity('time', false);
              return;
            }
            time = Date.UTC(years, months - 1, days, ngModel.$viewValue.getUTCHours(), ngModel.$viewValue.getUTCMinutes(), ngModel.$viewValue.getUTCSeconds(), ngModel.$viewValue.getUTCMilliseconds());
            if (!time) {
              ngModel.$setValidity('time', false);
              return;
            }
            ngModel.$setValidity('time', true);
            date = new Date(time);
            updateScope(date);
            return ngModel.$setViewValue(date);
          };
        }
      };
    }
  ]);

  /**
  * @ngdoc directive
  * @name ng:blink
  * @restrict: A
  * @scope
  * @param {databinding} ngBlink Boolean indicator of current visibility state
  *
  * @description
  * Shows element whenever ngBlink binding is set to true and hides it 3500 ms later
  *
  * @example
  <example>
      <file name="index.html">
          <button ng-click="showWarning=true">Show warning</button>
          <span ng-blink="showWarning">Warning it is</span>
      </file>
  </example>
  */


  angular.module('wh.timeline').directive('ngBlink', function() {
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
          return element.finish().fadeIn().delay(3500).fadeOut();
        });
      }
    };
  });

}).call(this);

/*
//@ sourceMappingURL=wh-timeline.js.map
*/