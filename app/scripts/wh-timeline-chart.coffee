# Just a mock class for a reference of what methods are necessary
class StateRenderer
    setup: (@manager) ->
    render: ->

class SimpleStateRenderer extends StateRenderer
    render: ->

class ChartDataModel

    constructor: (perspective, binWidth) ->
        defaults =
            perspective: perspective        # Immutable
            binWidth: binWidth              # Immutable
            visibleTimeInterval: null       # Mutable

            processedRawData: null          # Mutable
            processedStateData: null        # Mutable

            initial:
                visibleTimeInterval: null   # Immutable
        $.extend(@, defaults)

    updateVisibleTimeInterval: (@visibleTimeInterval, forceRefreshInitialWidth=false) ->
        if forceRefreshInitialWidth or not @initial.visibleTimeInterval
            @initial.visibleTimeInterval = @visibleTimeInterval
    updateRaw: (@processedRawData) ->
    updateState: (@processedStateData) ->


class ChartViewModel

    constructor: (container) ->
        defaults =
            zoom: 1,

            chartPane: container.find('.chart-pane')
            viewport:  container.find('.chart-viewport')
            chartsThemselves: container.find('.charts-themselves')
            yAxisPane: container.find('.y-axis-pane')
            xAxisPane: container.find('.x-axis-pane')
            container: container

            renderingBufferLeft:  2
            renderingBufferRight: 2

            containerData:
                width:   0,
                height:  0,

            dataArea:
                width:  null,
                height: null,

                visibleWidth: null,
                stepWidth: null          # Immutable

            initial:
                dataArea:
                    visibleWidth: null   # Immutable
        $.extend(@, defaults)

    refreshDimensions: ->
        @refreshContainerDimensions()
        @refreshDataAreaDimensions()
        @refreshDataAreaVisibleWidth()

    refreshContainerDimensions: ->
        @containerData.width  = @container.width()
        @containerData.height = @chartsThemselves.height()

    refreshDataAreaDimensions: ->
        @dataArea.width  = @chartPane.width()
        @dataArea.height = @containerData.height

    refreshDataAreaVisibleWidth: (forceRefreshInitialWidth=false) ->
        @dataArea.visibleWidth = @containerData.width
        if forceRefreshInitialWidth or not @initial.dataArea.visibleWidth
            @initial.dataArea.visibleWidth = @dataArea.visibleWidth

    getVisibleAreaDeltaRatio: -> @dataArea.visibleWidth / @initial.dataArea.visibleWidth

class Chart
    constructor: (@dataModel) ->

