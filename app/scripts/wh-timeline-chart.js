(function() {
  var Chart, ChartDataModel, ChartManager, ChartView, ChartViewModel, D3ChartManager, D3ChartView, D3HTMLChartView, HistogramView, SimpleStateRenderer, StateRenderer, _ref, _ref1, _ref2,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  StateRenderer = (function() {
    function StateRenderer() {}

    StateRenderer.prototype.setup = function(manager) {
      this.manager = manager;
    };

    StateRenderer.prototype.render = function() {};

    return StateRenderer;

  })();

  SimpleStateRenderer = (function(_super) {
    __extends(SimpleStateRenderer, _super);

    function SimpleStateRenderer() {
      _ref = SimpleStateRenderer.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    SimpleStateRenderer.prototype.render = function() {};

    return SimpleStateRenderer;

  })(StateRenderer);

  ChartDataModel = (function() {
    function ChartDataModel(perspective, binWidth) {
      var defaults;
      defaults = {
        perspective: perspective,
        binWidth: binWidth,
        visibleTimeInterval: null,
        processedRawData: null,
        processedStateData: null,
        initial: {
          visibleTimeInterval: null
        }
      };
      $.extend(this, defaults);
    }

    ChartDataModel.prototype.updateVisibleTimeInterval = function(visibleTimeInterval, forceRefreshInitialWidth) {
      this.visibleTimeInterval = visibleTimeInterval;
      if (forceRefreshInitialWidth == null) {
        forceRefreshInitialWidth = false;
      }
      if (forceRefreshInitialWidth || !this.initial.visibleTimeInterval) {
        return this.initial.visibleTimeInterval = this.visibleTimeInterval;
      }
    };

    ChartDataModel.prototype.updateRaw = function(processedRawData) {
      this.processedRawData = processedRawData;
    };

    ChartDataModel.prototype.updateState = function(processedStateData) {
      this.processedStateData = processedStateData;
    };

    return ChartDataModel;

  })();

  ChartViewModel = (function() {
    function ChartViewModel(container) {
      var defaults;
      defaults = {
        zoom: 1,
        chartPane: container.find('.chart-pane'),
        viewport: container.find('.chart-viewport'),
        chartsThemselves: container.find('.charts-themselves'),
        yAxisPane: container.find('.y-axis-pane'),
        xAxisPane: container.find('.x-axis-pane'),
        container: container,
        renderingBufferLeft: 2,
        renderingBufferRight: 2,
        containerData: {
          width: 0,
          height: 0
        },
        dataArea: {
          width: null,
          height: null,
          visibleWidth: null,
          stepWidth: null
        },
        initial: {
          dataArea: {
            visibleWidth: null
          }
        }
      };
      $.extend(this, defaults);
    }

    ChartViewModel.prototype.refreshDimensions = function() {
      this.refreshContainerDimensions();
      this.refreshDataAreaDimensions();
      return this.refreshDataAreaVisibleWidth();
    };

    ChartViewModel.prototype.refreshContainerDimensions = function() {
      this.containerData.width = this.container.width();
      return this.containerData.height = this.chartsThemselves.height();
    };

    ChartViewModel.prototype.refreshDataAreaDimensions = function() {
      this.dataArea.width = this.chartPane.width();
      return this.dataArea.height = this.containerData.height;
    };

    ChartViewModel.prototype.refreshDataAreaVisibleWidth = function(forceRefreshInitialWidth) {
      if (forceRefreshInitialWidth == null) {
        forceRefreshInitialWidth = false;
      }
      this.dataArea.visibleWidth = this.containerData.width;
      if (forceRefreshInitialWidth || !this.initial.dataArea.visibleWidth) {
        return this.initial.dataArea.visibleWidth = this.dataArea.visibleWidth;
      }
    };

    ChartViewModel.prototype.getVisibleAreaDeltaRatio = function() {
      return this.dataArea.visibleWidth / this.initial.dataArea.visibleWidth;
    };

    return ChartViewModel;

  })();

  Chart = (function() {
    function Chart(dataModel) {
      this.dataModel = dataModel;
    }

    return Chart;

  })();

  ChartView = (function() {
    function ChartView() {}

    ChartView.prototype.render = function() {};

    return ChartView;

  })();

  D3ChartView = (function(_super) {
    __extends(D3ChartView, _super);

    function D3ChartView(chart) {
      this.chart = chart;
      this.data = null;
      this.ticksCache = {};
    }

    D3ChartView.prototype.allXTicks = function() {
      var cacheKey, countTo, from, ticksData, to, _ref1;
      _ref1 = this.x.domain(), from = _ref1[0], to = _ref1[1];
      /*
      @data[0].date
      to = @data[@data.length-1].date
      */

      cacheKey = from.getTime() + "," + to.getTime();
      if (true || !this.ticksCache[cacheKey]) {
        countTo = new Date();
        countTo.setTime(to.getTime() + 1.2 * (to.getTime() - from.getTime()) / this.data.length);
        ticksData = this.xAxis.ticks();
        this.ticksCache[cacheKey] = ticksData[0](from, countTo, 1);
      }
      return this.ticksCache[cacheKey];
    };

    D3ChartView.prototype.xToDate = function(x) {
      return this.x.invert(x);
    };

    D3ChartView.prototype.dateToX = function(date) {
      return this.tickValue(date);
    };

    D3ChartView.prototype.tickValue = function(tick) {
      return Math.ceil(this.x(tick) - 0.00001);
    };

    D3ChartView.prototype.findSurroundingTicks = function(date, shift) {
      var found, i, millis, tick, ticks, _i, _len;
      if (shift == null) {
        shift = 0;
      }
      ticks = this.allXTicks();
      millis = date.getTime();
      i = 0;
      found = false;
      for (_i = 0, _len = ticks.length; _i < _len; _i++) {
        tick = ticks[_i];
        if (tick.getTime() >= millis) {
          found = true;
          break;
        }
        ++i;
      }
      if (!found) {
        i -= 1;
      }
      return [ticks[i - 1 + shift], ticks[i + shift]];
    };

    D3ChartView.prototype.prepareData = function() {
      return this.data = this.chart.dataModel.processedRawData.map(function(elem) {
        return {
          date: new Date(elem.start * 1000),
          value: elem.value
        };
      });
    };

    D3ChartView.prototype.createXAxis = function() {
      var interval, step, subInterval, tickDensity;
      this.x = d3.time.scale.utc();
      this.x.range([0, this.renderOptions.renderWidth]);
      this.x.domain([this.renderOptions.renderSince, this.renderOptions.renderTo]);
      interval = (function() {
        switch (this.chart.dataModel.perspective) {
          case "Yearly":
            return d3.time.years.utc;
          case "Monthly":
            return d3.time.months.utc;
          case "Weekly":
            return d3.time.saturdays.utc;
          case "Daily":
            return d3.time.days.utc;
          case "Hourly":
            return d3.time.hours.utc;
          case "Minutely":
            return d3.time.minutes.utc;
          case "Secondely":
            return d3.time.seconds.utc;
          default:
            throw "Unknown time perspective " + this.chart.dataModel.perspective;
        }
      }).call(this);
      subInterval = function(from, to, step) {
        var e, _i, _len, _ref1, _results;
        if (step == null) {
          step = 1;
        }
        _ref1 = interval(from, to, 1);
        _results = [];
        for ((step > 0 ? (_i = 0, _len = _ref1.length) : _i = _ref1.length - 1); step > 0 ? _i < _len : _i >= 0; _i += step) {
          e = _ref1[_i];
          _results.push(e);
        }
        return _results;
      };
      tickDensity = this.renderOptions.renderWidth / subInterval(this.renderOptions.renderSince, this.renderOptions.renderTo).length;
      step = Math.max(1, Math.ceil(25 / tickDensity + 0.00001));
      return this.xAxis = d3.svg.axis().scale(this.x).orient("bottom").ticks(subInterval, step).tickFormat(d3.time.format.utc('%e %B %Y'));
    };

    D3ChartView.prototype.createYAxis = function() {
      this.y = d3.scale.linear().range([this.renderOptions.viewModel.dataArea.height, 0]);
      this.y.domain([0, this.renderOptions.yMax]);
      return this.yAxis = d3.svg.axis().scale(this.y).orient("left").ticks(2);
    };

    D3ChartView.prototype.processSkeleton = function() {};

    D3ChartView.prototype.setRenderOptions = function(renderOptions) {
      this.renderOptions = renderOptions != null ? renderOptions : {};
    };

    D3ChartView.prototype.render = function(renderOptions) {
      this.setRenderOptions(renderOptions);
      this.prepareData();
      this.createXAxis();
      this.createYAxis();
      this.processSkeleton();
      this.redraw();
      return this.$svg.finish().fadeIn(this.renderOptions.animDuration);
    };

    D3ChartView.prototype.redraw = function() {};

    D3ChartView.prototype.unrender = function(renderOptions) {
      this.setRenderOptions(renderOptions);
      this.data = [];
      this.processSkeleton();
      this.redraw();
      return this.$svg.finish().fadeOut(this.renderOptions.animDuration);
    };

    return D3ChartView;

  })(ChartView);

  D3HTMLChartView = (function(_super) {
    __extends(D3HTMLChartView, _super);

    function D3HTMLChartView() {
      _ref1 = D3HTMLChartView.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    D3HTMLChartView.prototype.processSkeleton = function() {
      var view;
      view = this;
      if (!this.svg) {
        this.svg = d3.select(this.renderOptions.viewModel.chartsThemselves[0]).append("div").attr("width", this.renderOptions.renderWidth / 2).attr("height", '100%').append("span").attr("class", "g");
        this.$svg = $(this.svg[0][0].parentNode);
      }
      return this.$svg.attr("class", "svg " + this.renderOptions.className);
      /*
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Frequency")
      */

    };

    return D3HTMLChartView;

  })(D3ChartView);

  HistogramView = (function(_super) {
    __extends(HistogramView, _super);

    function HistogramView() {
      _ref2 = HistogramView.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    HistogramView.prototype.redraw = function() {
      var bar, calcWidthFn, calcXFn, tv, view;
      HistogramView.__super__.redraw.call(this);
      view = this;
      tv = this.tickValue.bind(this);
      calcXFn = function(d) {
        this.dataset._calcX = tv(d.date);
        return this.dataset._calcX + "px";
      };
      calcWidthFn = function(d) {
        var calcX, next, prev, ticks, _ref3;
        ticks = view.allXTicks();
        calcX = this.dataset._calcX;
        _ref3 = view.findSurroundingTicks(d.date, 1), prev = _ref3[0], next = _ref3[1];
        this.dataset._calcWidth = tv(next) - tv(prev) - 1;
        return this.dataset._calcWidth + "px";
      };
      bar = this.svg.selectAll(".bar").data(this.data, function(d) {
        return d.date;
      });
      bar.enter().append("div").attr("class", "bar rect").style("left", calcXFn).style("width", calcWidthFn).style("top", view.renderOptions.viewModel.dataArea.height + "px").style("height", 0);
      bar.attr("class", "bar rect update").style("left", calcXFn).style("width", calcWidthFn).transition().duration(this.renderOptions.animDuration).style("top", function(d) {
        this.dataset._calcY = Math.ceil(view.y(d.value));
        return this.dataset._calcY + "px";
      }).style("height", function(d) {
        return (view.renderOptions.viewModel.dataArea.height - this.dataset._calcY) + "px";
      });
      return bar.exit().attr("class", "bar rect exit").style("left", calcXFn).style("width", calcWidthFn).transition().duration(this.renderOptions.animDuration).style("top", view.renderOptions.viewModel.dataArea.height + "px").style("height", "0px").remove();
      /*
      bar.append("text")
         .attr("dy", "1.5em")
         .attr("height", 6)
         .attr("x", -> this.parentNode.calcWidth/2)
         .text((d) -> return d.value.toFixed(2) )
      */

    };

    return HistogramView;

  })(D3HTMLChartView);

  ChartManager = (function() {
    function ChartManager() {
      this.beforeRender = $.noop;
      this.pool = {};
      this.activePerspectives = [];
      this.defaultRenderOptions = {
        yMax: 0,
        animDuration: 750
      };
    }

    ChartManager.prototype.manageChart = function(chart, viewType) {
      var perspective;
      perspective = chart.dataModel.perspective;
      return this.pool[perspective] = {
        chart: chart,
        view: new viewType(chart),
        rendered: false
      };
    };

    ChartManager.prototype.hasChart = function(perspective) {
      return perspective in this.pool;
    };

    ChartManager.prototype.getChart = function(perspective) {
      return this.pool[perspective];
    };

    ChartManager.prototype.removeChart = function(perspective) {
      return delete this.pool[perspective];
    };

    ChartManager.prototype.xToDate = function(x) {};

    ChartManager.prototype.dateToX = function(date) {};

    ChartManager.prototype.getActiveCharts = function() {
      var active, perspective, _i, _len, _ref3;
      active = [];
      _ref3 = this.activePerspectives;
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        perspective = _ref3[_i];
        active.push(this.pool[perspective]);
      }
      return active;
    };

    ChartManager.prototype.getMainActiveChart = function() {
      return this.getActiveCharts().shift();
    };

    ChartManager.prototype.setActiveCharts = function(perspectives) {
      if (Object.prototype.toString.call(perspectives) !== '[object Array]') {
        perspectives = [perspectives];
      }
      return this.activePerspectives = perspectives;
    };

    ChartManager.prototype.computeRenderOptions = function(charts) {
      var chunk, elem, milliseconds, options, visibleInterval, _i, _j, _len, _len1, _ref3;
      options = $.extend({}, this.defaultRenderOptions);
      for (_i = 0, _len = charts.length; _i < _len; _i++) {
        elem = charts[_i];
        _ref3 = elem.chart.dataModel.processedRawData;
        for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
          chunk = _ref3[_j];
          options.yMax = Math.max(options.yMax, chunk.value);
        }
      }
      options.yMax = Math.ceil(options.yMax);
      options.viewModel = this.viewModel;
      visibleInterval = this.getMainActiveChart().chart.dataModel.visibleTimeInterval;
      milliseconds = visibleInterval.milliseconds();
      options.renderWidth = this.viewModel.dataArea.width * this.viewModel.renderingBufferLeft + this.viewModel.dataArea.width * this.viewModel.renderingBufferRight + this.viewModel.dataArea.width;
      options.renderBefore = this.viewModel.dataArea.width * this.viewModel.renderingBufferLeft;
      options.renderAfter = this.viewModel.dataArea.width * this.viewModel.renderingBufferRight;
      options.renderSince = new Date(visibleInterval.start - milliseconds * this.viewModel.renderingBufferLeft);
      options.renderTo = new Date(visibleInterval.end + milliseconds * this.viewModel.renderingBufferRight);
      return options;
    };

    ChartManager.prototype.updateVisibleTimeInterval = function(interval) {
      var elem, perspective, _ref3, _results;
      _ref3 = this.pool;
      _results = [];
      for (perspective in _ref3) {
        elem = _ref3[perspective];
        _results.push(elem.chart.dataModel.updateVisibleTimeInterval(interval));
      }
      return _results;
    };

    ChartManager.prototype.suppressRendering = function(should) {
      if (should == null) {
        should = true;
      }
      return this.renderingSuppressed = should;
    };

    ChartManager.prototype.renderCurrentState = function(force) {
      var activeCharts, elem, perspective, renderOptions, _ref3;
      if (force == null) {
        force = false;
      }
      if (this.renderingSuppressed && !force) {
        return;
      }
      activeCharts = this.getActiveCharts();
      if (!activeCharts.length) {
        return;
      }
      this.beforeRender();
      renderOptions = this.computeRenderOptions(activeCharts);
      _ref3 = this.pool;
      for (perspective in _ref3) {
        elem = _ref3[perspective];
        if (elem.rendered && __indexOf.call(this.activePerspectives, perspective) < 0) {
          elem.view.unrender($.extend(renderOptions, {
            className: "inactive"
          }));
        }
      }
      return this.doRenderCurrentState(activeCharts.reverse(), renderOptions);
    };

    ChartManager.prototype.doRenderCurrentState = function(activeCharts, renderOptions) {
      var elem, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = activeCharts.length; _i < _len; _i++) {
        elem = activeCharts[_i];
        elem.view.render(renderOptions);
        _results.push(elem.rendered = true);
      }
      return _results;
    };

    return ChartManager;

  })();

  D3ChartManager = (function(_super) {
    __extends(D3ChartManager, _super);

    function D3ChartManager(viewModel) {
      this.viewModel = viewModel;
      this.viewModel.refreshDimensions();
      this.svg = null;
      D3ChartManager.__super__.constructor.call(this);
    }

    D3ChartManager.prototype.xToDate = function(x) {
      return this.getMainActiveChart().view.xToDate(x);
    };

    D3ChartManager.prototype.dateToX = function(date) {
      return this.getMainActiveChart().view.dateToX(date);
    };

    D3ChartManager.prototype.getContainer = function() {
      return this.viewModel.container;
    };

    D3ChartManager.prototype.refreshPaneDimensions = function() {
      return this.viewModel.refreshDimensions();
    };

    D3ChartManager.prototype.doRenderCurrentState = function(activeCharts, renderOptions) {
      var elem, i, mainIdx, _i, _len;
      mainIdx = activeCharts.length - 1;
      i = 0;
      for (_i = 0, _len = activeCharts.length; _i < _len; _i++) {
        elem = activeCharts[_i];
        elem.view.render($.extend(renderOptions, {
          className: "active " + (i === mainIdx ? "main" : "secondary")
        }));
        elem.rendered = true;
        i++;
      }
      this.viewModel.viewportLeft = -renderOptions.renderBefore;
      this.viewModel.viewport.css('left', this.viewModel.viewportLeft);
      return this.doRenderAxes(activeCharts, renderOptions);
    };

    D3ChartManager.prototype.doRenderAxes = function(activeCharts, renderOptions) {
      var chart, d3cm, mainChart, view;
      mainChart = this.getMainActiveChart();
      view = mainChart.view;
      chart = mainChart.chart;
      d3cm = this;
      if (!this.xAxisSvg) {
        this.xAxisSvg = d3.select(this.viewModel.xAxisPane[0]).append("svg").attr("width", renderOptions.renderWidth).attr("height", '100%').append("g");
        this.yAxisSvg = d3.select(this.viewModel.yAxisPane[0]).append("svg").attr("width", '26').attr("height", '100%').append("g");
        this.xAxisElem = this.xAxisSvg.append("g").attr("class", "x axis").attr("transform", "translate(0, 0)");
        this.yAxisElem = this.yAxisSvg.append("g").attr("class", "y axis").attr("transform", "translate(25, 0)");
      }
      this.yAxisElem.transition().duration(renderOptions.animDuration).call(view.yAxis);
      return this.xAxisElem.call(view.xAxis).selectAll('.tick').attr("transform", function(d) {
        return "translate(" + view.tickValue(d) + ", 0)";
      }).each(function(d, i) {
        return d3.select(this).selectAll('text').style("text-anchor", "start").attr("transform", "rotate(45)").attr("dy", "0.3em").attr("dx", "0.6em");
      });
    };

    return D3ChartManager;

  })(ChartManager);

  angular.module('wh.timeline').factory('wh.timeline.chart.ChartDataModel', function() {
    return ChartDataModel;
  }).factory('wh.timeline.chart.ChartViewModel', function() {
    return ChartViewModel;
  }).factory('wh.timeline.chart.Chart', function() {
    return Chart;
  }).factory('wh.timeline.chart.D3ChartManager', function() {
    return D3ChartManager;
  }).factory('wh.timeline.chart.view.Histogram', function() {
    return HistogramView;
  });

}).call(this);

//# sourceMappingURL=../../app/scripts/wh-timeline-chart.js.map
