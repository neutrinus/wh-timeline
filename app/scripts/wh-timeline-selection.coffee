
###*
* @ngdoc service
* @name wh.timeline.selection.SelectionArea
*
* @description POJO object holding pixel-wise information about the selection
###
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

###*
* @ngdoc service
* @name wh.timeline.selection.mover.SelectionAreaMover
*
* @description Internal class that performs calculations related to moving a selection area
###
class SelectionAreaMover

    constructor: ->
        @area = null
        @paneWidth = null

    setup: (@area, @paneWidth) ->

    ###*
    * @ngdoc method
    * @name wh.timeline.selection.SelectionAreaMover#handle
    *
    * @param {SelectionArea} area
    * @param {integer} paneWidth
    * @param {event} e event received from SelectableAreaPlugin
    *
    * @description Handles an event received from SelectableAreaPlugin, sets this mover's
    * state, and moves the selection accordingly
    ###
    handle: (area, paneWidth, e) ->
        @setup(area, paneWidth)

        overflowBefore = @area.overflow
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

    ###*
    * @ngdoc method
    * @name wh.timeline.selection.SelectionAreaMover#getLeftMargin
    *
    * @return {integer} distanve between left edge of the selection and pane's left edge
    ###
    getLeftMargin:  -> @area.left
    ###*
    * @ngdoc method
    * @name wh.timeline.selection.SelectionAreaMover#getRightMargin
    *
    * @return {integer} distanve between right edge of the selection and pane's right edge
    ###
    getRightMargin: -> @paneWidth - @area.width - @area.left

    ###*
    * @ngdoc method
    * @name wh.timeline.selection.SelectionAreaMover#handleOverflowMove
    *
    * @param {object} bounds  current selection bounds
    * @param {integer} deltaX current mouse movement
    * @description Computes selection overflow in the "move" phase
    * @return {integer} new overflow value
    ###
    handleOverflowMove:  (bounds, deltaX) ->
        # If selection sticked to the left and mouse is either (inside of the selection AND moving to the left) or outside of the pane
        if @area.left == 0 and not (deltaX > 0 and bounds.left > 0)
            @area.overflow = Math.floor(Math.min(0, @area.overflow + deltaX, bounds.left))

        # If selection sticked to the right and mouse is either (inside of the selection AND moving to the right) or outside of the pane
        else if @area.right >= @paneWidth and not (deltaX < 0 and bounds.right < @paneWidth)
            @area.overflow = Math.floor(Math.max(0, @area.overflow + deltaX, bounds.right - @paneWidth))

        # Otherwise there is no overflow
        else @area.overflow = 0

        return @area.overflow

    ###*
    * @ngdoc method
    * @name wh.timeline.selection.SelectionAreaMover#handleOverflowCompose
    *
    * @param {integer} overflow current overflow
    * @description Computes selection overflow in the "compose" phase
    ###
    handleOverflowCompose: (overflow) ->
        # Simple stuff, just use whatever came from the selection plugin
        @area.overflow = overflow

    ###*
    * @ngdoc method
    * @name wh.timeline.selection.SelectionAreaMover#compose
    *
    * @param {integer} deltaX current deltaX
    * @description Handles calculations related to composing selection:
    * * deciding which bound is currently moved (left or right)
    * * moving that pane
    ###
    compose: (deltaX) ->
        if (not @area.subState or @area.subState == 'moveRightBound') and    -deltaX >= @area.width and @area.left > 1 and not @area.overflow
            pDeltaX = Math.ceil(-deltaX - @area.width)

            @area.left = Math.ceil(@area.left - pDeltaX)
            @area.width = pDeltaX + 1
            @area.subState = 'moveLeftBound'
        else if (not @area.subState or @area.subState == 'moveLeftBound') and deltaX >= @area.width and @area.left + @area.width < @paneWidth and not @area.overflow
            pDeltaX = Math.ceil(deltaX - @area.width)

            @area.left = Math.ceil(@area.left + @area.width - 1)
            @area.width = pDeltaX + 1
            @area.subState = 'moveRightBound'
        else
            @[@area.subState](deltaX)

    ###*
    * @ngdoc method
    * @name wh.timeline.selection.SelectionAreaMover#move
    *
    * @param {integer} x
    * @description moves the current selection by x
    ###
    move: (x) ->
        if @area.overflow
            return
        minX = @getLeftMargin() * -1
        maxX = @getRightMargin()

        x = Math.min(maxX, x)
        x = Math.max(minX, x)

        @area.left = @area.left + x

    ###*
    * @ngdoc method
    * @name wh.timeline.selection.SelectionAreaMover#moveLeftBound
    *
    * @param {integer} x
    * @description moves left bound by x (right bound stays at the same place)
    ###
    moveLeftBound: (x) ->
        x = @calcPossibleLeftBoundMovement(x)

        @area.left  = @area.left  + x
        @area.width = @area.width - x

        return x

    ###*
    * @ngdoc method
    * @name wh.timeline.selection.SelectionAreaMover#calcPossibleLeftBoundMovement
    *
    * @param {integer} x
    * @param {boolean} considerOverflow
    * @description adjusts x to be valid left bound movement delta in case it isn't
    ###
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

        return Math.ceil(x)

    ###*
    * @ngdoc method
    * @name wh.timeline.selection.SelectionAreaMover#moveRightBound
    *
    * @param {integer} x
    * @description moves right bound by x (left bound stays at the same place)
    ###
    moveRightBound: (x) ->
        x = @calcPossibleRightBoundMovement(x)

        @area.width = @area.width + x

        return x

    ###*
    * @ngdoc method
    * @name wh.timeline.selection.SelectionAreaMover#calcPossibleRightBoundMovement
    *
    * @param {integer} x
    * @param {boolean} considerOverflow
    * @description adjusts x to be valid right bound movement delta in case it isn't
    ###
    calcPossibleRightBoundMovement: (x, considerOverflow=true) ->
        if considerOverflow
            # console.log 'rightInfo', @area.overflow, @area.left
            if @area.overflow > 0 and x < 0
                return 0
            if @area.overflow < 0 and @area.left == 0 and x > 0
                return 0

        minX = @area.width * -1 + 1
        maxX = @getRightMargin()

        x = Math.min(maxX, x)
        x = Math.max(minX, x)

        return x


