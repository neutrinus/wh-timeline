
'use strict'

# Private function - converts date to unix timestamp
getUnix = (date=new Date())-> Math.floor(date.getTime()/1000+0.0000001)

# Private function for handy object comprehension
to_hash = (pairs) ->
    hash = {}
    hash[key] = value for [key, value] in pairs
    hash

angular
    .module('wh.timeline', ['ui.date','ui.bootstrap.timepicker'])

###*
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
###
angular.module('wh.timeline')
    .service('wh.timeline.utils.configIsolator', ->
        def = {}
        ###*
        * @ngdoc method
        * @methodOf wh.timeline.utils.configIsolator
        * @name     wh.timeline.utils.configIsolator#isolate
        * @param {object}  Complete Full configuration to process
        * @param {array}   Properties Object keys to extract
        * @description     Extracts given properties from object
        * @return {object} Extracted properties
        * @example
        <example></example>
        ###
        def.isolate = (complete, properties) ->
            viewValue = {}
            for p in properties
                viewValue[p] = complete[p]
            return viewValue

        ###*
        * @ngdoc method
        * @methodOf wh.timeline.utils.configIsolator
        * @name     wh.timeline.utils.configIsolator#merge
        * @param {object}  complete Full configuration
        * @param {array}   isolated Processed isolated object
        * @description     Merges processed properties back to the object
        * @return {object} Merged properties
        * @example
        <example></example>
        ###
        def.merge = (complete, isolated) ->
            modelValue = {}
            for k,v of isolated
                if k of complete
                    modelValue[k] = v

            for k,v of complete
                unless k of modelValue
                    modelValue[k] = v

            return modelValue

        return def
    )

