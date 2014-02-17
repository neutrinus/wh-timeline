
class SelectionArea
    constructor: (@left, @width) ->
        @state = 'none' # none, compose, move, resize-left, resize-right
        @overflow = 0

    equals: (selection2) ->
        return selection2 and @_left == selection2.left and @_width == selection2.width

    calcRight: -> @right = @_left + @_width

    Object.defineProperty @prototype, "left", {
        set: (@_left) -> @calcRight()
        get: -> @_left
        configurable: yes
    }

    Object.defineProperty @prototype, "width", {
        set: (@_width) -> @calcRight()
        get: -> @_width
        configurable: yes
    }

class SelectionAreaMover

    constructor: ->
        @area = null
        @paneWidth = null

    setup: (@area, @paneWidth) ->

    handle: (area, paneWidth, e) ->
        @setup(area, paneWidth)

        overflowBefore = @area.overflow
        # console.log 'bounds left '+ e.selection.bounds.left
        switch @area.state
            when "move"
                @handleOverflowMove e.selection.bounds, e.selection.atomicDelta.x

            when "compose", "resize-left", "resize-right"
                @handleOverflowCompose e.selection.overflow

        correctedAtomicDelta = e.selection.atomicDelta.x
        if overflowBefore and not @area.overflow
            correctedAtomicDelta += overflowBefore

        switch @area.state
            when "resize-left"
                @area.subState = "moveLeftBound"
                @area.state = 'compose'
                @compose correctedAtomicDelta

            when "resize-right"
                @area.subState = "moveRightBound"
                @area.state = 'compose'
                @compose correctedAtomicDelta

            when "compose"
                @compose correctedAtomicDelta

            when "move"
                @move correctedAtomicDelta

        return true

    getLeftMargin:  -> @area.left
    getRightMargin: -> @paneWidth - @area.width - @area.left

    handleOverflowMove:  (bounds, deltaX) ->
        # If selection sticked to the left and mouse is either (inside the selection AND moving to the left) or outside of the pane
        if @area.left == 0 and not (deltaX > 0 and bounds.left > 0)
            @area.overflow = Math.min(0, @area.overflow + deltaX, bounds.left)

        # If selection sticked to the right and mouse is either (inside the selection AND moving to the right) or outside of the pane
        else if @area.right >= @paneWidth and not (deltaX < 0 and bounds.right < @paneWidth)
            @area.overflow = Math.max(0, @area.overflow + deltaX, bounds.right - @paneWidth)

        # Otherwise there is no overflow
        else @area.overflow = 0

    handleOverflowCompose: (overflow) ->
        # Simple stuff, just use whatever came from the selection plugin
        @area.overflow = overflow

    compose: (deltaX) ->
        if (not @area.subState or @area.subState == 'moveRightBound') and    -deltaX >= @area.width and @area.left > 1 and not @area.overflow
            pDeltaX = -deltaX - @area.width

            @area.left = @area.left - pDeltaX
            @area.width = pDeltaX + 1
            @area.subState = 'moveLeftBound'
        else if (not @area.subState or @area.subState == 'moveLeftBound') and deltaX >= @area.width and @area.left + @area.width < @paneWidth and not @area.overflow
            pDeltaX = deltaX - @area.width

            @area.left = @area.left + @area.width - 1
            @area.width = pDeltaX + 1
            @area.subState = 'moveRightBound'
        else
            @[@area.subState](deltaX)

    move: (x) ->
        if @area.overflow
            return
        minX = @getLeftMargin() * -1
        maxX = @getRightMargin()

        x = Math.min(maxX, x)
        x = Math.max(minX, x)

        @area.left = @area.left + x

    moveLeftBound: (x) ->
        x = @calcPossibleLeftBoundMovement(x)

        @area.left  = @area.left  + x
        @area.width = @area.width - x

        return x

    calcPossibleLeftBoundMovement: (x, considerOverflow=true) ->
        if considerOverflow
            # console.log 'leftInfo', @area.overflow, @area.left+@area.width, @paneWidth
            if @area.overflow < 0 and x > 0
                return 0
            if @area.overflow > 0 and @area.left+@area.width >= @paneWidth and x < 0
                return 0

        minX = @getLeftMargin() * -1
        maxX = @area.width - 1

        x = Math.min(maxX, x)
        x = Math.max(minX, x)

        return x

    moveRightBound: (x) ->
        x = @calcPossibleRightBoundMovement(x)

        @area.width = @area.width + x

        return x

    calcPossibleRightBoundMovement: (x, considerOverflow=true) ->
        if considerOverflow
            # console.log 'rightInfo', @area.overflow, @area.left
            if @area.overflow > 0 and x < 0
                return 0
            if @area.overflow < 0 and @area.left == 0 and x > 0
                return 0

        minX = @area.width * -1 + 1
        maxX = @getRightMargin() + 1

        x = Math.min(maxX, x)
        x = Math.max(minX, x)

        return x


