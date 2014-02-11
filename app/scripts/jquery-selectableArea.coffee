
class SelectableAreaPlugin

    constructor: (@pane, options={}) ->
        @model = {
            isActive: false

            initial: {
                x: null
                y: null

                pageX: null
                pageY: null

                element: null
            },

            current: {
                x: null
                y: null

                pageX: null
                pageY: null

                element: null
            }
        }

        @options = $.extend({}, {
            strictBounds: false
        }, options)
        @bindModel()
        @bindEvents()

    # @TODO: consider accessors
    updateModel: ->
        minX = Math.min(@model.initial.x, @model.current.x)
        maxX = Math.max(@model.initial.x, @model.current.x)

        minY = Math.min(@model.initial.y, @model.current.y)
        maxY = Math.max(@model.initial.y, @model.current.y)

        overflow = false

        paneWidth = @pane.width()
        if @options.strictBounds
            minX = Math.max(minX, 0)
            maxX = Math.min(maxX, paneWidth)

            minY = Math.max(minY, 0)
            maxY = Math.min(maxY, @pane.height())
        else
            if @model.current.x < 0
                overflow = @model.current.x
            else if @model.current.x > paneWidth
                overflow = @model.current.x - paneWidth

        $.extend(@model, {
            overflow: overflow

            atomicDelta: {
                x: @model.current.deltaX,
                y: @model.current.deltaY
            }

            bounds: {
                top:    minY
                left:   minX
                bottom: maxY
                right:  maxX
            }

            dimensions: {
                width:  maxX - minX
                height: maxY - minY
            }

            delta: {
                x: @model.current.x - @model.initial.x
                y: @model.current.y - @model.initial.y
            }
        })

    bindModel: ->
        @pane.data("selectableArea", @model);

    bindEvents: ->
        finish = (e) =>
            $.extend(@model.current, @normalizeEvent(e))

            @updateModel()
            filteredEvent = @emitEvent("areaSelectionFinish", e, { keepActive: false })
            unless filteredEvent.keepActive
                @model.isActive = false

            return true

        changed = false
        @pane.on('mousedown', (e) =>
            if e.which != 1
                if @model.isActive
                    finish(e)
                return

            return true if @model.isActive

            changed = false

            e.preventDefault()
            e.originalEvent.preventDefault()

            @model.isActive  = true
            data = @normalizeEvent(e)
            $.extend(@model.initial, $.extend(true, {}, data))
            $.extend(@model.current, $.extend(true, {}, data))

            @updateModel()
            @emitEvent("areaSelectionStart", e)

            return true
        )

        $(document).on('mouseup', (e) =>
            return true unless @model.isActive

            e.preventDefault()
            e.originalEvent.preventDefault()

            finish(e)

            return true
        )

        $(document).on('mousemove', (e) =>
            return true unless @model.isActive

            changed = true

            e.preventDefault()
            e.originalEvent.preventDefault()

            $.extend(@model.current, @normalizeEvent(e))

            @updateModel()
            @emitEvent("areaSelectionChange", e)

            return true
        )

    emitEvent: (eventName, originalEvent, params={}) ->
        event = jQuery.Event(eventName)
        event.selection = @model
        event.originalEvent = originalEvent
        $.extend(event, params)
        @pane.trigger(event)
        return event

    normalizeEvent: (e) ->
        offset = @pane.offset()
        return {
            x:       e.pageX - offset.left
            y:       e.pageY - offset.top

            deltaX:  e.pageX - @model.current.pageX,
            deltaY:  e.pageY - @model.current.pageY,

            pageX:   e.pageX
            pageY:   e.pageY

            element: e.target
        }

$.fn.selectableArea = (options) ->
    $this = $(@)
    unless $this.data('selectableArea')
        $this.data('selectableArea', new SelectableAreaPlugin($this, options))
    return $this.data('selectableArea')