###*
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
###
angular.module('wh.timeline')
       .directive('whTimeline', [
        'wh.timeline.chart.Chart',
        'wh.timeline.chart.ChartDataModel',
        'wh.timeline.chart.ChartViewModel',
        'wh.timeline.chart.D3ChartManager',
        'wh.timeline.chart.view.Histogram',
        'wh.timeline.utils.TimeInterval',
        'wh.timeline.utils.configIsolator',
        '$timeout',
        '$interval',
        '$q',
        '$window',
        '$templateCache',
        ((Chart, ChartDataModel, ChartViewModel, D3ChartManager, HistogramView, TimeInterval,
          configIsolator, $timeout, $interval, $q, $window, $templateCache) ->
            chartManagerDeferred = $q.defer()
            return {
                restrict: 'E'
                require: ['ngModel', 'whTimeline']
                replace: true
                scope: {
                    ngModel: '='
                }
                template: $templateCache.get('templates/wh-timeline.html')
                link: (scope, element, attrs, controllers) ->

                    [ngModel, whTimeline] = controllers

                    # General information {{{
                    window.scope = scope
                    scope.adjustingSelection = false
                    scope.visibleTimePerspectives = null;

                    scope.getVisibleTimeInterval = ->
                        return new TimeInterval(scope.ngModel.visible_start, scope.ngModel.visible_end, true)

                    # }}}

                    # -------------------------

                    # Helper function
                    findDataForTimePerspective = (perspective, dataType) ->
                        for chunk in ngModel.$modelValue.data
                            if chunk.name == perspective
                                return chunk[dataType]

                    # -------------------------

                    # Updates the visible time perspective and redraws chart
                    scope.setTimePerspectives = (newTimePerspectives) ->
                        return if angular.equals newTimePerspectives, scope.visibleTimePerspectives

                        readyForRendering = true
                        scope.visibleTimePerspectives = newTimePerspectives
                        for perspective in scope.visibleTimePerspectives
                            elem = chartManager.getChart(perspective)
                            if elem
                                chart = elem.chart
                                dataModel = chart.dataModel
                            else
                                binWidth = 0
                                dataModel = new ChartDataModel(perspective, findDataForTimePerspective(perspective, 'bin_width'))

                                chart = new Chart(dataModel)
                                chartManager.manageChart(chart, HistogramView)
                            dataModel.updateRaw(findDataForTimePerspective(perspective, 'raw'))
                            dataModel.updateState(findDataForTimePerspective(perspective, 'state'))

                        chartManager.updateVisibleTimeInterval(scope.getVisibleTimeInterval())
                        chartManager.setActiveCharts(scope.visibleTimePerspectives)

                        whTimeline.render()

                    # --------------------------
                    # --------- CHART ----------
                    # --------------------------

                    scope.chartManager = chartManager = new D3ChartManager(new ChartViewModel(element.find('.wh-timeline-widget .chart-component')))

                    # We need to recalculate visible time interval before rendering the chart
                    chartManager.beforeRender = -> scope.$apply() if not scope.$$phase and not scope.$root.$$phase

                    # Once chartManager is ready, we may resolve the promise
                    chartManagerDeferred.resolve(chartManager)

                    # Whenever window is resized we need to adjust pane
                    angular.element($window).bind('resize', =>
                        chartManager.refreshPaneDimensions()
                        scope.$apply()
                    )

                    # Whenever epoch_state or raw_state changes (or sum of all of them),
                    # we need to update raw and state data
                    scope.$watch((
                        -> (elem.epoch_state+elem.epoch_raw for elem in ngModel.$modelValue.data).reduce (t,s) -> t+s
                    ), ((current, previous) ->
                        return if current == previous

                        for elem in chartManager.getActiveCharts()
                            dataModel = elem.chart.dataModel
                            dataModel.updateRaw(findDataForTimePerspective(dataModel.perspective, 'raw'))
                            dataModel.updateState(findDataForTimePerspective(dataModel.perspective, 'state'))

                        whTimeline.render()
                    ), true)

                    # Whenever visible bounds are updated, we need to update the view
                    scope.$watchCollection('[ngModel.visible_start, ngModel.visible_end]', ( ->
                        chartManager.updateVisibleTimeInterval(scope.getVisibleTimeInterval())
                        whTimeline.render()
                    ))

                    # Whenever selected bounds are updated, let's merge the change to the current model
                    scope.$watch((-> configIsolator.isolate(scope.ngModel, ['selected_start','selected_end'])), ((newV, oldV) ->
                        return if newV == oldV
                        if scope.selectionModifiedByUser
                            scope.selectionModifiedByUser = false
                            return
                        scope.ngModel = configIsolator.merge(scope.ngModel, newV)
                    ), true)

                    # Processing state data (colors in background):
                    scope.states = []
                    scope.updateStateData = ->
                        main = chartManager.getMainActiveChart()
                        scope.states = []
                        for state in main.chart.dataModel.processedStateData
                            left = chartManager.dateToX(new Date(state.start*1000))
                            right = chartManager.dateToX(new Date(state.end*1000))
                            scope.states.push {
                                left:  left
                                width: right - left
                                state: state.state
                            }
                        return scope.states

                    # SelectionConfig pane hiding (in case user clicked outside of it)
                    $(document).on('click', (e) =>
                        $target = $(e.target)
                        if $target.closest(element).length == 0 && $target.closest('.wh-timeline-config').length == 0 \
                        and $target.closest('.ui-datepicker-header').length == 0
                            scope.adjustingSelection = false
                            scope.$digest()
                        return true
                    )
                    return 1

                controller: ($scope, $element, $attrs) ->
                    @getChartManager = -> $scope.chartManager

                    @chartManagerPromise = -> chartManagerDeferred.promise
                    @setActiveTimePerspective = (newActive) ->
                        visible = [newActive]

                        binPerspectiveData = @getSortedPerspectiveDetails()
                        length = binPerspectiveData.length
                        for idx in [length-1..0] by -1
                            if binPerspectiveData[idx].name == newActive
                                if idx < length
                                    visible.push binPerspectiveData[idx-1].name
                                break

                        $scope.setTimePerspectives visible

                    @setVisibleTimePerspectives = (visible) -> $scope.setTimePerspectives visible
                    @getVisibleTimePerspectives = -> $scope.visibleTimePerspectives
                    @getData = -> $scope.ngModel.data
                    @getSortedPerspectiveDetails = ->
                        binPerspectiveData = ({
                            bin_width: item.bin_width,
                            name:      item.name,
                            active:    item.active
                        } for item in $scope.ngModel.data)
                        binPerspectiveData.sort (e1,e2) -> e1.bin_width < e2.bin_width
                        return binPerspectiveData

                    @setSelectionModifiedByUser = -> scope.selectionModifiedByUser = true
                    @isSelectionModifiedByUser = -> scope.selectionModifiedByUser
                    @updateStateData = -> $scope.updateStateData()

                    @render = (force=false) ->
                        @getChartManager().renderCurrentState(force)
                        $scope.updateStateData()
                    return @
            }
        )
    ])

