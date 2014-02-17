
'use strict'

getUnix = (date=new Date())-> Math.floor(date.getTime()/1000+0.0000001)
to_hash = (pairs) ->
    hash = {}
    hash[key] = value for [key, value] in pairs
    hash

angular
    .module('wh.timeline', ['ui.date','ui.bootstrap.timepicker'])
    .service('wh.timeline.utils.configIsolator', ->
        return {
            isolate: (complete, properties) ->
                viewValue = {}
                for p in properties
                    viewValue[p] = complete[p]
                return viewValue

            merge:   (complete, isolated) ->
                modelValue = {}
                for k,v of isolated
                    if k of complete
                        modelValue[k] = v

                for k,v of complete
                    unless k of modelValue
                        modelValue[k] = v

                return modelValue
        }
    )
    .directive('whTimeline', [
        'wh.timeline.chart.Chart',
        'wh.timeline.chart.ChartDataModel',
        'wh.timeline.chart.ChartViewModel',
        'wh.timeline.chart.D3ChartManager',
        'wh.timeline.chart.view.Histogram',
        'wh.timeline.utils.TimeInterval',
        '$timeout',
        '$interval',
        '$q',
        '$window',
        '$templateCache',
        ((Chart, ChartDataModel, ChartViewModel, D3ChartManager,
          HistogramView, TimeInterval, $timeout, $interval, $q, $window, $templateCache) ->
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

                    # Some general stuff {{{
                    window.scope = scope
                    scope.adjustingSelection = false
                    scope.visibleTimePerspectives = null;

                    scope.getVisibleTimeInterval = ->
                        return new TimeInterval(scope.ngModel.visible_start, scope.ngModel.visible_end, true)

                    # }}}

                    # -------------------------

                    findDataForTimePerspective = (perspective, dataType) ->
                        for chunk in ngModel.$modelValue.data
                            if chunk.name == perspective
                                return chunk[dataType]

                    # -------------------------

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

                        chartManager.renderCurrentState()

                    # --------------------------
                    # --------- CHART ----------
                    # --------------------------

                    scope.chartManager = chartManager = new D3ChartManager(new ChartViewModel(element.find('.wh-timeline-widget .svg-area')))

                    # We need to recalculate visible time interval before rendering the chart
                    chartManager.beforeRender = -> scope.$apply() if not scope.$$phase and not scope.$root.$$phase
                    chartManagerDeferred.resolve(chartManager)

                    angular.element($window).bind('resize', =>
                        chartManager.refreshPaneDimensions()
                        scope.$apply()
                    )

                    scope.$watch((
                        -> (elem.epoch_state+elem.epoch_raw for elem in ngModel.$modelValue.data).reduce (t,s) -> t+s
                    ), ((current, previous) ->
                        # Sort by bin width descending - critical!
                        ngModel.$modelValue.data.sort (e1,e2) -> e1.bin_width < e2.bin_width

                        return if current == previous

                        for elem in chartManager.getActiveCharts()
                            dataModel = elem.chart.dataModel
                            dataModel.updateRaw(findDataForTimePerspective(dataModel.perspective, 'raw'))
                            dataModel.updateState(findDataForTimePerspective(dataModel.perspective, 'state'))

                        chartManager.renderCurrentState()
                    ), true)

                    scope.$watchCollection('[ngModel.visible_start, ngModel.visible_end]', ( ->
                        chartManager.updateVisibleTimeInterval(scope.getVisibleTimeInterval())
                        chartManager.renderCurrentState()
                    ))

                    # Charts {{{

                    # State data (colors in background):
                    ###
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
                    ###

                    $(document).on('click', (e) =>
                        $target = $(e.target)
                        if $target.closest(element).length == 0 && $target.closest('.wh-timeline-config').length == 0 \
                        and $target.closest('.ui-datepicker-header').length == 0
                            scope.adjustingSelection = false
                            scope.$digest()
                        return true
                    )
                    # }}} Charts
                    return 1

                controller: ($scope, $element, $attrs) ->
                    @getChartManager = -> $scope.chartManager

                    @chartManagerPromise = -> chartManagerDeferred.promise
                    @setActiveTimePerspective = (newActive) ->
                        visible = [newActive]

                        length = $scope.ngModel.data.length
                        for idx in [length-1..0] by -1
                            if $scope.ngModel.data[idx].name == newActive
                                if idx < length
                                    visible.push $scope.ngModel.data[idx-1].name
                                break

                        $scope.setTimePerspectives visible

                    @setVisibleTimePerspectives = (visible) -> $scope.setTimePerspectives visible
                    @getVisibleTimePerspectives = -> $scope.visibleTimePerspectives
                    @getData = -> $scope.ngModel.data
                    return @
            }
        )
    ])

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

                ngModel.$formatters.unshift (modelValue) ->
                    viewValue = configIsolator.isolate(modelValue, ['is_period', 'selected_start', 'selected_end', 'visible_start', 'visible_end', 'is_end_tracked', 'is_start_tracked', ])

                    # @TODO: Remove
                    modelValue.data.sort (e1,e2) -> e1.bin_width < e2.bin_width

                    previouslyActive = scope.active
                    activeEntries = (chunk.name for chunk in modelValue.data when chunk.active).reverse()

                    scope.active = activeEntries[0]
                    if previouslyActive != scope.active
                        whTimeline.setVisibleTimePerspectives activeEntries

                    scope.available = (chunk.name for chunk in modelValue.data)
                    scope.binWidths = to_hash([chunk.name, chunk.bin_width] for chunk in modelValue.data)

                    return viewValue

                ngModel.$parsers.push (viewValue) ->
                    modelValue = configIsolator.merge(scope.ngModel, viewValue)

                    for chunk in modelValue.data
                        chunk.active = chunk.name in scope.visible

                    return modelValue

                scope.active = null
                scope.visible = null
                scope.available = null
                scope.binWidths = null

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


                element.closest('.wh-timeline').find('.chart-area').bind('mousewheel', (e) ->
                    e.preventDefault()
                    scope.switch(e.deltaY > 0)
                    scope.$apply() if not scope.$$phase and not scope.$root.$$phase
                )
        }]
    )


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

                    scope.$watch('[start, end]', ((timestamps, oldTimestamps) ->
                        return if timestamps == oldTimestamps
                        return if timestamps[0] == ngModel.$modelValue.selected_start and timestamps[1] == ngModel.$modelValue.selected_end
                        ngModel.$viewValue.selected_start = timestamps[0]
                        ngModel.$viewValue.selected_end   = timestamps[1]
                        ngModel.$setViewValue ngModel.$viewValue
                    ), true)

                    scope.$watch('[ngModel.is_start_tracked, ngModel.is_end_tracked]', ((newV, oldV) ->
                        if scope.ngModel.is_start_tracked and not scope.ngModel.is_end_tracked
                            [scope.ngModel.is_start_tracked, scope.ngModel.is_end_tracked] = oldV

                        ngModel.$viewValue.is_start_tracked = scope.ngModel.is_start_tracked
                        ngModel.$viewValue.is_end_tracked   = scope.ngModel.is_end_tracked
                        ngModel.$setViewValue ngModel.$viewValue
                    ), true)

                    ngModel.$formatters.push (modelValue) ->
                        scope.start = modelValue.selected_start
                        scope.end   = modelValue.selected_end
                        return configIsolator.isolate(modelValue, ['is_period', 'selected_start', 'selected_end', 'visible_start', 'visible_end', 'is_end_tracked', 'is_start_tracked', ])

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

                        visibleArea = whTimeline.getChartManager().viewModel.dataArea.width
                        calcBinWidth = (binWidth) ->
                            binWidthRatio = visibleSeconds / binWidth
                            return visibleArea / binWidthRatio

                        binWidthPx = calcBinWidth(whTimeline.getChartManager().getMainActiveChart().chart.dataModel.binWidth)

                        if binWidthPx < 10
                            ngModel.$modelValue.data.sort (e1,e2) -> e1.bin_width < e2.bin_width
                            for i in [ngModel.$modelValue.data.length - 1..0] by -1
                                chunk = ngModel.$modelValue.data[i]
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

                        return configIsolator.merge(scope.ngModel, viewValue)
                    # }}}

                    # Predefined choices {{{
                    scope.predefinedChoice = null

                    scope.$watch('predefinedChoice', (newChoice) ->
                        return unless newChoice

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

                    # Adjusting selection {{{
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

                    ngModel.$formatters.unshift (modelValue) ->
                        # modelValue = $.extend({}, modelValue)

                        viewValue = configIsolator.isolate(modelValue, ['is_period', 'selected_start', 'selected_end', 'visible_start', 'visible_end', 'is_end_tracked', 'is_start_tracked', ])

                        viewValue.isNewSelection = scope.selectionManager.selections.length == 0
                        if viewValue.isNewSelection
                            scope.selectionManager.selections[0] = new SelectionArea()

                        $timeout ->
                            selectionLeft = whTimeline.getChartManager().dateToX(new Date(viewValue.selected_start*1000))

                            if scope.ngModel.is_period
                                selectionRight = whTimeline.getChartManager().dateToX(new Date((viewValue.selected_end*1000+220))) # @TODO figure out why 220?
                            else selectionRight = selectionLeft

                            selectionWidth = selectionRight-selectionLeft

                            scope.selectionManager.selections[0].left =  selectionLeft  + whTimeline.getChartManager().viewModel.viewportLeft
                            scope.selectionManager.selections[0].width = selectionWidth

                        return viewValue

                    ngModel.$parsers.push (viewValue) ->
                        return configIsolator.merge(scope.ngModel, viewValue)

                    ngModel.$render = ->
                        $timeout ->
                            method = if ngModel.$viewValue.isNewSelection then 'css' else 'animate'
                            selectionElement().stop()[method]({
                                left:  scope.selectionManager.selections[0].left
                                width: scope.selectionManager.selections[0].width
                            }).css('overflow', 'visible')

                    # -------------------------

                    updateModel = ->
                        return unless scope.selectionManager.selections.length

                        newSelection = scope.selectionManager.selections[0]

                        viewModel = whTimeline.getChartManager().viewModel
                        from = -viewModel.viewportLeft + newSelection.left
                        to = from + newSelection.width - 2

                        if ngModel.$viewValue.is_period
                            from -= 1
                        else
                            from += 1
                            to += 2

                        #if from == 0
                        #    invertedStartDate = new Date(ngModel.$viewValue.visible_start*1000)
                        #else
                        invertedStartDate = whTimeline.getChartManager().xToDate(from)

                        #if to == scope.paneWidth - 1
                        #    invertedEndDate = new Date(ngModel.$viewValue.visible_end*1000)
                        #else
                        invertedEndDate = whTimeline.getChartManager().xToDate(to)

                        ngModel.$viewValue.selected_start = getUnix(invertedStartDate)
                        ngModel.$viewValue.selected_end = getUnix(invertedEndDate)

                        ngModel.$viewValue.visible_start = getUnix(new Date(whTimeline.getChartManager().xToDate(-viewModel.viewportLeft)))
                        ngModel.$viewValue.visible_end = getUnix(new Date(whTimeline.getChartManager().xToDate(-viewModel.viewportLeft + viewModel.dataArea.width)))

                        ngModel.$setViewValue(ngModel.$viewValue)
                        scope.$apply()

                    throttledUpdateModel = _.throttle(updateModel, 300)

                    chartManager = null
                    onUserInteraction = (options) ->
                        ++scope.viewState;

                        chartManager or= whTimeline.getChartManager()

                        activeSelection = scope.selectionManager.selections[0]

                        selectionElement().stop().css({
                            width: activeSelection.width
                            left:  Math.ceil(activeSelection.left+0.00001) - 1
                        })

                        chartManager.viewModel.viewport.css {
                            left: chartManager.viewModel.viewportLeft
                        }

                        if options.forceUpdate
                            updateModel()
                        else
                            throttledUpdateModel()

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

                    whTimeline.chartManagerPromise().then((chartManager) ->
                        scope.selectionManager.addPlugin(new StickySelectionPlugin(chartManager, {
                            onUpdate: onUserInteraction
                        }))

                        scope.selectionManager.addPlugin(new ChartPanePlugin(chartManager, {
                            onUpdate: onUserInteraction
                        }))
                    )


                    # -- Tracking feature {{{
                    prevTime = getUnix()

                    # Race condition with whTimeline.onUserInteraction() - if this runs before scope is applied,
                    # then everything is lost :(
                    # $interval calls $apply() each time regardless of the fourth param!!
                    setInterval((->
                        newTime = getUnix()

                        activeSelection = scope.selectionManager.selections[0]
                        deltaMs = Math.floor(newTime-prevTime) # * 1000

                        isPoint = not scope.ngModel.is_period

                        if activeSelection and activeSelection.state == 'none' and deltaMs
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

                                #ngModel.$modelValue.selected_from = ngModel.$viewValue.selected_from
                                #ngModel.$modelValue.selected_end = ngModel.$viewValue.selected_end

                                #scope.ngModel.selected_start = ngModel.$viewValue.selected_start
                                #scope.ngModel.selected_end = ngModel.$viewValue.selected_end

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

    .directive('ngPressToggle', ['$parse', ($parse) ->

        mouseupCallbackNo = 0
        mouseupCallbacks = {}

        $(document).on('mouseup', ->
            for k,callback of mouseupCallbacks
                callback()
            null
        )

        return {
            priority: 100
            link: (scope, element, attr) ->
                isPressedIn = false
                outCallbackNo = ++mouseupCallbackNo
                setter = $parse(attr['ngPressToggle']).assign

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

    .directive('whTimelineDebug', [
        ( ->
            return {
                priority: 91
                restrict: 'E'
                replace: true
                scope: {
                    'config': '='
                }
                templateUrl: 'templates/wh-timeline-debug.html'
            }
        )
    ])

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

    .directive('ngPressIn', ($parse) ->

        mouseupCallbackNo = 0
        mouseupCallbacks = {}

        $(document).on('mouseup', ->
            for k,callback of mouseupCallbacks
                callback()
            null
        )

        return {
            priority: 100
            link: (scope, element, attr) ->
                isPressedIn = false
                outCallbackNo = false

                if attr['ngPressIn']
                    onPressStart = $parse(attr['ngPressIn'])
                    element.bind 'mousedown', (event) ->
                        isPressedIn = true
                        scope.$apply -> onPressStart(scope, {$event: event})

                if attr['ngPressOut']
                    outCallbackNo = ++mouseupCallbackNo
                    onPressEnd = $parse(attr['ngPressOut'])
                    mouseupCallbacks[outCallbackNo] = ->
                        return unless isPressedIn
                        isPressedIn = false

                        scope.$apply -> onPressEnd(scope, {$event: event})

                scope.$on('$destroy', ->
                    if outCallbackNo != false
                        delete mouseupCallbacks[outCallbackNo]
                )
        }
    )

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

    .directive('ngScroll', ['$parse', ($parse)  ->
        return (scope, element, attr) ->
            fn = $parse(attr.ngScroll);

            element.bind('mousewheel', (event) ->
                scope.$apply(->
                    fn(scope, {
                        $event: event
                    });
                );
            );
     ]);

