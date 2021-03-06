(function() {
  window.TimelineController = function($scope) {
    var a, now, week;
    week = 604800;
    $scope.steps = [
      {
        "Weekly": {
          prepend: [
            {
              start: 1377302400 - week * 4,
              end: 1377907200 - week * 3,
              value: 9.000000
            }, {
              start: 1377302400 - week * 3,
              end: 1377907200 - week * 2,
              value: 8.000000
            }, {
              start: 1377302400 - week * 2,
              end: 1377907200 - week * 1,
              value: 1.000000
            }
          ]
        },
        "Monthly": {
          update: {
            1: 20.0000
          }
        }
      }, {
        "Weekly": {
          prepend: [
            {
              start: 1377302400 - week * 11,
              end: 1377907200 - week * 10,
              value: 8.000000
            }, {
              start: 1377302400 - week * 8,
              end: 1377907200 - week * 7,
              value: 7.000000
            }
          ],
          update: {
            5: 17.0000,
            7: 4.30000,
            9: 25.0000
          }
        },
        "Monthly": {
          update: {
            1: 20.0000
          }
        }
      }, {
        "Weekly": {
          prepend: [
            {
              start: 1377302400 - week * 9,
              end: 1377907200 - week * 8,
              value: 8.700000
            }, {
              start: 1377302400 - week * 10,
              end: 1377907200 - week * 9,
              value: 9.100000
            }
          ],
          update: {
            1: 11.0000,
            2: 12.30000
          }
        },
        "Monthly": {
          prepend: [
            {
              start: 1370044800,
              end: 1372636800,
              value: 13.22
            }
          ],
          update: {
            1: 17.0000
          }
        }
      }
    ];
    $scope.currentStep = 0;
    $scope.addData = function() {
      var data, elem, idx, k, step, v, _ref, _results;
      if ($scope.steps.length === $scope.currentStep) {
        return false;
      }
      step = $scope.steps[$scope.currentStep++];
      _results = [];
      for (idx in step) {
        data = step[idx];
        elem = ((function() {
          var _i, _len, _ref, _results1;
          _ref = $scope.timelineConfig.data;
          _results1 = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            elem = _ref[_i];
            if (elem.name === idx) {
              _results1.push(elem);
            }
          }
          return _results1;
        })())[0];
        if (data.prepend) {
          elem.raw = $.merge(data.prepend, elem.raw);
        }
        if (data.update) {
          _ref = data.update;
          for (k in _ref) {
            v = _ref[k];
            elem.raw[k].value = v;
          }
        }
        _results.push(++elem.epoch_raw);
      }
      return _results;
    };
    /*
    $(document).on('keydown', (e) ->
        # console.log e.keyCode
        if e.keyCode == 39
            $scope.$apply ->
                $scope.addData()
                $scope.timelineConfig.selected_start += 10000
                $scope.timelineConfig.selected_end   += 10000
                $scope.timelineConfig.visible_start += 1000000
                $scope.timelineConfig.visible_end   += 1000000
    )
    */

    $.get('scripts/weekly.json', function(response) {
      var chunk, _i, _len, _ref;
      _ref = $scope.timelineConfig.data;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        chunk = _ref[_i];
        if (chunk.name === "Weekly") {
          chunk.raw = response;
          chunk.epoch_raw;
          break;
        }
      }
      return $scope.$apply();
    });
    a = {};
    $.get('scripts/hourly.json', function(response) {
      var chunk, _i, _len, _ref;
      _ref = $scope.timelineConfig.data;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        chunk = _ref[_i];
        if (chunk.name === "Hourly") {
          chunk.raw = response;
          chunk.epoch_raw;
          break;
        }
      }
      return $scope.$apply();
    });
    now = 1396596660;
    $scope.timelineConfig = {
      is_period: true,
      selected_start: now - 60 * 60 * 2,
      selected_end: now,
      visible_start: now - 26517600 + 60 * 60 * 24,
      visible_end: now + 60 * 60 * 24,
      /*
      selected_start: 1385856000,    # December 1, 2013, midnight
      selected_end: 1388849426,      # January 4, 2013, 15:30:26
      
      visible_start: 1370044800,     # - 3600 # June 1, 2013, midnight
      visible_end:   1388849426,     # January 4, 2013, 15:30:26 # 1388530800
      */

      is_start_tracked: false,
      is_end_tracked: true,
      predefined_choices: [
        {
          start: 1385856000,
          end: 1388534400,
          start_tracked: false,
          end_tracked: false,
          name: "Last full month"
        }, {
          start: 1386257426,
          end: 1388849426,
          start_tracked: true,
          end_tracked: true,
          name: "Last 30 days"
        }, {
          start: 1199464226,
          end: 1388849426,
          start_tracked: false,
          end_tracked: true,
          name: "Last 5 years"
        }
      ],
      data: [
        {
          name: "Yearly",
          bin_width: 60 * 60 * 24 * 365,
          active: false,
          epoch_raw: 0,
          raw: [
            {
              start: 1377993600,
              end: 1377993600 + 60 * 60 * 24 * 365,
              value: 14
            }
          ],
          epoch_state: 0,
          state: []
        }, {
          name: "Daily",
          bin_width: 60 * 60 * 24,
          active: false,
          epoch_raw: 123,
          raw: [
            {
              start: 1377993600,
              end: 1377993600 + 60 * 60 * 24,
              value: 14
            }
          ],
          epoch_state: 442,
          state: []
        }, {
          name: "Monthly",
          bin_width: 60 * 60 * 24 * 30,
          active: true,
          epoch_raw: 314159,
          raw: [
            {
              start: 1377993600,
              end: 1380585600,
              value: 11
            }, {
              start: 1380585600,
              end: 1383271200,
              value: 13
            }, {
              start: 1385863200,
              end: 1388541600 - 7200,
              value: 14
            }, {
              start: 1388541600 - 7200,
              end: 1391541600,
              value: 15
            }
          ],
          epoch_state: 924657,
          state: [
            {
              start: 1377993600,
              end: 1381795200,
              state: "loaded"
            }, {
              start: 1381795200,
              end: 1382400000,
              state: "missing"
            }, {
              start: 1382400000,
              end: 1385856000,
              state: "computing"
            }, {
              start: 1385856000,
              end: 1388541600,
              state: "loaded"
            }
          ]
        }, {
          name: "Weekly",
          bin_width: 60 * 60 * 24 * 7,
          active: true,
          epoch_raw: 123,
          raw: [
            {
              start: 1377302400,
              end: 1377907200,
              value: 10.000000
            }, {
              start: 1377907200,
              end: 1378512000,
              value: 10.499167
            }, {
              start: 1378512000,
              end: 1379116800,
              value: 10.993347
            }, {
              start: 1379116800,
              end: 1379721600,
              value: 11.477601
            }, {
              start: 1379721600,
              end: 1380326400,
              value: 11.947092
            }, {
              start: 1380326400,
              end: 1380931200,
              value: 12.397128
            }, {
              start: 1380931200,
              end: 1381536000,
              value: 12.823212
            }, {
              start: 1381536000,
              end: 1382140800,
              value: 13.221088
            }, {
              start: 1382140800,
              end: 1382745600,
              value: 13.586780
            }, {
              start: 1382745600,
              end: 1383350400,
              value: 13.916635
            }, {
              start: 1383350400,
              end: 1383955200,
              value: 14.207355
            }, {
              start: 1383955200,
              end: 1384560000,
              value: 14.456037
            }, {
              start: 1384560000,
              end: 1385164800,
              value: 14.660195
            }, {
              start: 1385164800,
              end: 1385769600,
              value: 14.817791
            }, {
              start: 1385769600,
              end: 1386374400,
              value: 14.927249
            }, {
              start: 1386374400,
              end: 1386979200,
              value: 14.987475
            }, {
              start: 1386979200,
              end: 1387584000,
              value: 14.997868
            }, {
              start: 1387584000,
              end: 1388188800,
              value: 14.958324
            }, {
              start: 1388188800,
              end: 1388793600,
              value: 14.869238
            }, {
              start: 1388793600,
              end: 1389398400,
              value: 14.731500
            }, {
              start: 1389398400,
              end: 1390003200,
              value: 14.546487
            }, {
              start: 1390003200,
              end: 1390608000,
              value: 14.316047
            }, {
              start: 1390608000,
              end: 1391212800,
              value: 14.042482
            }, {
              start: 1391212800,
              end: 1391817600,
              value: 13.728526
            }, {
              start: 1391817600,
              end: 1392422400,
              value: 13.377316
            }, {
              start: 1392422400,
              end: 1393027200,
              value: 12.992361
            }, {
              start: 1393027200,
              end: 1393632000,
              value: 12.577507
            }, {
              start: 1393632000,
              end: 1394236800,
              value: 12.136899
            }, {
              start: 1394236800,
              end: 1394841600,
              value: 11.674941
            }, {
              start: 1394841600,
              end: 1395446400,
              value: 11.196247
            }
          ],
          epoch_state: 442,
          state: [
            {
              start: 1377302400,
              end: 1395446400,
              state: "loaded"
            }
          ]
        }, {
          name: "Hourly",
          bin_width: 60 * 60,
          active: false,
          epoch_raw: 123,
          raw: [
            {
              start: 1379721600 + 60 * 60 * 0,
              end: 1379721600 + 60 * 60 * 1,
              value: 2
            }, {
              start: 1379721600 + 60 * 60 * 1,
              end: 1379721600 + 60 * 60 * 2,
              value: 3
            }, {
              start: 1379721600 + 60 * 60 * 2,
              end: 1379721600 + 60 * 60 * 3,
              value: 4
            }, {
              start: 1379721600 + 60 * 60 * 3,
              end: 1379721600 + 60 * 60 * 4,
              value: 5
            }, {
              start: 1379721600 + 60 * 60 * 4,
              end: 1379721600 + 60 * 60 * 5,
              value: 6
            }, {
              start: 1379721600 + 60 * 60 * 5,
              end: 1379721600 + 60 * 60 * 6,
              value: 7
            }, {
              start: 1379721600 + 60 * 60 * 6,
              end: 1379721600 + 60 * 60 * 7,
              value: 8
            }, {
              start: 1379721600 + 60 * 60 * 7,
              end: 1379721600 + 60 * 60 * 8,
              value: 9
            }, {
              start: 1379721600 + 60 * 60 * 8,
              end: 1379721600 + 60 * 60 * 9,
              value: 10
            }, {
              start: 1379721600 + 60 * 60 * 9,
              end: 1379721600 + 60 * 60 * 10,
              value: 11
            }
          ],
          epoch_state: 442,
          state: []
        }, {
          name: "Minutely",
          bin_width: 60,
          active: false,
          epoch_raw: 123,
          raw: [
            {
              start: 1379721600 + 60 * 0,
              end: 1379721600 + 60 * 1,
              value: 2
            }, {
              start: 1379721600 + 60 * 1,
              end: 1379721600 + 60 * 2,
              value: 3
            }, {
              start: 1379721600 + 60 * 2,
              end: 1379721600 + 60 * 3,
              value: 4
            }, {
              start: 1379721600 + 60 * 3,
              end: 1379721600 + 60 * 4,
              value: 5
            }, {
              start: 1379721600 + 60 * 4,
              end: 1379721600 + 60 * 5,
              value: 6
            }, {
              start: 1379721600 + 60 * 5,
              end: 1379721600 + 60 * 6,
              value: 7
            }, {
              start: 1379721600 + 60 * 6,
              end: 1379721600 + 60 * 7,
              value: 8
            }, {
              start: 1379721600 + 60 * 7,
              end: 1379721600 + 60 * 8,
              value: 9
            }, {
              start: 1379721600 + 60 * 8,
              end: 1379721600 + 60 * 9,
              value: 10
            }, {
              start: 1379721600 + 60 * 9,
              end: 1379721600 + 60 * 10,
              value: 11
            }
          ],
          epoch_state: 442,
          state: []
        }
      ]
    };
    $scope.timelineConfigNarrow = $.extend(true, {}, $scope.timelineConfig);
    $scope.timelineConfigTooNarrow = $.extend(true, {}, $scope.timelineConfig);
    $scope.timelineConfigPointInTime = $.extend(true, {}, $scope.timelineConfig);
    $scope.timelineConfigPointInTime.is_period = false;
    $scope.timelineConfigPointInTime.selected_end = $scope.timelineConfigPointInTime.selected_start;
    $scope.timelineConfigPointInTime.is_end_tracked = $scope.timelineConfigPointInTime.is_start_tracked;
    return $scope.timelineConfigMinutes = $.extend(true, {}, $scope.timelineConfig);
  };

  angular.module('wh.timeline.demo', ['wh.timeline']);

  angular.bootstrap(document.body, ['wh.timeline.demo']);

}).call(this);

/*
//@ sourceMappingURL=app.js.map
*/