###*
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
###
angular.module('wh.timeline')
       .directive('whTimelinePerspectivePicker',
        ['$templateCache', 'wh.timeline.utils.configIsolator', ($templateCache, configIsolator) -> {
            restrict: 'E'
            replace: true
            require: ['ngModel', '^whTimeline']
            scope: {
                ngModel:        '=',
                onZoomRejected: '&'
            }
            template: $templateCache.get('templates/wh-timeline-perspective-picker.html')
            link: (scope, element, attrs, controllers) ->
                [ngModel, whTimeline] = controllers

                # Formatting model updates
                ngModel.$formatters.unshift (modelValue) ->
                    viewValue = configIsolator.isolate(modelValue, ['is_period', 'selected_start', 'selected_end', 'visible_start', 'visible_end', 'is_end_tracked', 'is_start_tracked', ])

                    binPerspectiveData = whTimeline.getSortedPerspectiveDetails()

                    previouslyActive = scope.active
                    activeEntries = (chunk.name for chunk in binPerspectiveData when chunk.active).reverse()

                    scope.active = activeEntries[0]
                    if previouslyActive != scope.active
                        whTimeline.setVisibleTimePerspectives activeEntries

                    scope.available = (chunk.name for chunk in binPerspectiveData)
                    scope.binWidths = to_hash([chunk.name, chunk.bin_width] for chunk in binPerspectiveData)

                    return viewValue

                # Formatting view updates
                ngModel.$parsers.push (viewValue) ->
                    modelValue = configIsolator.merge(scope.ngModel, viewValue)

                    for chunk in modelValue.data
                        chunk.active = chunk.name in scope.visible

                    return modelValue

                scope.active = null
                scope.visible = null
                scope.available = null
                scope.binWidths = null

                # Switching the time perspective
                scope.switch = (how) ->
                    switch how
                        when '+',  1, true  then deltaIdx =  1
                        when '/',  0        then deltaIdx =  0
                        when '-', -1, false then deltaIdx = -1

                    currentIdx = scope.available.indexOf(scope.active)
                    return if currentIdx == -1

                    newIdx = currentIdx + deltaIdx
                    return unless newIdx of scope.available

                    newActive = scope.available[newIdx]

                    visibleSeconds = ngModel.$viewValue.visible_end - ngModel.$viewValue.visible_start
                    selectedSeconds = ngModel.$viewValue.selected_end - ngModel.$viewValue.selected_start
                    binWidthRatio = scope.binWidths[newActive] / scope.binWidths[scope.active]
                    binWidthRatio = Math.max(1, binWidthRatio) - Math.min(1, binWidthRatio)

                    factor = if deltaIdx > 0 then 1 else -1
                    deltaVisible = Math.ceil(binWidthRatio*visibleSeconds/2) * factor

                    projectedStart = ngModel.$viewValue.selected_start + selectedSeconds / 2 - visibleSeconds / 2
                    projectedEnd   = projectedStart + visibleSeconds

                    projectedStart += deltaVisible
                    projectedEnd  -= deltaVisible

                    # Don't zoom if that would change the selected area
                    unless projectedStart <= ngModel.$viewValue.selected_start <= ngModel.$viewValue.selected_end <= projectedEnd
                        scope.onZoomRejected()
                        return

                    scope.active  = newActive
                    scope.visible = [newActive]

                    if newIdx - 1 of scope.available
                        scope.visible.push(scope.available[newIdx-1])

                    ngModel.$viewValue.visible_start = projectedStart
                    ngModel.$viewValue.visible_end   = projectedEnd

                    if ngModel.$viewValue.selected_start > ngModel.$viewValue.selected_end
                        ngModel.$viewValue.selected_start = ngModel.$viewValue.selected_end

                    ngModel.$setViewValue ngModel.$viewValue

                    whTimeline.setVisibleTimePerspectives scope.visible

                # Let's switch the time perspective on scroll
                element.closest('.wh-timeline').find('.chart-data-overlay').bind('mousewheel', (e) ->
                    e.preventDefault()
                    scope.switch(e.deltaY > 0)
                    scope.$apply() if not scope.$$phase and not scope.$root.$$phase
                )
        }]
    )