# Just a mock class for a reference of what methods are necessary
class ChartView
    render: ->

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
            # @TODO: bug, @data may be empty etc
            countTo = new Date()
            countTo.setTime(to.getTime()+1.2*(to.getTime()-from.getTime())/@data.length)
            ticksData = @xAxis.ticks()
            @ticksCache[cacheKey] = ticksData[0](from, countTo, 1)
        return @ticksCache[cacheKey]

    xToDate:          (x)    -> @x.invert(x)
    dateToX:          (date) -> @tickValue(date)
    tickValue:        (tick) -> Math.ceil(@x(tick)-0.00001)
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

    createXAxis: ->
        @x = d3.time.scale.utc()
        # @x.clamp(true) # breaks our wonderful xTicks function :(
        @x.range([
            0,
            @renderOptions.renderWidth # @renderOptions.viewModel.dataArea.visibleWidth
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


    createYAxis: ->
        @y = d3.scale.linear().range([@renderOptions.viewModel.dataArea.height, 0])
        @y.domain [0, @renderOptions.yMax]
        @yAxis = d3.svg.axis().scale(@y).orient("left").ticks(2) #, "%")

    processSkeleton: ->

    setRenderOptions: (@renderOptions={}) ->

    render: (renderOptions) ->
        @setRenderOptions(renderOptions)
        @prepareData()
        @createXAxis()
        @createYAxis()
        @processSkeleton()

        @redraw()
        @$svg.finish().fadeIn(@renderOptions.animDuration)

    redraw: ->

    unrender:  (renderOptions) ->
        @setRenderOptions(renderOptions)
        @data = []
        #@createXAxis()
        #@createYAxis()
        @processSkeleton()

        @redraw()
        @$svg.finish().fadeOut(@renderOptions.animDuration)

class D3HTMLChartView extends D3ChartView

    processSkeleton: ->
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

        # Y-axis label
        ###
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Frequency")
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
            .style("top",    view.renderOptions.viewModel.dataArea.height+"px")
            .style("height", 0)

        bar.attr("class", "bar rect update")
            .style("left",   calcXFn)      # @TODO: add that to transition
            .style("width",  calcWidthFn)
            .transition()
            .duration(@renderOptions.animDuration)
                .style("top",    (d) ->
                    @dataset._calcY = Math.ceil(view.y(d.value))
                    return @dataset._calcY+"px"
                )
                .style("height", (d) ->
                    (view.renderOptions.viewModel.dataArea.height - @dataset._calcY)+"px"
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
                .style("top",     view.renderOptions.viewModel.dataArea.height+"px")
                .style("height", "0px")
                .remove();

        ###
        bar.append("text")
           .attr("dy", "1.5em")
           .attr("height", 6)
           .attr("x", -> this.parentNode.calcWidth/2)
           .text((d) -> return d.value.toFixed(2) )
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

    manageChart: (chart, viewType) ->
        perspective = chart.dataModel.perspective
        @pool[perspective] = {
            chart: chart,
            view: new viewType(chart),
            rendered: false
        }

    hasChart:    (perspective) -> perspective of @pool
    getChart:    (perspective) -> @pool[perspective]
    removeChart: (perspective) -> delete @pool[perspective]

    xToDate: (x) ->
    dateToX: (date) ->

    getActiveCharts: ->
        active = []
        for perspective in @activePerspectives
            active.push(@pool[perspective])
        return active

    getMainActiveChart: -> @getActiveCharts().shift()

    setActiveCharts: (perspectives) ->
        unless Object::toString.call(perspectives) == '[object Array]'
            perspectives = [perspectives]

        @activePerspectives = perspectives

    computeRenderOptions: (charts) ->
        options = $.extend({}, @defaultRenderOptions)

        for elem in charts
            for chunk in elem.chart.dataModel.processedRawData
                options.yMax = Math.max(options.yMax, chunk.value)

        options.yMax = Math.ceil(options.yMax)
        options.viewModel = @viewModel

        visibleInterval = @getMainActiveChart().chart.dataModel.visibleTimeInterval # @TXC initial.visibleTimeInterval
        milliseconds = visibleInterval.milliseconds()

        options.renderWidth  = @viewModel.dataArea.width * @viewModel.renderingBufferLeft \
                             + @viewModel.dataArea.width * @viewModel.renderingBufferRight \
                             + @viewModel.dataArea.width
        options.renderBefore = @viewModel.dataArea.width * @viewModel.renderingBufferLeft
        options.renderAfter  = @viewModel.dataArea.width * @viewModel.renderingBufferRight
        options.renderSince  = new Date(visibleInterval.start - milliseconds * @viewModel.renderingBufferLeft)
        options.renderTo     = new Date(visibleInterval.end   + milliseconds * @viewModel.renderingBufferRight)
        
        return options

    updateVisibleTimeInterval: (interval) ->
        for perspective, elem of @pool
            elem.chart.dataModel.updateVisibleTimeInterval(interval)

    suppressRendering: (should=true) ->
        @renderingSuppressed = should

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


    doRenderCurrentState: (activeCharts, renderOptions) ->
        for elem in activeCharts
            elem.view.render(renderOptions)
            elem.rendered = true

class D3ChartManager extends ChartManager

    constructor: (@viewModel) ->
        @viewModel.refreshDimensions()
        @svg = null
        super()

    xToDate: (x)    -> @getMainActiveChart().view.xToDate(x)
    dateToX: (date) -> @getMainActiveChart().view.dateToX(date)

    getContainer: -> @viewModel.container

    refreshPaneDimensions: ->
        @viewModel.refreshDimensions()

    doRenderCurrentState: (activeCharts, renderOptions) ->
        mainIdx = activeCharts.length-1
        i = 0
        for elem in activeCharts
            elem.view.render($.extend(renderOptions,  {
                className:  "active #{if i == mainIdx then "main" else "secondary"}"
            }))
            elem.rendered = true
            i++

        # @TODO: Refactor out
        #if not @viewModel.viewportLeft
        @viewModel.viewportLeft = -renderOptions.renderBefore
        @viewModel.viewport.css('left', @viewModel.viewportLeft) # @TXC comment this line

        @doRenderAxes(activeCharts, renderOptions)

    doRenderAxes: (activeCharts, renderOptions) ->
        mainChart = @getMainActiveChart()
        view = mainChart.view
        chart = mainChart.chart
        d3cm = @

        # y-axis-pane
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