class SelectionPointMover extends SelectionAreaMover

    setup: (area, paneWidth) ->
        super(area, paneWidth)
        area.width = 1

    compose: (deltaX) ->
        if (not @area.subState or @area.subState == 'moveRightBound') and    -deltaX >= @area.width and @area.left > 0 and not @area.overflow
            pDeltaX = -deltaX - @area.width

            @area.left = @area.left - pDeltaX
            @area.subState = 'moveLeftBound'
        else if (not @area.subState or @area.subState == 'moveLeftBound') and deltaX >= @area.width and @area.left + @area.width < @paneWidth and not @area.overflow
            @area.left = @area.left + @area.width + deltaX - 2
            @area.subState = 'moveRightBound'
        else
            @[@area.subState](deltaX)
        @area.width = 1

    moveLeftBound:  (x) ->
        if super(x)
            @__proto__.__proto__.moveRightBound.call(@, x)

    moveRightBound: (x) ->
        if super(x)
            @__proto__.__proto__.moveLeftBound.call(@, x)

# Just a mock class for a reference of what methods are necessary
class SelectionAreaNodeResolver
    resolve: (areaSelectionEvent) ->

class SingleSelectionAreaNodeResolver

    constructor: (options={}) ->
        @options = $.extend(true, {
            selectionElementSelector: ""
        }, options)

    resolve: (event) ->
        return $(event.originalEvent.target).closest(@options.selectionElementSelector)

# Just a mock class for a reference of what methods are necessary
class SelectionAreaManagementStrategy
    resolveAnotherSelection: (managedSelectionAreas, selectionDetails) ->

class SingleSelectionAreaManagementStrategy extends SelectionAreaManagementStrategy

    constructor: (options={}) ->
        @options = $.extend(true, {
            nodeResolver: null
        }, options)

    resolveAnotherSelection: (managedSelectionAreas, event) ->
        selectionAreaClicked = @options.nodeResolver.resolve(event).length > 0 \
                                and managedSelectionAreas.length > 0

        if selectionAreaClicked
            selectionArea = managedSelectionAreas[0]
            droppedSelectionAreas = []
        else
            selectionArea = new SelectionArea(
                event.selection.bounds.left,
                Math.max(event.selection.dimensions.width, 1)
            )
            droppedSelectionAreas = (k for v,k in managedSelectionAreas)

        return new SelectionAreaManagementDelta(selectionArea, droppedSelectionAreas)

class SelectionAreaManagementDelta
    activeSelection: null
    droppedSelectionAreas: null
    constructor: (@activeSelection, @droppedSelectionAreas) ->