###*
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
###
angular.module('wh.timeline')
       .directive('whTimelineSelectionConfig', [
        '$timeout', '$templateCache', 'wh.timeline.utils.configIsolator',
        (($timeout, $templateCache, configIsolator) ->
            return {
                restrict: 'E'
                replace: true
                require: ['ngModel', '^whTimeline']
                scope: {
                    ngModel:  '='

                    selectedStart:  '=',
                    selectedEnd:    '=',

                    isStartTracked: '=',
                    isEndTracked:   '=',

                    visibleStart:   '=',
                    visibleEnd:     '=',
                }
                template: $templateCache.get('templates/wh-timeline-selection-config.html')
                link: (scope, element, attrs, controllers) ->
                    [ngModel, whTimeline] = controllers

                    # Calendars {{{
                    scope.start = null
                    scope.end = null

                    # If internal selected dates are modified, let's update view value accordingly
                    scope.$watch('[start, end]', ((timestamps, oldTimestamps) ->
                        return if timestamps == oldTimestamps
                        return if timestamps[0] == ngModel.$modelValue.selected_start and timestamps[1] == ngModel.$modelValue.selected_end
                        ngModel.$viewValue.selected_start = timestamps[0]
                        ngModel.$viewValue.selected_end   = timestamps[1]
                        ngModel.$setViewValue ngModel.$viewValue
                    ), true)

                    # If model tracking values are modified, let's update view value accordingly
                    scope.$watch('[ngModel.is_start_tracked, ngModel.is_end_tracked]', ((newV, oldV) ->
                        if scope.ngModel.is_start_tracked and not scope.ngModel.is_end_tracked
                            [scope.ngModel.is_start_tracked, scope.ngModel.is_end_tracked] = oldV

                        ngModel.$viewValue.is_start_tracked = scope.ngModel.is_start_tracked
                        ngModel.$viewValue.is_end_tracked   = scope.ngModel.is_end_tracked
                        ngModel.$setViewValue ngModel.$viewValue
                    ), true)

                    # Process model changes and extract necessary data
                    ngModel.$formatters.push (modelValue) ->
                        scope.start = modelValue.selected_start
                        scope.end   = modelValue.selected_end
                        return configIsolator.isolate(modelValue, ['is_period', 'selected_start', 'selected_end', 'visible_start', 'visible_end', 'is_end_tracked', 'is_start_tracked', ])

                    # Process and parse view changes
                    ngModel.$parsers.push (viewValue) ->
                        unless viewValue.is_period
                            viewValue.selected_end = viewValue.selected_start

                        # Enlarge visible area of needed {{{
                        visibleSeconds = viewValue.visible_end - viewValue.visible_start

                        tooLittleVisible = not (viewValue.visible_start <= viewValue.selected_start <= viewValue.selected_end <= viewValue.visible_end)

                        if tooLittleVisible
                            if viewValue.visible_start > viewValue.selected_start
                                viewValue.visible_start = viewValue.selected_start

                            if viewValue.visible_end < viewValue.selected_end
                                viewValue.visible_end = viewValue.selected_end

                            viewValue.visible_start = Math.min(viewValue.selected_start, viewValue.visible_end   - visibleSeconds)
                            viewValue.visible_end   = Math.max(viewValue.selected_end,   viewValue.visible_start + visibleSeconds)
                        # }}}

                        # Change the time perspective too much bins would be visible after adjusting the selection {{{
                        visibleSeconds = viewValue.visible_end - viewValue.visible_start

                        visibleArea = whTimeline.getChartManager().viewModel.viewportOverlay.width
                        calcBinWidth = (binWidth) ->
                            binWidthRatio = visibleSeconds / binWidth
                            return visibleArea / binWidthRatio

                        binWidthPx = calcBinWidth(whTimeline.getChartManager().getMainActiveChart().chart.dataModel.binWidth)

                        if binWidthPx < 10
                            binPerspectiveData = whTimeline.getSortedPerspectiveDetails()
                            for i in [binPerspectiveData.length - 1..0] by -1
                                chunk = binPerspectiveData[i]
                                binWidthPx = calcBinWidth(chunk.bin_width)
                                if binWidthPx >= 10
                                    break

                            whTimeline.setActiveTimePerspective chunk.name
                            visible = whTimeline.getVisibleTimePerspectives()
                            for chunk in ngModel.$modelValue.data
                                chunk.active = chunk.name in visible

                        # }}}

                        scope.start = viewValue.selected_start
                        scope.end   = viewValue.selected_end

                        whTimeline.setSelectionModifiedByUser()

                        return configIsolator.merge(scope.ngModel, viewValue)
                    # }}}

                    # Predefined choices {{{
                    scope.predefinedChoice = null

                    # When new predefinedChoice is selected, let's update all dates accordingly
                    scope.$watch('predefinedChoice', (newChoice) ->
                        return unless newChoice

                        whTimeline.setSelectionModifiedByUser()

                        ngModel.$viewValue.selected_start = newChoice.start
                        ngModel.$viewValue.selected_end   = newChoice.end

                        ngModel.$viewValue.is_start_tracked = newChoice.start_tracked
                        ngModel.$viewValue.is_end_tracked   = newChoice.end_tracked

                        # shrink visible area of needed {{{
                        visibleSeconds  = ngModel.$viewValue.visible_end  - ngModel.$viewValue.visible_start
                        selectedSeconds = ngModel.$viewValue.selected_end - ngModel.$viewValue.selected_start

                        tooMuchVisible = visibleSeconds > selectedSeconds * 20

                        if tooMuchVisible
                            newPadding = selectedSeconds * 20 / 3
                            ngModel.$viewValue.visible_start = ngModel.$viewValue.selected_start - newPadding
                            ngModel.$viewValue.visible_end   = ngModel.$viewValue.selected_end   + newPadding

                        ngModel.$setViewValue ngModel.$viewValue

                        scope.predefinedChoice = null
                        # }}}
                    )
                    # }}}
            }
        )
    ])

