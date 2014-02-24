###*
  * @ngdoc service wh.timeline.utils.TimeInterval
  * @param {integer} __start start timestamp in milliseconds
  * @param {integer} __end   end timestamp in milliseconds
  * @param {bool} isUnix     if true, then above arguments should be specified as unix timestamps
  * @description Immutable time interval
###
class TimeInterval
    __start: null
    __end:   null

    constructor: (@__start, @__end, isUnix=false) ->
        if isUnix
            @__start *= 1000
            @__end *= 1000

    milliseconds: -> @__end - @__start
    seconds:      -> @endUnix - @startUnix

    Object.defineProperty @prototype, 'startUnix', { get: -> @__start/1000 } # @TODO: ???
    Object.defineProperty @prototype, 'endUnix',   { get: -> @__end/1000   }

    Object.defineProperty @prototype, 'startJs', { get: -> @__start }
    Object.defineProperty @prototype, 'endJs',   { get: -> @__end   }

    Object.defineProperty @prototype, 'start', { get: -> @__start }
    Object.defineProperty @prototype, 'end',   { get: -> @__end   }

    Object.defineProperty @prototype, 'startDate', { get: -> new Date(@__start) }
    Object.defineProperty @prototype, 'endDate',   { get: -> new Date(@__end) }

angular
    .module('wh.timeline')
    .factory('wh.timeline.utils.TimeInterval', -> TimeInterval)


