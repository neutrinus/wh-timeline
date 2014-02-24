/**
* @ngdoc service
* @name wh.timeline.chart.ChartDataModel
*
* @description
* Stores chart related model data such as visible time perspectiveor binWidth
*
*/


(function() {
  var Chart, ChartDataModel, ChartManager, ChartView, ChartViewModel, D3ChartManager, D3ChartView, D3HTMLChartView, HistogramView, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

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

  /**
  * @ngdoc service
  * @name wh.timeline.chart.ChartViewModel
  *
  * @description
  * Stores chart related view data such as viewport size or axes containers
  *
  */


  ChartViewModel = (function() {
    function ChartViewModel(container) {
      var defaults;
      defaults = {
        zoom: 1,
        viewport: container.find('.chart-viewport'),
        pane: container.find('.chart-pane'),
        chartsThemselves: container.find('.charts'),
        yAxisPane: container.find('.y-axis-pane'),
        xAxisPane: container.find('.x-axis-pane'),
        container: container,
        renderingBufferLeft: 2,
        renderingBufferRight: 2,
        containerData: {
          width: 0,
          height: 0
        },
        viewportOverlay: {
          width: null,
          height: null,
          visibleWidth: null,
          stepWidth: null
        },
        initial: {
          viewportOverlay: {
            visibleWidth: null
          }
        }
      };
      $.extend(this, defaults);
    }

    ChartViewModel.prototype.refreshDimensions = function() {
      this.refreshContainerDimensions();
      this.refreshViewportOverlayDimensions();
      return this.refreshViewportOverlayVisibleWidth();
    };

    ChartViewModel.prototype.refreshContainerDimensions = function() {
      this.containerData.width = this.container.width();
      return this.containerData.height = this.chartsThemselves.height();
    };

    ChartViewModel.prototype.refreshViewportOverlayDimensions = function() {
      this.viewportOverlay.width = this.viewport.width();
      return this.viewportOverlay.height = this.containerData.height;
    };

    ChartViewModel.prototype.refreshViewportOverlayVisibleWidth = function(forceRefreshInitialWidth) {
      if (forceRefreshInitialWidth == null) {
        forceRefreshInitialWidth = false;
      }
      this.viewportOverlay.visibleWidth = this.containerData.width;
      if (forceRefreshInitialWidth || !this.initial.viewportOverlay.visibleWidth) {
        return this.initial.viewportOverlay.visibleWidth = this.viewportOverlay.visibleWidth;
      }
    };

    ChartViewModel.prototype.getVisibleAreaDeltaRatio = function() {
      return this.viewportOverlay.visibleWidth / this.initial.viewportOverlay.visibleWidth;
    };

    return ChartViewModel;

  })();

  /**
  * @ngdoc service
  * @name wh.timeline.chart.Chart
  *
  * @description
  * Chart object, at the moment it's just a wrapper for ChartDataModel
  */


  Chart = (function() {
    function Chart(dataModel) {
      this.dataModel = dataModel;
    }

    return Chart;

  })();

  /**
  * @ngdoc object
  * @name wh.timeline.chart.ChartView
  *
  * @description
  * Abstract class for a reference of what methods are necessary
  */


  ChartView = (function() {
    function ChartView() {}

    ChartView.prototype.render = function() {};

    return ChartView;

  })();

  /**
  * @ngdoc object
  * @name wh.timeline.chart.D3ChartView
  *
  * @description
  * Abstract ChartView implementation for D3 chart library
  */


  D3ChartView = (function(_super) {
    __extends(D3ChartView, _super);

    function D3ChartView(chart) {
      this.chart = chart;
      this.data = null;
      this.ticksCache = {};
    }

    D3ChartView.prototype.allXTicks = function() {
      var cacheKey, countTo, from, ticksData, to, _ref;
      _ref = this.x.domain(), from = _ref[0], to = _ref[1];
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

    /**
    * @ngdoc method
    * @methodOf wh.timeline.chart.D3ChartView
    * @name wh.timeline.chart.D3ChartView#xToDate
    *
    * @param {integer} x  X coordinate within chart pane
    *
    * @return {date} Date that is currently represented by X coordinate
    */


    D3ChartView.prototype.xToDate = function(x) {
      return this.x.invert(x);
    };

    /**
    * @ngdoc method
    * @methodOf wh.timeline.chart.D3ChartView
    * @namewh.timeline.chart.D3ChartView#dateToX
    *
    * @param {Date} date  Date to convert
    *
    * @return {integer} X coordinate that is represented by date
    */


    D3ChartView.prototype.dateToX = function(date) {
      return this.tickValue(date);
    };

    /**
    * @ngdoc method
    * @methodOf wh.timeline.chart.D3ChartView
    * @namewh.timeline.chart.D3ChartView#tickValue
    *
    * @param {tick} tick
    *
    * @return {integer} Rounded X coordinate represented by `tick`
    */


    D3ChartView.prototype.tickValue = function(tick) {
      return Math.ceil(this.x(tick) - 0.00001);
    };

    /**
    * @ngdoc method
    * @methodOf wh.timeline.chart.D3ChartView
    * @name wh.timeline.chart.D3ChartView#findSurroundingTicks
    * 
    * @description returns tick values surrounding given date. Some ticks may be
    * skipped, e.g. instead of returning two closest midnights it is possible to
    * return compute tick values, move `shift` steps, and then return the result.
    *
    * @param {Date} date      date to 
    * @param {integer} shift  how many ticks to the right should be skipped?
    *
    * @return {array} Previous and next tick values
    */


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

    /**
    * @ngdoc method
    * @methodOf wh.timeline.chart.D3ChartView
    * @name wh.timeline.chart.D3ChartView#prepareData
    * 
    * @description prepares data for internal processing - removes any data bins
    * that wouldn't be rendered anyway - this way huge amounts of data will never
    * cause a bottleneck when rendering
    */


    D3ChartView.prototype.prepareData = function() {
      var bin, renderSinceUnix, renderToUnix, _i, _len, _ref, _results;
      this.data = [];
      renderSinceUnix = this.renderOptions.renderSince / 1000;
      renderToUnix = this.renderOptions.renderTo / 1000;
      _ref = this.chart.dataModel.processedRawData;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        bin = _ref[_i];
        if (bin.start > renderToUnix || bin.end < renderSinceUnix) {
          continue;
        }
        _results.push(this.data.push({
          date: new Date(bin.start * 1000),
          value: bin.value
        }));
      }
      return _results;
    };

    /**
    * @ngdoc method
    * @methodOf wh.timeline.chart.D3ChartView
    * @name wh.timeline.chart.D3ChartView#createXAxis
    * 
    * @description creates X axis object, prepares range and domain,
    * computes custom intervals
    */


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
        var e, _i, _len, _ref, _results;
        if (step == null) {
          step = 1;
        }
        _ref = interval(from, to, 1);
        _results = [];
        for ((step > 0 ? (_i = 0, _len = _ref.length) : _i = _ref.length - 1); step > 0 ? _i < _len : _i >= 0; _i += step) {
          e = _ref[_i];
          _results.push(e);
        }
        return _results;
      };
      tickDensity = this.renderOptions.renderWidth / subInterval(this.renderOptions.renderSince, this.renderOptions.renderTo).length;
      step = Math.max(1, Math.ceil(25 / tickDensity + 0.00001));
      return this.xAxis = d3.svg.axis().scale(this.x).orient("bottom").ticks(subInterval, step).tickFormat(d3.time.format.utc('%e %B %Y'));
    };

    /**
    * @ngdoc method
    * @methodOf wh.timeline.chart.D3ChartView
    * @name wh.timeline.chart.D3ChartView#createYAxis
    * 
    * @description creates Y axis object, prepares range and domain
    */


    D3ChartView.prototype.createYAxis = function() {
      this.y = d3.scale.linear().range([this.renderOptions.viewModel.viewportOverlay.height, 0]);
      this.y.domain([0, this.renderOptions.yMax]);
      return this.yAxis = d3.svg.axis().scale(this.y).orient("left").ticks(2);
    };

    /**
    * @ngdoc method
    * @methodOf wh.timeline.chart.D3ChartView
    * @name wh.timeline.chart.D3ChartView#prepareChartPane
    * 
    * @description prepares/creates chart pane for further rendering
    */


    D3ChartView.prototype.prepareChartPane = function() {};

    D3ChartView.prototype.setRenderOptions = function(renderOptions) {
      this.renderOptions = renderOptions != null ? renderOptions : {};
    };

    /**
    * @ngdoc method
    * @methodOf wh.timeline.chart.D3ChartView
    * @name wh.timeline.chart.D3ChartView#prepareChartPane
    *
    * @param {object} renderOptions rendering options
    * * viewModel    - rendered chart's viewModel
    * * yMax         - rendered y axis height in pixels
    * * renderWidth  - rendered x axis width in pixels
    * * renderSince  - timestamp (milliseconds) of the point in time when the chart should start
    * * renderTo     - timestamp (milliseconds) of the point in time when the chart should end
    * * animDuration - how long animations should last (in milliseconds)
    * * className    - for chart pane
    *
    * @description renders/updates the chart component (axes, chart data)
    */


    D3ChartView.prototype.render = function(renderOptions) {
      this.setRenderOptions(renderOptions);
      this.prepareData();
      this.createXAxis();
      this.createYAxis();
      this.prepareChartPane();
      this.redraw();
      return this.$svg.finish().fadeIn(this.renderOptions.animDuration);
    };

    /**
    * @ngdoc method
    * @methodOf wh.timeline.chart.D3ChartView
    * @name wh.timeline.chart.D3ChartView#redraw
    * @description renders/updates chart data only (e.g. bars in case of histogram) -
    * doesn't do anything with axes or anything else
    */


    D3ChartView.prototype.redraw = function() {};

    /**
    * @ngdoc method
    * @methodOf wh.timeline.chart.D3ChartView
    * @name wh.timeline.chart.D3ChartView#prepareChartPane
    *
    * @param {object} renderOptions rendering options @see wh.timeline.chart.D3ChartView#prepareChartPane
    * @description removes data from this chart, animates bars, hides this chart
    */


    D3ChartView.prototype.unrender = function(renderOptions) {
      this.setRenderOptions(renderOptions);
      this.data = [];
      this.prepareChartPane();
      this.redraw();
      return this.$svg.finish().fadeOut(this.renderOptions.animDuration);
    };

    return D3ChartView;

  })(ChartView);

  /**
  * @ngdoc object
  * @name wh.timeline.chart.D3HTMLChartView
  *
  * @description
  * Abstract D3ChartView implementation for HTML charts
  */


  D3HTMLChartView = (function(_super) {
    __extends(D3HTMLChartView, _super);

    function D3HTMLChartView() {
      _ref = D3HTMLChartView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    D3HTMLChartView.prototype.prepareChartPane = function() {
      var view;
      view = this;
      if (!this.svg) {
        this.svg = d3.select(this.renderOptions.viewModel.chartsThemselves[0]).append("div").attr("width", this.renderOptions.renderWidth / 2).attr("height", '100%').append("span").attr("class", "g");
        this.$svg = $(this.svg[0][0].parentNode);
      }
      return this.$svg.attr("class", "svg " + this.renderOptions.className);
    };

    return D3HTMLChartView;

  })(D3ChartView);

  /**
  * @ngdoc service
  * @name wh.timeline.chart.view.Histogram
  *
  * @description
  * Histogram chart view implementation
  */


  HistogramView = (function(_super) {
    __extends(HistogramView, _super);

    function HistogramView() {
      _ref1 = HistogramView.__super__.constructor.apply(this, arguments);
      return _ref1;
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
        var calcX, next, prev, ticks, _ref2;
        ticks = view.allXTicks();
        calcX = this.dataset._calcX;
        _ref2 = view.findSurroundingTicks(d.date, 1), prev = _ref2[0], next = _ref2[1];
        this.dataset._calcWidth = tv(next) - tv(prev) - 1;
        return this.dataset._calcWidth + "px";
      };
      bar = this.svg.selectAll(".bar").data(this.data, function(d) {
        return d.date;
      });
      bar.enter().append("div").attr("class", "bar rect").style("left", calcXFn).style("width", calcWidthFn).style("top", view.renderOptions.viewModel.viewportOverlay.height + "px").style("height", 0);
      bar.attr("class", "bar rect update").style("left", calcXFn).style("width", calcWidthFn).transition().duration(this.renderOptions.animDuration).style("top", function(d) {
        this.dataset._calcY = Math.ceil(view.y(d.value));
        return this.dataset._calcY + "px";
      }).style("height", function(d) {
        return (view.renderOptions.viewModel.viewportOverlay.height - this.dataset._calcY) + "px";
      });
      return bar.exit().attr("class", "bar rect exit").style("left", calcXFn).style("width", calcWidthFn).transition().duration(this.renderOptions.animDuration).style("top", view.renderOptions.viewModel.viewportOverlay.height + "px").style("height", "0px").remove();
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

  /**
  * @ngdoc object
  * @name wh.timeline.chart.ChartManager
  *
  * @description
  * Abstract ChartManager implementation
  */


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

    /**
    * @ngdoc method
    * @methodOf wh.timeline.chart.ChartManager
    * @name wh.timeline.chart.ChartManager#manageChart
    *
    * @param {Chart} chart          Chart to manage
    * @param {ChartView} viewClass  ChartView class object that should be used to rendered this chart
    *
    * @description
    * Adds chart to pool of charts managed by this manager
    */


    ChartManager.prototype.manageChart = function(chart, viewClass) {
      var perspective;
      perspective = chart.dataModel.perspective;
      return this.pool[perspective] = {
        chart: chart,
        view: new viewClass(chart),
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

    /**
    * @ngdoc method
    * @methodOf wh.timeline.chart.ChartManager
    * @name wh.timeline.chart.ChartManager#xToDate
    *
    * @param {integer} x  X coordinate within chart pane
    *
    * @return {date} Date that is currently represented by X coordinate
    */


    ChartManager.prototype.xToDate = function(x) {};

    /**
    * @ngdoc method
    * @methodOf wh.timeline.chart.ChartManager
    * @name wh.timeline.chart.ChartManager#dateToX
    *
    * @param {Date} date  Date to convert
    *
    * @return {integer} X coordinate that is represented by date
    */


    ChartManager.prototype.dateToX = function(date) {};

    /**
    * @ngdoc method
    * @methodOf wh.timeline.chart.ChartManager
    * @name wh.timeline.chart.ChartManager#getActiveCharts
    *
    * @return {array} array of active charts, first one is the main one
    */


    ChartManager.prototype.getActiveCharts = function() {
      var active, perspective, _i, _len, _ref2;
      active = [];
      _ref2 = this.activePerspectives;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        perspective = _ref2[_i];
        active.push(this.pool[perspective]);
      }
      return active;
    };

    ChartManager.prototype.getMainActiveChart = function() {
      return this.getActiveCharts().shift();
    };

    /**
    * @ngdoc method
    * @methodOf wh.timeline.chart.ChartManager
    * @name wh.timeline.chart.ChartManager#setActiveCharts
    *
    * @param {array} perspectives Time perspective names
    *
    * @description Tells this ChartManager about time perspectives that are supposed to be active
    */


    ChartManager.prototype.setActiveCharts = function(perspectives) {
      if (Object.prototype.toString.call(perspectives) !== '[object Array]') {
        perspectives = [perspectives];
      }
      return this.activePerspectives = perspectives;
    };

    /**
    * @ngdoc method
    * @methodOf wh.timeline.chart.ChartManager
    * @name wh.timeline.chart.ChartManager#computeRenderOptions
    *
    * @param {array} charts Charts to compute options for
    * @return computed rendered options
    */


    ChartManager.prototype.computeRenderOptions = function(charts) {
      var chunk, elem, milliseconds, options, visibleInterval, _i, _j, _len, _len1, _ref2;
      options = $.extend({}, this.defaultRenderOptions);
      for (_i = 0, _len = charts.length; _i < _len; _i++) {
        elem = charts[_i];
        _ref2 = elem.chart.dataModel.processedRawData;
        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
          chunk = _ref2[_j];
          options.yMax = Math.max(options.yMax, chunk.value);
        }
      }
      options.yMax = Math.ceil(options.yMax);
      options.viewModel = this.viewModel;
      visibleInterval = this.getMainActiveChart().chart.dataModel.visibleTimeInterval;
      milliseconds = visibleInterval.milliseconds();
      options.renderWidth = this.viewModel.viewportOverlay.width * this.viewModel.renderingBufferLeft + this.viewModel.viewportOverlay.width * this.viewModel.renderingBufferRight + this.viewModel.viewportOverlay.width;
      options.renderBefore = this.viewModel.viewportOverlay.width * this.viewModel.renderingBufferLeft;
      options.renderAfter = this.viewModel.viewportOverlay.width * this.viewModel.renderingBufferRight;
      options.renderSince = new Date(visibleInterval.start - milliseconds * this.viewModel.renderingBufferLeft);
      options.renderTo = new Date(visibleInterval.end + milliseconds * this.viewModel.renderingBufferRight);
      return options;
    };

    /**
    * @ngdoc method
    * @methodOf wh.timeline.chart.ChartManager
    * @name wh.timeline.chart.ChartManager#updateVisibleTimeInterval
    *
    * @param {TimeInterval} interval
    * @description updates each managed chart with new visible time interval
    */


    ChartManager.prototype.updateVisibleTimeInterval = function(interval) {
      var elem, perspective, _ref2, _results;
      _ref2 = this.pool;
      _results = [];
      for (perspective in _ref2) {
        elem = _ref2[perspective];
        _results.push(elem.chart.dataModel.updateVisibleTimeInterval(interval));
      }
      return _results;
    };

    /**
    * @ngdoc method
    * @methodOf wh.timeline.chart.ChartManager
    * @name wh.timeline.chart.ChartManager#suppressRendering
    *
    * @param {boolean} should
    * @description Prevents this ChartManager from rendering
    */


    ChartManager.prototype.suppressRendering = function(should) {
      if (should == null) {
        should = true;
      }
      return this.renderingSuppressed = should;
    };

    /**
    * @ngdoc method
    * @methodOf wh.timeline.chart.ChartManager
    * @name wh.timeline.chart.ChartManager#renderCurrentState
    *
    * @param {boolean} force Should perform rendering even though renderingSurpressed is set to true?
    * @description Computes current set of rendering options, hides inactive charts and renders/updates
    * active charts
    */


    ChartManager.prototype.renderCurrentState = function(force) {
      var activeCharts, elem, perspective, renderOptions, _ref2;
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
      _ref2 = this.pool;
      for (perspective in _ref2) {
        elem = _ref2[perspective];
        if (elem.rendered && __indexOf.call(this.activePerspectives, perspective) < 0) {
          elem.view.unrender($.extend(renderOptions, {
            className: "inactive"
          }));
        }
      }
      return this.doRenderCurrentState(activeCharts.reverse(), renderOptions);
    };

    /**
    * @ngdoc method
    * @methodOf wh.timeline.chart.ChartManager
    * @name wh.timeline.chart.ChartManager#doRenderCurrentState
    *
    * @description Internal method for the sake of overriding by specific implementations
    */


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

  /**
  * @ngdoc service
  * @name wh.timeline.chart.D3ChartManager
  *
  * @description
  * D3.js-based ChartManager implementation
  */


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

    /**
    * @ngdoc method
    * @methodOf wh.timeline.chart.D3ChartManager
    * @name wh.timeline.chart.D3ChartManager#getContainer
    *
    * @return chart container (from current viewModel)
    */


    D3ChartManager.prototype.getContainer = function() {
      return this.viewModel.container;
    };

    D3ChartManager.prototype.refreshPaneDimensions = function() {
      return this.viewModel.refreshDimensions();
    };

    /**
    * @ngdoc method
    * @methodOf wh.timeline.chart.D3ChartManager
    * @name wh.timeline.chart.D3ChartManager#doRenderCurrentState
    *
    * @param {array} activeCharts    list of charts to render
    * @param {object} renderOptions  list of options @see wh.timeline.chart.D3ChartView#prepareChartPane
    * @description Renders/updates current state of this manager. Rendered ChartPane is 2.5 bigger than the Vieport (for smooth scrolling)
    */


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
      this.viewModel.paneLeft = -renderOptions.renderBefore;
      this.viewModel.pane.css('left', this.viewModel.paneLeft);
      this.viewModel.pane.css('width', -this.viewModel.paneLeft * 2.5);
      return this.doRenderAxes(activeCharts, renderOptions);
    };

    /**
    * @ngdoc method
    * @methodOf wh.timeline.chart.D3ChartManager
    * @name wh.timeline.chart.D3ChartManager#doRenderAxes
    *
    * @param {array} activeCharts    list of charts to render
    * @param {object} renderOptions  list of options @see wh.timeline.chart.D3ChartView#prepareChartPane
    * @description Renders/updates axes for current main chart (there is only one "global" X axis and
    * one "global" Y axis - just to be sure that nice transition is possible even when active chart is
    * changed)
    */


    D3ChartManager.prototype.doRenderAxes = function(activeCharts, renderOptions) {
      var aAxisTick, chart, d3cm, mainChart, view;
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
      aAxisTick = function(d) {
        return "translate(" + (view.tickValue(d)) + ", 0)";
      };
      return this.xAxisElem.call(view.xAxis).selectAll('.tick').attr("transform", aAxisTick).each(function(d, i) {
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

/*
//@ sourceMappingURL=wh-timeline-chart.js.map
*/