class SelectionAreaManager

    constructor: (pane, options) ->
        @selections = []
        @params = {              # parameters affecting the current operation
            initialArea: null    # freezed initial state of SelectionArea
            pane: {              # freezed initial params of pane
                width: null
            }
            resize: {            # resizing-related info
                left:  false     # is resize to the left?
                right: false     # is resize to the right?
            }
        }
        @pane = null
        @state = "none"
        @activeSelection = null

        @listeners = {
            beforeSelectionChange: []
            afterSelectionStart:   []
            afterSelectionChange:  []
            afterSelectionFinish:  []
        }

        @pane = pane
        @options = $.extend(true, {
            maxSelections: 1
            onChange: $.noop
            strategy: null
            mover: null

            isPeriod: true
            # onStep: $.noop

            afterSelectionStart:  $.noop
            afterSelectionChange: $.noop
            afterSelectionFinish: $.noop
        }, options)

        unless @options.mover
            @options.mover = if @options.isPeriod then new SelectionAreaMover() else new SelectionPointMover()

        setup.call(@)

    createEvent = (props={}) ->
        $.extend({'manager': @}, props, {
            defaultPrevented: false,
            preventDefault: -> @defaultPrevented = true

            propagationStopped: false,
            stopPropagation: -> @propagationStopped = true
        })

    notifyListeners: (eventName, data={}) ->
        event = createEvent(data)
        for listener in @listeners[eventName]
            listener(event)
            break if event.propagationStopped
        return event

    forceNewInitialState: (left, width) ->
        @params.initialArea.left = left
        @params.initialArea.width = width
        pluginModel = @pane.selectableArea().model
        pluginModel.x = 0

    setup = ->
        @pane.selectableArea()

        changed = false

        @pane.on("areaSelectionStart", (e) =>
            # Compute SelectionAreaManagementDelta
            delta = @options.strategy.resolveAnotherSelection(@selections, e)

            changed = false

            # Process delta accordingly:

            # - set currently processed selection area
            @activeSelection = delta.activeSelection
            @activeSelection.isClicked = false

            # - remove appropriate selection area from the pool if necessary
            if delta.droppedSelectionAreas
                for droppedAreaIndex in delta.droppedSelectionAreas
                    @selections.splice(droppedAreaIndex, 1)

            # - add currently processed selection area to the pool if necessary,
            is_area_new = @selections.indexOf(@activeSelection) == -1
            if is_area_new
                @selections.push(@activeSelection)

            # Compute some initial properties:

            # - decide what the state is ("if" explicitly separated from the above one)
            if is_area_new
                @activeSelection.state = "compose"
            else if @params.resize.left
                @activeSelection.state = "resize-left"
            else if @params.resize.right
                @activeSelection.state = "resize-right"
            else
                @activeSelection.state = "move"

            # - freeze some data for further processing
            @params.initialArea = $.extend(true, {}, @activeSelection)
            @params.pane.width = @pane.width()

            event = @notifyListeners('afterSelectionStart', { delta: delta, activeSelection: @activeSelection })

            # After all of this let's call our precious callback
            unless event.defaultPrevented
                @options.afterSelectionStart.call(@, event)
        )

        @pane.on("areaSelectionFinish", (e) =>

            # if it's just a click in a period mode
            if @options.isPeriod and @activeSelection and not changed and @activeSelection.width == 1
                e.keepActive = true
                @activeSelection.isClicked = true
            else
                droppedSelectionArea = @activeSelection

                if @activeSelection
                    @activeSelection.state = "none"
                    @activeSelection.overflow = 0
                @activeSelection = null

                event = @notifyListeners('afterSelectionFinish', { droppedSelectionArea: droppedSelectionArea })
                unless event.defaultPrevented
                    @options.afterSelectionFinish.call(@, event)
        )

        @pane.on("areaSelectionChange", (e) =>
            return unless @activeSelection

            changed = true
            eventData = {
                event: e
                activeSelection: @activeSelection
            }

            event = @notifyListeners('beforeSelectionChange', eventData)
            unless event.defaultPrevented
                @options.mover.handle(@activeSelection, @params.pane.width, e)

            event = @notifyListeners('afterSelectionChange', eventData)
            unless event.defaultPrevented
                @options.afterSelectionChange.call(@, event)
        )

    addPlugin: (plugin) ->
        plugin.init(@)

