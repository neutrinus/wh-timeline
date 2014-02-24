
###*
* @ngdoc service
* @name wh.timeline.chart.ChartDataModel
*
* @description
* Stores chart related model data such as visible time perspectiveor binWidth
*
###
class ChartDataModel

    constructor: (perspective, binWidth) ->
        defaults =
            perspective: perspective
            binWidth: binWidth
            visibleTimeInterval: null

            processedRawData: null
            processedStateData: null

            initial:
                visibleTimeInterval: null
        $.extend(@, defaults)

    updateVisibleTimeInterval: (@visibleTimeInterval, forceRefreshInitialWidth=false) ->
        if forceRefreshInitialWidth or not @initial.visibleTimeInterval
            @initial.visibleTimeInterval = @visibleTimeInterval
    updateRaw: (@processedRawData) ->
    updateState: (@processedStateData) ->

###*
* @ngdoc service
* @name wh.timeline.chart.ChartViewModel
*
* @description
* Stores chart related view data such as viewport size or axes containers
*
###
class ChartViewModel

    constructor: (container) ->
        defaults =
            zoom: 1,

            viewport:  container.find('.chart-viewport')
            pane:      container.find('.chart-pane')
            chartsThemselves: container.find('.charts')
            yAxisPane: container.find('.y-axis-pane')
            xAxisPane: container.find('.x-axis-pane')
            container: container

            renderingBufferLeft:  2
            renderingBufferRight: 2

            containerData:
                width:   0,
                height:  0,

            viewportOverlay:
                width:  null,
                height: null,

                visibleWidth: null,
                stepWidth: null          # Immutable

            initial:
                viewportOverlay:
                    visibleWidth: null   # Immutable
        $.extend(@, defaults)

    refreshDimensions: ->
        @refreshContainerDimensions()
        @refreshViewportOverlayDimensions()
        @refreshViewportOverlayVisibleWidth()

    refreshContainerDimensions: ->
        @containerData.width  = @container.width()
        @containerData.height = @chartsThemselves.height()

    refreshViewportOverlayDimensions: ->
        @viewportOverlay.width  = @viewport.width()
        @viewportOverlay.height = @containerData.height

    refreshViewportOverlayVisibleWidth: (forceRefreshInitialWidth=false) ->
        @viewportOverlay.visibleWidth = @containerData.width
        if forceRefreshInitialWidth or not @initial.viewportOverlay.visibleWidth
            @initial.viewportOverlay.visibleWidth = @viewportOverlay.visibleWidth

    getVisibleAreaDeltaRatio: -> @viewportOverlay.visibleWidth / @initial.viewportOverlay.visibleWidth

###*
* @ngdoc service
* @name wh.timeline.chart.Chart
*
* @description
* Chart object, at the moment it's just a wrapper for ChartDataModel
###
class Chart
    constructor: (@dataModel) ->


###*
* @ngdoc object
* @name wh.timeline.chart.ChartView
*
* @description
* Abstract class for a reference of what methods are necessary
###
class ChartView
    render: ->