###*
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
###
angular.module('wh.timeline')
       .directive('whTimelineSelections', [
        '$timeout',
        '$interval',
        '$templateCache',
        'wh.timeline.selection.plugin.ChartPanePlugin',
        'wh.timeline.selection.plugin.StickySelectionPlugin',
        'wh.timeline.selection.SelectionAreaManager',
        'wh.timeline.selection.strategy.SingleSelectionAreaManagementStrategy',
        'wh.timeline.selection.nodeResolver.SingleSelectionAreaNodeResolver',
        'wh.timeline.selection.SelectionArea',
        'wh.timeline.utils.configIsolator',
        (($timeout, $interval, $templateCache, ChartPanePlugin, StickySelectionPlugin,
          SelectionAreaManager, SingleSelectionAreaManagementStrategy, SingleSelectionAreaNodeResolver,
          SelectionArea, configIsolator) ->
            return {
                restrict: 'E'
                require:  ['ngModel', '^whTimeline']
                replace: true
                scope: {
                    ngModel: '='
                    adjustingSelection: '='
                }
                template: $templateCache.get('templates/wh-timeline-selections.html')
                link: (scope, element, attrs, controllers) ->
                    [ngModel, whTimeline] = controllers

                    selectionPane = element
                    selectionElement = -> element.find('.selection-area')

                    # Control visibility of selection adjustment configuration  {{{
                    oldSelection = null;
                    element.on('mousedown', '.selection-area', =>
                        oldSelection = $.extend(true, {}, scope.selectionManager.selections[0])
                        return true
                    )

                    element.on('mouseup', '.selection-area', =>
                        if oldSelection and oldSelection.equals(scope.selectionManager.selections[0]) and scope.selectionManager.selections[0].overflow == 0
                            scope.adjustingSelection = !scope.adjustingSelection
                            scope.$apply()
                        return true
                    )
                    # }}}

                    # -------------------------

                    # Helper function that updates selection's X and width accordingly to dates specified in viewValue
                    recalculateSelectionView = (viewValue) ->
                        selectionLeft = whTimeline.getChartManager().dateToX(new Date(viewValue.selected_start*1000))

                        if scope.ngModel.is_period
                            selectionRight = whTimeline.getChartManager().dateToX(new Date((viewValue.selected_end*1000+220)))
                        else selectionRight = selectionLeft

                        selectionWidth = selectionRight-selectionLeft

                        scope.selectionManager.selections[0].left =  selectionLeft  + whTimeline.getChartManager().viewModel.paneLeft
                        scope.selectionManager.selections[0].width = selectionWidth

                    # Basing on new selected dates, let's update selection's X and width accordingly
                    ngModel.$formatters.unshift (modelValue) ->
                        viewValue = configIsolator.isolate(modelValue, ['is_period', 'selected_start', 'selected_end', 'visible_start', 'visible_end', 'is_end_tracked', 'is_start_tracked', ])

                        viewValue.isNewSelection = scope.selectionManager.selections.length == 0
                        if viewValue.isNewSelection
                            scope.selectionManager.selections[0] = new SelectionArea()

                        $timeout -> recalculateSelectionView(viewValue)

                        return viewValue

                    # Whenever view value changes, let's merge those changes to the model
                    ngModel.$parsers.push (viewValue) ->
                        return configIsolator.merge(scope.ngModel, viewValue)

                    # Rendering is simply animating the selection element to it's current position
                    ngModel.$render = ->
                        #unless whTimeline.isSelectionModifiedByUser()
                        #    scope.selectionManager.stopInteraction()

                        $timeout ->
                            method = if ngModel.$viewValue.isNewSelection then 'css' else 'animate'
                            selectionElement().stop()[method]({
                                left:  scope.selectionManager.selections[0].left
                                width: scope.selectionManager.selections[0].width
                            }).css('overflow', 'visible')

                    # -------------------------

                    # Helper function that converts selected dates and visible coordinates to appropriate timestamps
                    updateModel = ->
                        return unless scope.selectionManager.selections.length

                        newSelection = scope.selectionManager.selections[0]

                        viewModel = whTimeline.getChartManager().viewModel
                        from = -viewModel.paneLeft + newSelection.left
                        to = from + newSelection.width - 2

                        if ngModel.$viewValue.is_period
                            from -= 1
                        else
                            from += 1
                            to += 2

                        invertedStartDate = whTimeline.getChartManager().xToDate(from)
                        invertedEndDate = whTimeline.getChartManager().xToDate(to)

                        ngModel.$viewValue.selected_start = getUnix(invertedStartDate)
                        ngModel.$viewValue.selected_end = getUnix(invertedEndDate)

                        ngModel.$viewValue.visible_start = getUnix(new Date(whTimeline.getChartManager().xToDate(-viewModel.paneLeft)))
                        ngModel.$viewValue.visible_end = getUnix(new Date(whTimeline.getChartManager().xToDate(-viewModel.paneLeft + viewModel.viewportOverlay.width)))

                        whTimeline.setSelectionModifiedByUser()

                        ngModel.$setViewValue(ngModel.$viewValue)
                        scope.$apply()

                    throttledUpdateModel = _.throttle(updateModel, 300)

                    # On each interaction event from either selection manager or it's plugins,
                    # let's update CSS on selection element and chart pane, AND update model
                    # at most once per 300 milliseconds (unless options.forceUpdate == true)
                    chartManager = null
                    onUserInteraction = (options) ->
                        if options.type == "onCloseToBoundary"
                            whTimeline.render(true)

                        activeSelection = scope.selectionManager.selections[0]

                        selectionElement().stop().css({
                            width: activeSelection.width
                            left:  Math.ceil(activeSelection.left+0.00001) - 1
                        })

                        chartManager.viewModel.pane.css {
                            left: chartManager.viewModel.paneLeft
                        }

                        if options.forceUpdate
                            updateModel()
                        else
                            throttledUpdateModel()

                    # Let's setup selection manager as soon as ChartManager is ready
                    whTimeline.chartManagerPromise().then((createdChartManager) ->
                        chartManager = createdChartManager

                        scope.selectionManager = new SelectionAreaManager(selectionPane, {
                            #afterSelectionStart:  onUserInteraction
                            #afterSelectionFinish: onUserInteraction
                            afterSelectionChange: onUserInteraction
                            strategy: new SingleSelectionAreaManagementStrategy({
                                nodeResolver: new SingleSelectionAreaNodeResolver({
                                    selectionElementSelector: '.selection-area'
                                })
                            })
                            isPeriod: scope.ngModel.is_period
                        })

                        scope.selectionManager.addPlugin(new StickySelectionPlugin(chartManager, {
                            onUpdate: onUserInteraction
                        }))

                        scope.selectionManager.addPlugin(new ChartPanePlugin(chartManager, {
                            onUpdate: onUserInteraction
                        }))
                    )

                    # -- Time tracking feature {{{
                    prevTime = getUnix()

                    # setInterval used because $interval calls $apply() each time regardless of the fourth param!!
                    setInterval((->
                        newTime = getUnix()

                        activeSelection = scope.selectionManager.selections[0]
                        deltaMs = Math.floor(newTime-prevTime) # * 1000

                        isPoint = not scope.ngModel.is_period

                        if activeSelection and activeSelection.state == 'none' and deltaMs
                            # If at least one boundary is tracked and at least one second passed
                            # since the last iteration, let's update selection dates accordingly

                            if ngModel.$viewValue.is_from_tracked or ngModel.$viewValue.is_end_tracked
                                if ngModel.$viewValue.is_start_tracked or isPoint
                                    ngModel.$viewValue.selected_start += deltaMs

                                if ngModel.$viewValue.is_end_tracked or isPoint
                                    ngModel.$viewValue.selected_end += deltaMs

                                # Prevent start overtaking end
                                ngModel.$viewValue.selected_end = Math.max(
                                    ngModel.$viewValue.selected_start,
                                    ngModel.$viewValue.selected_end
                                )

                                # Prevent end overtaking visible end
                                ngModel.$viewValue.selected_end = Math.min(
                                    ngModel.$viewValue.visible_end,
                                    ngModel.$viewValue.selected_end
                                )

                                ngModel.$setViewValue($.extend {}, ngModel.$viewValue)
                                ngModel.$render()

                                scope.$apply()

                        if deltaMs
                            prevTime = newTime
                    ), 400)
                    # -- }}} Tracking feature
            }
        )
    ])