class StickySelectionPlugin

    constructor: (@chartManager, options={}) ->
        @options = $.extend(true, {
            viewport:       $('.chart-viewport'),
            onUpdate:       $.noop()
        }, options)

    init: (@selectionAreaManager) ->
        @selectionAreaManager.listeners.afterSelectionStart.push   @afterSelectionStart.bind(@)
        @selectionAreaManager.listeners.afterSelectionChange.push  @afterSelectionChange.bind(@)

    afterSelectionStart: (event) ->
        @sumDelta = 0
        unless event.activeSelection.subState
            event.activeSelection.subState = "moveRightBound"

    afterSelectionChange: (event) ->
        return unless event.activeSelection.isClicked
        return unless @selectionAreaManager.options.isPeriod

        # Prevent moving pane
        event.stopPropagation()

        currentDelta = event.event.selection.atomicDelta.x
        @sumDelta   += currentDelta

        dataAreaWidth = @chartManager.viewModel.dataArea.width

        mover = @selectionAreaManager.options.mover
        mover.setup event.activeSelection, dataAreaWidth

        currentLeft  = event.activeSelection.left
        currentRight = event.activeSelection.right

        if event.activeSelection.subState == "moveLeftBound"
            boundMethod = "moveLeftBound"
            sameHandEdge = currentLeft  - 1
            oppositeEdge = currentRight - 1
        else
            boundMethod = "moveRightBound"
            sameHandEdge = currentRight - 2
            oppositeEdge = currentLeft  - 1

        # mover[boundMethod](-currentDelta)

        projection  = oppositeEdge + @sumDelta
        projectionSiblings = @computeSurroundingTicksX(projection)

        alignedProjection = @computeClosestTickX(projection)
        deltaX = alignedProjection - sameHandEdge

        mover[boundMethod](deltaX)

    computeSurroundingTicksX: (left) ->
        date = @chartManager.xToDate(left - @chartManager.viewModel.viewportLeft)
        siblings = @chartManager.getMainActiveChart().view.findSurroundingTicks(date).map(
            (x) => @chartManager.dateToX(x) + @chartManager.viewModel.viewportLeft
        )
        siblings[0] = Math.max(siblings[0], 0)
        siblings[1] = Math.min(siblings[1], @chartManager.viewModel.dataArea.width)

        return siblings

    computeClosestTickX: (left) ->
        siblings = @computeSurroundingTicksX(left)

        distance0 = Math.abs(siblings[0]-left)
        distance1 = Math.abs(siblings[1]-left)

        return if distance0 < distance1 then siblings[0] else siblings[1]