###*
* @ngdoc object
* @name wh.timeline.chart.D3ChartView
*
* @description
* Abstract ChartView implementation for D3 chart library
###
class D3ChartView extends ChartView

    constructor: (@chart) ->
        @data = null
        @ticksCache = {}

    allXTicks:    ->
        [from, to] = @x.domain()
        ###
        @data[0].date
        to = @data[@data.length-1].date
        ###

        cacheKey = from.getTime()+","+to.getTime()
        if true or not @ticksCache[cacheKey]
            # We need at least one more tick, let's compute a moment that is
            # 1.2 * average interval length
            # in the future (in case of february or so)
            countTo = new Date()
            countTo.setTime(to.getTime()+1.2*(to.getTime()-from.getTime())/@data.length)
            ticksData = @xAxis.ticks()
            @ticksCache[cacheKey] = ticksData[0](from, countTo, 1)
        return @ticksCache[cacheKey]

    ###*
    * @ngdoc method
    * @methodOf wh.timeline.chart.D3ChartView
    * @name wh.timeline.chart.D3ChartView#xToDate
    *
    * @param {integer} x  X coordinate within chart pane
    *
    * @return {date} Date that is currently represented by X coordinate
    ###
    xToDate:          (x)    -> @x.invert(x)

    ###*
    * @ngdoc method
    * @methodOf wh.timeline.chart.D3ChartView
    * @namewh.timeline.chart.D3ChartView#dateToX
    *
    * @param {Date} date  Date to convert
    *
    * @return {integer} X coordinate that is represented by date
    ###
    dateToX:          (date) -> @tickValue(date)

    ###*
    * @ngdoc method
    * @methodOf wh.timeline.chart.D3ChartView
    * @namewh.timeline.chart.D3ChartView#tickValue
    *
    * @param {tick} tick
    *
    * @return {integer} Rounded X coordinate represented by `tick`
    ###
    tickValue:        (tick) -> Math.ceil(@x(tick)-0.00001)

    ###*
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
    ###
    findSurroundingTicks: (date, shift=0) ->
        ticks = @allXTicks()

        millis = date.getTime()
        i = 0
        found = false
        for tick in ticks
            if tick.getTime() >= millis
                found = true
                break
            ++i
        i -= 1 unless found

        return [ticks[i-1+shift], ticks[i+shift]]

    ###*
    * @ngdoc method
    * @methodOf wh.timeline.chart.D3ChartView
    * @name wh.timeline.chart.D3ChartView#prepareData
    * 
    * @description prepares data for internal processing - removes any data bins
    * that wouldn't be rendered anyway - this way huge amounts of data will never
    * cause a bottleneck when rendering
    ###
    prepareData: ->
        @data = []
        renderSinceUnix = @renderOptions.renderSince / 1000
        renderToUnix = @renderOptions.renderTo / 1000
        for bin in @chart.dataModel.processedRawData
            continue if bin.start > renderToUnix or bin.end < renderSinceUnix
            @data.push {
                date:   new Date(bin.start*1000)
                value: bin.value
            }

    ###*
    * @ngdoc method
    * @methodOf wh.timeline.chart.D3ChartView
    * @name wh.timeline.chart.D3ChartView#createXAxis
    * 
    * @description creates X axis object, prepares range and domain,
    * computes custom intervals
    ###
    createXAxis: ->
        @x = d3.time.scale.utc()
        # @x.clamp(true) # breaks our wonderful xTicks function :(
        @x.range([
            0,
            @renderOptions.renderWidth # @renderOptions.viewModel.viewportOverlay.visibleWidth
        ])
        @x.domain([
            @renderOptions.renderSince,
            @renderOptions.renderTo

            #@chart.dataModel.visibleTimeInterval.startDate,
            #@chart.dataModel.visibleTimeInterval.endDate
        ])

        # All of those intervals applies step in an unintuitive way
        # e.g. step=2 with d3.time.days.utc would result in
        # days [29,31,1,3] instead of [29,31,2,4]
        interval = switch @chart.dataModel.perspective
            when "Yearly"    then d3.time.years.utc
            when "Monthly"   then d3.time.months.utc
            when "Weekly"    then d3.time.saturdays.utc
            when "Daily"     then d3.time.days.utc
            when "Hourly"    then d3.time.hours.utc
            when "Minutely"  then d3.time.minutes.utc
            when "Secondely" then d3.time.seconds.utc
            else             throw "Unknown time perspective #{@chart.dataModel.perspective}"

        subInterval = (from, to, step=1) ->
            (e for e in interval(from,to,1) by step)

        tickDensity = @renderOptions.renderWidth / subInterval(@renderOptions.renderSince, @renderOptions.renderTo).length
        step = Math.max(1, Math.ceil(25 / tickDensity + 0.00001)) # 25 pixels per tick

        @xAxis = d3.svg.axis().scale(@x).orient("bottom")
            .ticks(subInterval, step)
            .tickFormat(d3.time.format.utc('%e %B %Y'))

    ###*
    * @ngdoc method
    * @methodOf wh.timeline.chart.D3ChartView
    * @name wh.timeline.chart.D3ChartView#createYAxis
    * 
    * @description creates Y axis object, prepares range and domain
    ###
    createYAxis: ->
        @y = d3.scale.linear().range([@renderOptions.viewModel.viewportOverlay.height, 0])
        @y.domain [0, @renderOptions.yMax]
        @yAxis = d3.svg.axis().scale(@y).orient("left").ticks(2) #, "%")

    ###*
    * @ngdoc method
    * @methodOf wh.timeline.chart.D3ChartView
    * @name wh.timeline.chart.D3ChartView#prepareChartPane
    * 
    * @description prepares/creates chart pane for further rendering
    ###
    prepareChartPane: ->

    setRenderOptions: (@renderOptions={}) ->

    ###*
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
    ###
    render: (renderOptions) ->
        @setRenderOptions(renderOptions)
        @prepareData()
        @createXAxis()
        @createYAxis()
        @prepareChartPane()

        @redraw()
        @$svg.finish().fadeIn(@renderOptions.animDuration)

    ###*
    * @ngdoc method
    * @methodOf wh.timeline.chart.D3ChartView
    * @name wh.timeline.chart.D3ChartView#redraw
    * @description renders/updates chart data only (e.g. bars in case of histogram) -
    * doesn't do anything with axes or anything else
    ###
    redraw: ->

    ###*
    * @ngdoc method
    * @methodOf wh.timeline.chart.D3ChartView
    * @name wh.timeline.chart.D3ChartView#prepareChartPane
    *
    * @param {object} renderOptions rendering options @see wh.timeline.chart.D3ChartView#prepareChartPane
    * @description removes data from this chart, animates bars, hides this chart
    ###
    unrender:  (renderOptions) ->
        @setRenderOptions(renderOptions)
        @data = []
        #@createXAxis()
        #@createYAxis()
        @prepareChartPane()

        @redraw()
        @$svg.finish().fadeOut(@renderOptions.animDuration)