###*
* @ngdoc service
* @name wh.timeline.selection.mover.SelectionPointMover
*
* @description Internal class that performs calculations related to moving a selection point
###
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
            @area.left = Math.ceil(@area.left + @area.width + deltaX - 2)
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

###*
* @ngdoc object
* @service wh.timeline.selection.nodeResolver.SingleSelectionAreaNodeResolver
*
* @description "Abstract" Node Resolver
###
class SelectionAreaNodeResolver
    ###*
    * @ngdoc method
    * @name wh.timeline.selection.SelectionAreaMover#calcPossibleRightBoundMovement
    *
    * @param {event} areaSelectionEvent
    * @description Computes appropriate SelectionArea to modify after areaSelectionEvent was intercepted
    * It will be useful when two or more SelectionAreas are present and they are overlapping
    * @return {SelectionArea}
    ###
    resolve: (areaSelectionEvent) ->

###*
* @ngdoc object
* @name wh.timeline.selection.SingleSelectionAreaNodeResolver
*
* @description Simple Node Resolver, always returns clicked selection
###
class SingleSelectionAreaNodeResolver

    constructor: (options={}) ->
        @options = $.extend(true, {
            selectionElementSelector: ""
        }, options)

    resolve: (event) ->
        return $(event.originalEvent.target).closest(@options.selectionElementSelector)


###*
* @ngdoc object
* @name wh.timeline.selection.SelectionAreaManagementStrategy
*
* @description "Abstract" management strategy just to expose some interface
###
class SelectionAreaManagementStrategy
    ###*
    * @ngdoc method
    * @name wh.timeline.selection.SelectionAreaManagementStrategy#resolveAnotherSelection
    *
    * @param {array} managedSelectionAreas
    * @param {event} selectionDetails
    *
    * @description Computes SelectionAreaManagementDelta based on managedSelectionAreas and selectionDetails
    * @return {SelectionAreaManagementDelta}
    ###
    resolveAnotherSelection: (managedSelectionAreas, selectionDetails) ->

###*
* @ngdoc object
* @service wh.timeline.selection.strategy.SingleSelectionAreaManagementStrategy
*
* @description selection management strategy suited to single selection.
* It either creates a selection if there is none, or returns existing one.
###
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

###*
* @ngdoc object
* @name wh.timeline.selection.SelectionAreaManagementDelta
*
* @description Created by SelectionAreaManagementStrategy. It tells SelectionAreaManager
* what selections should be dropped and what is the currently active one.
###
class SelectionAreaManagementDelta
    activeSelection: null
    droppedSelectionAreas: null
    constructor: (@activeSelection, @droppedSelectionAreas) ->