class ChartPanePlugin

    constructor: (@chartManager, options={}) ->
        @inProgress = false
        @overflow = 0

        @options = $.extend(true, {
            viewport:       $('.chart-viewport'),
            onUpdate:       $.noop()
        }, options)

    init: (@selectionAreaManager) ->
        @selectionAreaManager.listeners.afterSelectionStart.push  @afterSelectionStart.bind(@)
        @selectionAreaManager.listeners.afterSelectionChange.push @afterSelectionChange.bind(@)
        @selectionAreaManager.listeners.afterSelectionFinish.push @afterSelectionFinish.bind(@)

    animatePane: (activeSelection) ->
        if @overflow
            # variables initialization
            @inProgress = true

            deltaPx = @overflow * 5
            treshold =  @chartManager.viewModel.dataArea.width * 3/5
            dataAreaWidth = @chartManager.viewModel.dataArea.width

            initialSelectionWidth = activeSelection.width # sel.width()
            initialSelectionLeft  = activeSelection.left  # sel.position().left

            viewport = @options.viewport
            viewportLeft = @chartManager.viewModel.viewportLeft # viewport.position().left
            viewportWidth = viewport.width()

            # If we are close to rendered boundaries let's re-render the chart
            if deltaPx < 0
                deltaPx = Math.max(deltaPx, -treshold)
                if viewportLeft > deltaPx
                    @onCloseToBoundary(true)
            else
                deltaPx = Math.min(deltaPx, treshold)
                if viewportLeft - deltaPx < -@chartManager.computeRenderOptions([]).renderWidth + @chartManager.viewModel.dataArea.width
                    @onCloseToBoundary(false)

            viewportLeft = @chartManager.viewModel.viewportLeft # refresh

            # Move viewport and possibly extend selection
            beforeStep = $.noop
            if activeSelection.state == "compose"
                mover = @selectionAreaManager.options.mover
                mover.setup(activeSelection, dataAreaWidth)

                absDeltaPx = Math.abs(deltaPx)

                if activeSelection.subState == "moveLeftBound"
                    deltaPx = -@selectionAreaManager.options.mover.calcPossibleRightBoundMovement(-deltaPx, false)
                    beforeStep = (absStepDeltaPx) ->
                        activeSelection.width = initialSelectionWidth + absStepDeltaPx
                else
                    deltaPx = -@selectionAreaManager.options.mover.calcPossibleLeftBoundMovement(-deltaPx, false)

                    beforeStep = (absStepDeltaPx) ->
                        activeSelection.width = initialSelectionWidth + absStepDeltaPx
                        activeSelection.left  = initialSelectionLeft  - absStepDeltaPx

                unless @selectionAreaManager.options.isPeriod
                    beforeStep = ->

            viewport.animate({textIndent: 0}, {
                progress: (animation, progress, remainingMs) =>
                    stepDeltaPx = Math.round(progress * deltaPx + 0.00001)
                    beforeStep(Math.abs(stepDeltaPx))
                    newViewportLeft = viewportLeft - stepDeltaPx
                    @chartManager.viewModel.viewportLeft = newViewportLeft
                    @options.onUpdate({
                        selection:       activeSelection
                        viewportBounds:  {
                            left:  -newViewportLeft
                            right: -newViewportLeft + dataAreaWidth
                        }
                    })

                easing:   'linear',
                duration: 600,
                complete: => @animatePane(activeSelection)
                fail:     => @chartManager.suppressRendering(false)
            })
        else
            @chartManager.suppressRendering(false)

    afterSelectionStart: (event) ->
        @step = null
        @selArea = $('.selection-area')
        @inProgress = false

    afterSelectionChange: (event) ->
        @overflow = event.activeSelection.overflow
        if @inProgress
            @options.viewport.stop()
        @chartManager.suppressRendering(true)
        @animatePane(event.activeSelection)

    afterSelectionFinish: (event) ->
        @options.viewport.stop()

    onCloseToBoundary: (isLeftBoundary) ->
        renderOptions = @chartManager.computeRenderOptions([])

        dataAreaWidth = @chartManager.viewModel.dataArea.width
        left = @options.viewport.position().left
        width = @options.viewport.width()

        @options.viewport.stop()

        @options.onUpdate({
            viewportBounds:  {
                left:  -left
                right: -left + dataAreaWidth
            },
            forceUpdate: true
        })

        @chartManager.renderCurrentState(true)


angular
    .module('wh.timeline')
    .factory('wh.timeline.selection.plugin.ChartPanePlugin', -> ChartPanePlugin)
    .factory('wh.timeline.selection.plugin.StickySelectionPlugin', -> StickySelectionPlugin)
    .factory('wh.timeline.selection.strategy.SingleSelectionAreaManagementStrategy', -> SingleSelectionAreaManagementStrategy)
    .factory('wh.timeline.selection.nodeResolver.SingleSelectionAreaNodeResolver', -> SingleSelectionAreaNodeResolver)

    .factory('wh.timeline.selection.SelectionArea', -> SelectionArea)
    .factory('wh.timeline.selection.SelectionAreaManager', -> SelectionAreaManager)