###*
* @ngdoc object
* @name wh.timeline.chart.D3HTMLChartView
*
* @description
* Abstract D3ChartView implementation for HTML charts
###
class D3HTMLChartView extends D3ChartView

    prepareChartPane: ->
        view = @

        unless @svg
            @svg = d3.select(@renderOptions.viewModel.chartsThemselves[0])
            .append("div")
            .attr("width",  @renderOptions.renderWidth/2)
            .attr("height", '100%')
            .append("span")
            .attr("class", "g")
            @$svg = $(@svg[0][0].parentNode)

        @$svg.attr("class", "svg " + @renderOptions.className)


###*
* @ngdoc service
* @name wh.timeline.chart.view.Histogram
*
* @description
* Histogram chart view implementation
###
class HistogramView extends D3HTMLChartView

    redraw: ->
        super()

        view = @
        tv = @tickValue.bind(@)

        calcXFn = (d) ->
            @dataset._calcX = tv(d.date)
            return @dataset._calcX+"px"

        calcWidthFn = (d) ->
            ticks = view.allXTicks()
            calcX = @dataset._calcX

            [prev, next] = view.findSurroundingTicks(d.date, 1)

            @dataset._calcWidth = tv(next) - tv(prev) - 1 # there always is next tick
            return @dataset._calcWidth+"px"

        bar = @svg.selectAll(".bar")
            .data(@data, (d) -> d.date)

        bar.enter()
            .append("div")
            .attr("class", "bar rect")

            .style("left",   calcXFn)
            .style("width",  calcWidthFn)
            .style("top",    view.renderOptions.viewModel.viewportOverlay.height+"px")
            .style("height", 0)

        bar.attr("class", "bar rect update")
            .style("left",   calcXFn)
            .style("width",  calcWidthFn)
            .transition()
            .duration(@renderOptions.animDuration)
                .style("top",    (d) ->
                    @dataset._calcY = Math.ceil(view.y(d.value))
                    return @dataset._calcY+"px"
                )
                .style("height", (d) ->
                    (view.renderOptions.viewModel.viewportOverlay.height - @dataset._calcY)+"px"
                )

        bar.exit()
            .attr("class", "bar rect exit")
            .style("left",   calcXFn)
            .style("width",  calcWidthFn)
            #.style("left",   -> @dataset._calcX)
            #.style("width",  -> @dataset._calcWidth)
            .transition()
            .duration(@renderOptions.animDuration)
                #.style("left",   calcXFn)
                #.style("width",  calcWidthFn)
                .style("top",     view.renderOptions.viewModel.viewportOverlay.height+"px")
                .style("height", "0px")
                .remove()

        ###
        bar.append("text")
           .attr("dy", "1.5em")
           .attr("height", 6)
           .attr("x", -> this.parentNode.calcWidth/2)
           .text((d) -> return d.value.toFixed(2) )
        ###