###*
* @ngdoc service
* @name wh.timeline.selection.SelectionAreaManager
*
* @description Manages selections model and view. Updates seletions based on events
* received from the browser.
###
class SelectionAreaManager

    ###*
    * @ngdoc method
    * @name wh.timeline.selection.SelectionAreaManager#constructor
    *
    * @param {jQuery} pane
    * @param {object} options Options for this SelectionAreaManager, the defaults are:
    * {
    *    maxSelections: 1              # Maximum number of selections managed by this manager
    *    strategy: null                # SelectionAreaNodeResolver
    *    mover: null                   # SelectionAreaMover used by this manager
    *    isPeriod: true                # Should this SelectionAreaManager manage periods? if false then it will manage points
    *    afterSelectionStart:  $.noop  # Callback to call after selection-related action is started
    *    afterSelectionChange: $.noop  # Callback to call after selection is modified via user interaction
    *    afterSelectionFinish: $.noop  # Callback to call after selection-related action is finished
    * }
    ###
    constructor: (pane, options) ->
        @selections = []
        @params = {
            initialArea: null
            pane: {
                width: null
            }
            resize: {
                left:  false
                right: false
            }
        }
        @plugins = []
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

    # @private
    createEvent = (props={}) ->
        $.extend({'manager': @}, props, {
            defaultPrevented: false,
            preventDefault: -> @defaultPrevented = true

            propagationStopped: false,
            stopPropagation: -> @propagationStopped = true
        })

    # @private
    notifyListeners: (eventName, data={}) ->
        event = createEvent(data)
        for listener in @listeners[eventName]
            listener(event)
            break if event.propagationStopped
        return event

    # @private
    forceNewInitialState: (left, width) ->
        @params.initialArea.left = left
        @params.initialArea.width = width
        pluginModel = @pane.selectableArea().model
        pluginModel.x = 0

    # @not implemented
    stopInteraction: ->
        @activeSelection = null
        for plugin in @plugins
            plugin.stopInteraction()

    ###*
    * @ngdoc method
    * @name wh.timeline.selection.SelectionAreaManager#setup
    *
    * @description configures current SelectionAreaManager, attach DOM events and handlers,
    * notify listeners, define a way of processing events, move the selections, and so on.
    * This method is responsible for configuring all selection-related logic
    ###
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

###*
* @ngdoc service
* @name wh.timeline.selection.plugin.StickySelectionPlugin
*
* @description Attaches sticky selection handlers
###
class StickySelectionPlugin

    constructor: (@chartManager, options={}) ->
        @interactionStopped = false
        @options = $.extend(true, {
            onUpdate:       $.noop()
        }, options)

    init: (@selectionAreaManager) ->
        @selectionAreaManager.plugins.push @
        @selectionAreaManager.listeners.afterSelectionStart.push   @afterSelectionStart.bind(@)
        @selectionAreaManager.listeners.afterSelectionChange.push  @afterSelectionChange.bind(@)

    stopInteraction: ->
        @interactionStopped = true

    afterSelectionStart: (event) ->
        @sumDelta = 0
        unless event.activeSelection.subState
            event.activeSelection.subState = "moveRightBound"

    afterSelectionChange: (event) ->
        if @interactionStopped
            @interactionStopped = false
            return
        return unless event.activeSelection.isClicked
        return unless @selectionAreaManager.options.isPeriod

        # Prevent moving pane
        event.stopPropagation()

        currentDelta = event.event.selection.atomicDelta.x
        @sumDelta   += currentDelta

        viewportOverlayWidth = @chartManager.viewModel.viewportOverlay.width

        mover = @selectionAreaManager.options.mover
        mover.setup event.activeSelection, viewportOverlayWidth

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
        date = @chartManager.xToDate(left - @chartManager.viewModel.paneLeft)
        siblings = @chartManager.getMainActiveChart().view.findSurroundingTicks(date).map(
            (x) => @chartManager.dateToX(x) + @chartManager.viewModel.paneLeft
        )
        siblings[0] = Math.max(siblings[0], 0)
        siblings[1] = Math.min(siblings[1], @chartManager.viewModel.viewportOverlay.width)

        return siblings

    computeClosestTickX: (left) ->
        siblings = @computeSurroundingTicksX(left)

        distance0 = Math.abs(siblings[0]-left)
        distance1 = Math.abs(siblings[1]-left)

        return if distance0 < distance1 then siblings[0] else siblings[1]