###*
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
###
angular.module('wh.timeline')
    .directive('whPressToggle', ['$parse', ($parse) ->

        mouseupCallbackNo = 0
        mouseupCallbacks = {}

        $(document).on('mouseup', ->
            for k,callback of mouseupCallbacks
                callback()
            null
        )

        return {
            link: (scope, element, attr) ->
                isPressedIn = false
                outCallbackNo = ++mouseupCallbackNo
                setter = $parse(attr['whPressToggle']).assign

                element.bind 'mousedown', (event) ->
                    isPressedIn = true
                    scope.$apply -> setter(scope, true)

                mouseupCallbacks[outCallbackNo] = ->
                    return unless isPressedIn
                    isPressedIn = false
                    scope.$apply -> setter(scope, false)

                scope.$on('$destroy', ->
                    delete mouseupCallbacks[outCallbackNo]
                )
        }
    ])


###*
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
###
angular.module('wh.timeline')
    .directive('whTimelineDebug', [
        ( ->
            return {
                restrict: 'E'
                replace: true
                scope: {
                    'config': '='
                }
                templateUrl: 'templates/wh-timeline-debug.html'
            }
        )
    ])

###*
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
###
angular.module('wh.timeline')
    .directive('timepickerUnix', [
        ( ->
            return {
                restrict: 'E'
                require: '^ngModel'
                scope: {}
                templateUrl: 'templates/timepicker-unix.html'
                link: (scope, element, attr, ngModel) ->
                    ngModel.$render = ->
                        date = if ngModel.$modelValue then new Date( ngModel.$modelValue * 1000 ) else null
                        scope.date = date

                    scope.$watch('date', (newV, oldV) ->
                        if newV
                            ngModel.$setViewValue(Math.floor(newV.getTime()/1000+0.0000001))
                    )
            }
        )
    ])