###*
* @ngdoc object
* @name wh.timeline.chart.ChartManager
*
* @description
* Abstract ChartManager implementation
###
class ChartManager

    constructor: ->
        @beforeRender = $.noop
        @pool = {}
        @activePerspectives = []

        @defaultRenderOptions = {
            yMax: 0
            animDuration: 750
        }

    ###*
    * @ngdoc method
    * @methodOf wh.timeline.chart.ChartManager
    * @name wh.timeline.chart.ChartManager#manageChart
    *
    * @param {Chart} chart          Chart to manage
    * @param {ChartView} viewClass  ChartView class object that should be used to rendered this chart
    *
    * @description
    * Adds chart to pool of charts managed by this manager
    ###
    manageChart: (chart, viewClass) ->
        perspective = chart.dataModel.perspective
        @pool[perspective] = {
            chart: chart,
            view: new viewClass(chart),
            rendered: false
        }

    hasChart:    (perspective) -> perspective of @pool
    getChart:    (perspective) -> @pool[perspective]
    removeChart: (perspective) -> delete @pool[perspective]

    ###*
    * @ngdoc method
    * @methodOf wh.timeline.chart.ChartManager
    * @name wh.timeline.chart.ChartManager#xToDate
    *
    * @param {integer} x  X coordinate within chart pane
    *
    * @return {date} Date that is currently represented by X coordinate
    ###
    xToDate: (x) ->

    ###*
    * @ngdoc method
    * @methodOf wh.timeline.chart.ChartManager
    * @name wh.timeline.chart.ChartManager#dateToX
    *
    * @param {Date} date  Date to convert
    *
    * @return {integer} X coordinate that is represented by date
    ###
    dateToX: (date) ->

    ###*
    * @ngdoc method
    * @methodOf wh.timeline.chart.ChartManager
    * @name wh.timeline.chart.ChartManager#getActiveCharts
    *
    * @return {array} array of active charts, first one is the main one
    ###
    getActiveCharts: ->
        active = []
        for perspective in @activePerspectives
            active.push(@pool[perspective])
        return active

    getMainActiveChart: -> @getActiveCharts().shift()

    ###*
    * @ngdoc method
    * @methodOf wh.timeline.chart.ChartManager
    * @name wh.timeline.chart.ChartManager#setActiveCharts
    *
    * @param {array} perspectives Time perspective names
    *
    * @description Tells this ChartManager about time perspectives that are supposed to be active
    ###
    setActiveCharts: (perspectives) ->
        unless Object::toString.call(perspectives) == '[object Array]'
            perspectives = [perspectives]

        @activePerspectives = perspectives

    ###*
    * @ngdoc method
    * @methodOf wh.timeline.chart.ChartManager
    * @name wh.timeline.chart.ChartManager#computeRenderOptions
    *
    * @param {array} charts Charts to compute options for
    * @return computed rendered options
    ###
    computeRenderOptions: (charts) ->
        options = $.extend({}, @defaultRenderOptions)

        for elem in charts
            for chunk in elem.chart.dataModel.processedRawData
                options.yMax = Math.max(options.yMax, chunk.value)

        options.yMax = Math.ceil(options.yMax)
        options.viewModel = @viewModel

        visibleInterval = @getMainActiveChart().chart.dataModel.visibleTimeInterval # @TXC initial.visibleTimeInterval
        milliseconds = visibleInterval.milliseconds()

        options.renderWidth  = @viewModel.viewportOverlay.width * @viewModel.renderingBufferLeft \
                             + @viewModel.viewportOverlay.width * @viewModel.renderingBufferRight \
                             + @viewModel.viewportOverlay.width
        options.renderBefore = @viewModel.viewportOverlay.width * @viewModel.renderingBufferLeft
        options.renderAfter  = @viewModel.viewportOverlay.width * @viewModel.renderingBufferRight
        options.renderSince  = new Date(visibleInterval.start - milliseconds * @viewModel.renderingBufferLeft)
        options.renderTo     = new Date(visibleInterval.end   + milliseconds * @viewModel.renderingBufferRight)
        
        return options

    ###*
    * @ngdoc method
    * @methodOf wh.timeline.chart.ChartManager
    * @name wh.timeline.chart.ChartManager#updateVisibleTimeInterval
    *
    * @param {TimeInterval} interval
    * @description updates each managed chart with new visible time interval
    ###
    updateVisibleTimeInterval: (interval) ->
        for perspective, elem of @pool
            elem.chart.dataModel.updateVisibleTimeInterval(interval)

    ###*
    * @ngdoc method
    * @methodOf wh.timeline.chart.ChartManager
    * @name wh.timeline.chart.ChartManager#suppressRendering
    *
    * @param {boolean} should
    * @description Prevents this ChartManager from rendering
    ###
    suppressRendering: (should=true) ->
        @renderingSuppressed = should

    ###*
    * @ngdoc method
    * @methodOf wh.timeline.chart.ChartManager
    * @name wh.timeline.chart.ChartManager#renderCurrentState
    *
    * @param {boolean} force Should perform rendering even though renderingSurpressed is set to true?
    * @description Computes current set of rendering options, hides inactive charts and renders/updates
    * active charts
    ###
    renderCurrentState: (force=false) ->
        return if @renderingSuppressed and not force

        activeCharts = @getActiveCharts()
        return unless activeCharts.length

        @beforeRender()
        renderOptions = @computeRenderOptions(activeCharts)

        for perspective, elem of @pool
            if elem.rendered and perspective not in @activePerspectives
                elem.view.unrender($.extend(renderOptions, {
                    className: "inactive"
                }))

        @doRenderCurrentState(activeCharts.reverse(), renderOptions)

    ###*
    * @ngdoc method
    * @methodOf wh.timeline.chart.ChartManager
    * @name wh.timeline.chart.ChartManager#doRenderCurrentState
    *
    * @description Internal method for the sake of overriding by specific implementations
    ###
    doRenderCurrentState: (activeCharts, renderOptions) ->
        for elem in activeCharts
            elem.view.render(renderOptions)
            elem.rendered = true

