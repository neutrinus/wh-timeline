/**
  * @ngdoc service wh.timeline.utils.TimeInterval
  * @param {integer} __start start timestamp in milliseconds
  * @param {integer} __end   end timestamp in milliseconds
  * @param {bool} isUnix     if true, then above arguments should be specified as unix timestamps
  * @description Immutable time interval
*/


(function() {
  var TimeInterval;

  TimeInterval = (function() {
    TimeInterval.prototype.__start = null;

    TimeInterval.prototype.__end = null;

    function TimeInterval(__start, __end, isUnix) {
      this.__start = __start;
      this.__end = __end;
      if (isUnix == null) {
        isUnix = false;
      }
      if (isUnix) {
        this.__start *= 1000;
        this.__end *= 1000;
      }
    }

    TimeInterval.prototype.milliseconds = function() {
      return this.__end - this.__start;
    };

    TimeInterval.prototype.seconds = function() {
      return this.endUnix - this.startUnix;
    };

    Object.defineProperty(TimeInterval.prototype, 'startUnix', {
      get: function() {
        return this.__start / 1000;
      }
    });

    Object.defineProperty(TimeInterval.prototype, 'endUnix', {
      get: function() {
        return this.__end / 1000;
      }
    });

    Object.defineProperty(TimeInterval.prototype, 'startJs', {
      get: function() {
        return this.__start;
      }
    });

    Object.defineProperty(TimeInterval.prototype, 'endJs', {
      get: function() {
        return this.__end;
      }
    });

    Object.defineProperty(TimeInterval.prototype, 'start', {
      get: function() {
        return this.__start;
      }
    });

    Object.defineProperty(TimeInterval.prototype, 'end', {
      get: function() {
        return this.__end;
      }
    });

    Object.defineProperty(TimeInterval.prototype, 'startDate', {
      get: function() {
        return new Date(this.__start);
      }
    });

    Object.defineProperty(TimeInterval.prototype, 'endDate', {
      get: function() {
        return new Date(this.__end);
      }
    });

    return TimeInterval;

  })();

  angular.module('wh.timeline').factory('wh.timeline.utils.TimeInterval', function() {
    return TimeInterval;
  });

}).call(this);

/*
//@ sourceMappingURL=wh-timeline-utils.js.map
*/