###*
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
###
angular.module('wh.timeline')
    .directive('uiUtcUnixDate', ->
        require: 'ngModel'
        link: (scope, element, attrs, modelCtrl) ->

            modelCtrl.$formatters.push (unixTime) ->
                return unless unixTime
                utcDate = new Date(unixTime*1000)
                return new Date(
                    utcDate.getUTCFullYear(),
                    utcDate.getUTCMonth(),
                    utcDate.getUTCDate(),
                    utcDate.getUTCHours(),
                    utcDate.getUTCMinutes(),
                    utcDate.getUTCSeconds(),
                    utcDate.getUTCMilliseconds()
                )

            modelCtrl.$parsers.push (localDate) ->
                return unless localDate
                date = new Date(Date.UTC(
                    localDate.getFullYear(),
                    localDate.getMonth(),
                    localDate.getDate(),
                    localDate.getHours(),
                    localDate.getMinutes(),
                    localDate.getSeconds(),
                    localDate.getMilliseconds()
                ))
                return parseInt((date.getTime()+'').slice(0,-3))
    )

###*
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
###
angular.module('wh.timeline')
    .directive('uiUnixDate', ->
        require: 'ngModel'
        link: (scope, element, attrs, modelCtrl) ->

            modelCtrl.$formatters.push (unixTime) ->
                return unless unixTime
                return new Date(unixTime*1000)

            modelCtrl.$parsers.push (utcDate) ->
                return unless utcDate
                return parseInt((utcDate.getTime()+'').slice(0,-3))
    )