###*
* @ngdoc service
* @name wh.timeline.chart.D3ChartManager
*
* @description
* D3.js-based ChartManager implementation
###
class D3ChartManager extends ChartManager

    constructor: (@viewModel) ->
        @viewModel.refreshDimensions()
        @svg = null
        super()

    xToDate: (x)    -> @getMainActiveChart().view.xToDate(x)
    dateToX: (date) -> @getMainActiveChart().view.dateToX(date)

    ###*
    * @ngdoc method
    * @methodOf wh.timeline.chart.D3ChartManager
    * @name wh.timeline.chart.D3ChartManager#getContainer
    *
    * @return chart container (from current viewModel)
    ###
    getContainer: -> @viewModel.container

    refreshPaneDimensions: ->
        @viewModel.refreshDimensions()

    ###*
    * @ngdoc method
    * @methodOf wh.timeline.chart.D3ChartManager
    * @name wh.timeline.chart.D3ChartManager#doRenderCurrentState
    *
    * @param {array} activeCharts    list of charts to render
    * @param {object} renderOptions  list of options @see wh.timeline.chart.D3ChartView#prepareChartPane
    * @description Renders/updates current state of this manager. Rendered ChartPane is 2.5 bigger than the Vieport (for smooth scrolling)
    ###
    doRenderCurrentState: (activeCharts, renderOptions) ->
        mainIdx = activeCharts.length-1
        i = 0
        for elem in activeCharts
            elem.view.render($.extend(renderOptions,  {
                className:  "active #{if i == mainIdx then "main" else "secondary"}"
            }))
            elem.rendered = true
            i++

        @viewModel.paneLeft = -renderOptions.renderBefore
        @viewModel.pane.css('left',   @viewModel.paneLeft)
        @viewModel.pane.css('width', -@viewModel.paneLeft*2.5)

        @doRenderAxes(activeCharts, renderOptions)

    ###*
    * @ngdoc method
    * @methodOf wh.timeline.chart.D3ChartManager
    * @name wh.timeline.chart.D3ChartManager#doRenderAxes
    *
    * @param {array} activeCharts    list of charts to render
    * @param {object} renderOptions  list of options @see wh.timeline.chart.D3ChartView#prepareChartPane
    * @description Renders/updates axes for current main chart (there is only one "global" X axis and
    * one "global" Y axis - just to be sure that nice transition is possible even when active chart is
    * changed)
    ###
    doRenderAxes: (activeCharts, renderOptions) ->
        mainChart = @getMainActiveChart()
        view = mainChart.view
        chart = mainChart.chart
        d3cm = @

        # Axes panes
        unless @xAxisSvg
            @xAxisSvg = d3.select(@viewModel.xAxisPane[0])
                .append("svg")
                .attr("width",  renderOptions.renderWidth)
                .attr("height", '100%')
                .append("g")

            @yAxisSvg = d3.select(@viewModel.yAxisPane[0])
                .append("svg")
                .attr("width",  '26')
                .attr("height", '100%')
                .append("g")

            # X-axis
            @xAxisElem = @xAxisSvg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0, 0)")

            @yAxisElem = @yAxisSvg.append("g")
                .attr("class", "y axis")
                .attr("transform", "translate(25, 0)")

        # Axes elements

        @yAxisElem
            .transition()
            .duration(renderOptions.animDuration)
            .call(view.yAxis)

        aAxisTick = (d) -> "translate(" + (view.tickValue(d)) + ", 0)"

        @xAxisElem
            #.transition()
            #.duration(renderOptions.animDuration)
            .call(view.xAxis)

            # Label
            .selectAll('.tick')
            .attr("transform", aAxisTick)
            .each((d, i) ->
                d3.select(this)
                .selectAll('text')
                .style("text-anchor", "start")
                .attr("transform", "rotate(45)")
                .attr("dy", "0.3em")
                .attr("dx", "0.6em")
            )


angular
    .module('wh.timeline')
    .factory('wh.timeline.chart.ChartDataModel', -> ChartDataModel)
    .factory('wh.timeline.chart.ChartViewModel', -> ChartViewModel)
    .factory('wh.timeline.chart.Chart',          -> Chart)
    .factory('wh.timeline.chart.D3ChartManager', -> D3ChartManager)
    .factory('wh.timeline.chart.view.Histogram', -> HistogramView)

