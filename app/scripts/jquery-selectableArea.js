(function() {
  var SelectableAreaPlugin;

  SelectableAreaPlugin = (function() {
    function SelectableAreaPlugin(pane, options) {
      this.pane = pane;
      if (options == null) {
        options = {};
      }
      this.model = {
        isActive: false,
        initial: {
          x: null,
          y: null,
          pageX: null,
          pageY: null,
          element: null
        },
        current: {
          x: null,
          y: null,
          pageX: null,
          pageY: null,
          element: null
        }
      };
      this.options = $.extend({}, {
        strictBounds: false
      }, options);
      this.bindModel();
      this.bindEvents();
    }

    SelectableAreaPlugin.prototype.updateModel = function() {
      var maxX, maxY, minX, minY, overflow, paneWidth;
      minX = Math.min(this.model.initial.x, this.model.current.x);
      maxX = Math.max(this.model.initial.x, this.model.current.x);
      minY = Math.min(this.model.initial.y, this.model.current.y);
      maxY = Math.max(this.model.initial.y, this.model.current.y);
      overflow = false;
      paneWidth = this.pane.width();
      if (this.options.strictBounds) {
        minX = Math.max(minX, 0);
        maxX = Math.min(maxX, paneWidth);
        minY = Math.max(minY, 0);
        maxY = Math.min(maxY, this.pane.height());
      } else {
        if (this.model.current.x < 0) {
          overflow = this.model.current.x;
        } else if (this.model.current.x > paneWidth) {
          overflow = this.model.current.x - paneWidth;
        }
      }
      return $.extend(this.model, {
        overflow: overflow,
        atomicDelta: {
          x: this.model.current.deltaX,
          y: this.model.current.deltaY
        },
        bounds: {
          top: minY,
          left: minX,
          bottom: maxY,
          right: maxX
        },
        dimensions: {
          width: maxX - minX,
          height: maxY - minY
        },
        delta: {
          x: this.model.current.x - this.model.initial.x,
          y: this.model.current.y - this.model.initial.y
        }
      });
    };

    SelectableAreaPlugin.prototype.bindModel = function() {
      return this.pane.data("selectableArea", this.model);
    };

    SelectableAreaPlugin.prototype.bindEvents = function() {
      var changed, finish,
        _this = this;
      finish = function(e) {
        var filteredEvent;
        $.extend(_this.model.current, _this.normalizeEvent(e));
        _this.updateModel();
        filteredEvent = _this.emitEvent("areaSelectionFinish", e, {
          keepActive: false
        });
        if (!filteredEvent.keepActive) {
          _this.model.isActive = false;
        }
        return true;
      };
      changed = false;
      this.pane.on('mousedown', function(e) {
        var data;
        if (e.which !== 1) {
          if (_this.model.isActive) {
            finish(e);
          }
          return;
        }
        if (_this.model.isActive) {
          return true;
        }
        changed = false;
        e.preventDefault();
        e.originalEvent.preventDefault();
        _this.model.isActive = true;
        data = _this.normalizeEvent(e);
        $.extend(_this.model.initial, $.extend(true, {}, data));
        $.extend(_this.model.current, $.extend(true, {}, data));
        _this.updateModel();
        _this.emitEvent("areaSelectionStart", e);
        return true;
      });
      $(document).on('mouseup', function(e) {
        if (!_this.model.isActive) {
          return true;
        }
        e.preventDefault();
        e.originalEvent.preventDefault();
        finish(e);
        return true;
      });
      return $(document).on('mousemove', function(e) {
        if (!_this.model.isActive) {
          return true;
        }
        changed = true;
        e.preventDefault();
        e.originalEvent.preventDefault();
        $.extend(_this.model.current, _this.normalizeEvent(e));
        _this.updateModel();
        _this.emitEvent("areaSelectionChange", e);
        return true;
      });
    };

    SelectableAreaPlugin.prototype.emitEvent = function(eventName, originalEvent, params) {
      var event;
      if (params == null) {
        params = {};
      }
      event = jQuery.Event(eventName);
      event.selection = this.model;
      event.originalEvent = originalEvent;
      $.extend(event, params);
      this.pane.trigger(event);
      return event;
    };

    SelectableAreaPlugin.prototype.normalizeEvent = function(e) {
      var offset;
      offset = this.pane.offset();
      return {
        x: e.pageX - offset.left,
        y: e.pageY - offset.top,
        deltaX: e.pageX - this.model.current.pageX,
        deltaY: e.pageY - this.model.current.pageY,
        pageX: e.pageX,
        pageY: e.pageY,
        element: e.target
      };
    };

    return SelectableAreaPlugin;

  })();

  $.fn.selectableArea = function(options) {
    var $this;
    $this = $(this);
    if (!$this.data('selectableArea')) {
      $this.data('selectableArea', new SelectableAreaPlugin($this, options));
    }
    return $this.data('selectableArea');
  };

}).call(this);

/*
//@ sourceMappingURL=jquery-selectableArea.js.map
*/