###*
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
###
angular.module('wh.timeline')
    .directive('datepickerInputs',
        ['$templateCache', '$log', ($templateCache, $log) -> {
            restrict: 'E'
            require: 'ngModel'
            scope: {
                ngModel: '=',
            }
            template: $templateCache.get('templates/datepicker-inputs.html')
            link: (scope, element, attrs, ngModel) ->

                pad = (value) -> ("0"+value).slice(-2)

                ngModel.$render = ->
                    updateScope(ngModel.$viewValue)

                updateScope = (date) ->
                    scope.Years  = ""+date.getUTCFullYear()
                    scope.Months = ""+pad(date.getUTCMonth()+1)
                    scope.Days   = ""+pad(date.getUTCDate())

                scope.invalid = {
                    years: false,
                    months: false
                    days: false
                }

                scope.updateDate = ->

                    years = parseInt(scope.Years, 10)
                    months = parseInt(scope.Months, 10)
                    days = parseInt(scope.Days, 10)

                    scope.invalid.years  = not (1 <= years <= 3000)
                    scope.invalid.months = not (1 <= months <= 12)
                    scope.invalid.days   = not (1 <= days <= 31)

                    if (v for k,v of scope.invalid when v).length
                        ngModel.$setValidity('time', false)
                        return

                    time = Date.UTC(
                        years,
                        months-1,
                        days,
                        ngModel.$viewValue.getUTCHours(),
                        ngModel.$viewValue.getUTCMinutes(),
                        ngModel.$viewValue.getUTCSeconds(),
                        ngModel.$viewValue.getUTCMilliseconds()
                    )

                    unless time
                        ngModel.$setValidity('time', false)
                        return

                    ngModel.$setValidity('time', true)

                    date = new Date(time)

                    updateScope(date)
                    ngModel.$setViewValue(date)

        }]
    )

###*
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
###
angular.module('wh.timeline')
    .directive('ngBlink', ->
        restrict: 'A'
        scope: {
            ngBlink: '='
        }
        link: (scope, element, attr) ->
            scope.$watch('ngBlink', (newV, oldV) ->
                return if not newV or newV == oldV
                scope.ngBlink = false

                element.finish().fadeIn().delay(3500).fadeOut()
            )
     )