###*
* @ngdoc service
* @name wh.timeline.selection.plugin.ChartPanePlugin
*
* @description Allows scrolling chart pane when there is an overflow
###
class ChartPanePlugin

    constructor: (@chartManager, options={}) ->
        @inProgress = false
        @overflow = 0

        @options = $.extend(true, {
            pane:           @chartManager.viewModel.pane,
            onUpdate:       $.noop()
        }, options)

    init: (@selectionAreaManager) ->
        @selectionAreaManager.plugins.push @
        @selectionAreaManager.listeners.afterSelectionStart.push  @afterSelectionStart.bind(@)
        @selectionAreaManager.listeners.afterSelectionChange.push @afterSelectionChange.bind(@)
        @selectionAreaManager.listeners.afterSelectionFinish.push @afterSelectionFinish.bind(@)

    animatePane: (activeSelection) ->
        if @overflow
            # variables initialization
            @inProgress = true

            deltaPx = @overflow * 5
            treshold =  @chartManager.viewModel.viewportOverlay.width * 3/5
            viewportOverlayWidth = @chartManager.viewModel.viewportOverlay.width

            initialSelectionWidth = activeSelection.width # sel.width()
            initialSelectionLeft  = activeSelection.left  # sel.position().left

            viewport = @options.pane
            paneLeft = @chartManager.viewModel.paneLeft # viewport.position().left
            viewportWidth = viewport.width()

            # If we are close to rendered boundaries let's re-render the chart
            if deltaPx < 0
                deltaPx = Math.max(deltaPx, -treshold)
                if paneLeft > deltaPx
                    @onCloseToBoundary(true)
            else
                deltaPx = Math.min(deltaPx, treshold)
                if paneLeft - deltaPx < -@chartManager.computeRenderOptions([]).renderWidth + @chartManager.viewModel.viewportOverlay.width
                    @onCloseToBoundary(false)

            paneLeft = @chartManager.viewModel.paneLeft # refresh

            # Move viewport and possibly extend selection
            beforeStep = $.noop
            if activeSelection.state == "compose"
                mover = @selectionAreaManager.options.mover
                mover.setup(activeSelection, viewportOverlayWidth)

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
                    return if @interactionStopped
                    stepDeltaPx = Math.round(progress * deltaPx + 0.00001)
                    beforeStep(Math.abs(stepDeltaPx))
                    newpaneLeft = Math.ceil(paneLeft - stepDeltaPx)
                    @chartManager.viewModel.paneLeft = newpaneLeft
                    @options.onUpdate({
                        selection:       activeSelection
                        viewportBounds:  {
                            left:  -newpaneLeft
                            right: -newpaneLeft + viewportOverlayWidth
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
            @options.pane.stop()
        @chartManager.suppressRendering(true)
        @animatePane(event.activeSelection)

    afterSelectionFinish: (event) ->
        @options.pane.stop()

    onCloseToBoundary: (isLeftBoundary) ->
        renderOptions = @chartManager.computeRenderOptions([])

        viewportOverlayWidth = @chartManager.viewModel.viewportOverlay.width
        left = @options.pane.position().left

        @options.pane.stop()

        @options.onUpdate({
            type: "onCloseToBoundary"
            viewportBounds:  {
                left:  -left
                right: -left + viewportOverlayWidth
            },
            forceUpdate: true
        })


angular
    .module('wh.timeline')
    .factory('wh.timeline.selection.plugin.ChartPanePlugin', -> ChartPanePlugin)
    .factory('wh.timeline.selection.plugin.StickySelectionPlugin', -> StickySelectionPlugin)
    .factory('wh.timeline.selection.strategy.SingleSelectionAreaManagementStrategy', -> SingleSelectionAreaManagementStrategy)
    .factory('wh.timeline.selection.nodeResolver.SingleSelectionAreaNodeResolver', -> SingleSelectionAreaNodeResolver)

    .factory('wh.timeline.selection.mover.SelectionAreaMover',  -> SelectionAreaMover)
    .factory('wh.timeline.selection.mover.SelectionPointMover', -> SelectionPointMover)

    .factory('wh.timeline.selection.SelectionArea', -> SelectionArea)
    .factory('wh.timeline.selection.SelectionAreaManager', -> SelectionAreaManager)
