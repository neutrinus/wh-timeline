/**
* @ngdoc service
* @name wh.timeline.selection.SelectionArea
*
* @description POJO object holding pixel-wise information about the selection
*/


(function() {
  var ChartPanePlugin, SelectionArea, SelectionAreaManagementDelta, SelectionAreaManagementStrategy, SelectionAreaManager, SelectionAreaMover, SelectionAreaNodeResolver, SelectionPointMover, SingleSelectionAreaManagementStrategy, SingleSelectionAreaNodeResolver, StickySelectionPlugin, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  SelectionArea = (function() {
    function SelectionArea(left, width) {
      this.left = left;
      this.width = width;
      this.state = 'none';
      this.overflow = 0;
    }

    SelectionArea.prototype.equals = function(selection2) {
      return selection2 && this._left === selection2.left && this._width === selection2.width;
    };

    SelectionArea.prototype.calcRight = function() {
      return this.right = this._left + this._width;
    };

    Object.defineProperty(SelectionArea.prototype, "left", {
      set: function(_left) {
        this._left = _left;
        return this.calcRight();
      },
      get: function() {
        return this._left;
      },
      configurable: true
    });

    Object.defineProperty(SelectionArea.prototype, "width", {
      set: function(_width) {
        this._width = _width;
        return this.calcRight();
      },
      get: function() {
        return this._width;
      },
      configurable: true
    });

    return SelectionArea;

  })();

  /**
  * @ngdoc service
  * @name wh.timeline.selection.mover.SelectionAreaMover
  *
  * @description Internal class that performs calculations related to moving a selection area
  */


  SelectionAreaMover = (function() {
    function SelectionAreaMover() {
      this.area = null;
      this.paneWidth = null;
    }

    SelectionAreaMover.prototype.setup = function(area, paneWidth) {
      this.area = area;
      this.paneWidth = paneWidth;
    };

    /**
    * @ngdoc method
    * @name wh.timeline.selection.SelectionAreaMover#handle
    *
    * @param {SelectionArea} area
    * @param {integer} paneWidth
    * @param {event} e event received from SelectableAreaPlugin
    *
    * @description Handles an event received from SelectableAreaPlugin, sets this mover's
    * state, and moves the selection accordingly
    */


    SelectionAreaMover.prototype.handle = function(area, paneWidth, e) {
      var correctedAtomicDelta, overflowBefore;
      this.setup(area, paneWidth);
      overflowBefore = this.area.overflow;
      switch (this.area.state) {
        case "move":
          this.handleOverflowMove(e.selection.bounds, e.selection.atomicDelta.x);
          break;
        case "compose":
        case "resize-left":
        case "resize-right":
          this.handleOverflowCompose(e.selection.overflow);
      }
      correctedAtomicDelta = e.selection.atomicDelta.x;
      if (overflowBefore && !this.area.overflow) {
        correctedAtomicDelta += overflowBefore;
      }
      switch (this.area.state) {
        case "resize-left":
          this.area.subState = "moveLeftBound";
          this.area.state = 'compose';
          this.compose(correctedAtomicDelta);
          break;
        case "resize-right":
          this.area.subState = "moveRightBound";
          this.area.state = 'compose';
          this.compose(correctedAtomicDelta);
          break;
        case "compose":
          this.compose(correctedAtomicDelta);
          break;
        case "move":
          this.move(correctedAtomicDelta);
      }
      return true;
    };

    /**
    * @ngdoc method
    * @name wh.timeline.selection.SelectionAreaMover#getLeftMargin
    *
    * @return {integer} distanve between left edge of the selection and pane's left edge
    */


    SelectionAreaMover.prototype.getLeftMargin = function() {
      return this.area.left;
    };

    /**
    * @ngdoc method
    * @name wh.timeline.selection.SelectionAreaMover#getRightMargin
    *
    * @return {integer} distanve between right edge of the selection and pane's right edge
    */


    SelectionAreaMover.prototype.getRightMargin = function() {
      return this.paneWidth - this.area.width - this.area.left;
    };

    /**
    * @ngdoc method
    * @name wh.timeline.selection.SelectionAreaMover#handleOverflowMove
    *
    * @param {object} bounds  current selection bounds
    * @param {integer} deltaX current mouse movement
    * @description Computes selection overflow in the "move" phase
    * @return {integer} new overflow value
    */


    SelectionAreaMover.prototype.handleOverflowMove = function(bounds, deltaX) {
      if (this.area.left === 0 && !(deltaX > 0 && bounds.left > 0)) {
        this.area.overflow = Math.min(0, this.area.overflow + deltaX, bounds.left);
      } else if (this.area.right >= this.paneWidth && !(deltaX < 0 && bounds.right < this.paneWidth)) {
        this.area.overflow = Math.max(0, this.area.overflow + deltaX, bounds.right - this.paneWidth);
      } else {
        this.area.overflow = 0;
      }
      return this.area.overflow;
    };

    /**
    * @ngdoc method
    * @name wh.timeline.selection.SelectionAreaMover#handleOverflowCompose
    *
    * @param {integer} overflow current overflow
    * @description Computes selection overflow in the "compose" phase
    */


    SelectionAreaMover.prototype.handleOverflowCompose = function(overflow) {
      return this.area.overflow = overflow;
    };

    /**
    * @ngdoc method
    * @name wh.timeline.selection.SelectionAreaMover#compose
    *
    * @param {integer} deltaX current deltaX
    * @description Handles calculations related to composing selection:
    * * deciding which bound is currently moved (left or right)
    * * moving that pane
    */


    SelectionAreaMover.prototype.compose = function(deltaX) {
      var pDeltaX;
      if ((!this.area.subState || this.area.subState === 'moveRightBound') && -deltaX >= this.area.width && this.area.left > 1 && !this.area.overflow) {
        pDeltaX = Math.ceil(-deltaX - this.area.width);
        this.area.left = Math.ceil(this.area.left - pDeltaX);
        this.area.width = pDeltaX + 1;
        return this.area.subState = 'moveLeftBound';
      } else if ((!this.area.subState || this.area.subState === 'moveLeftBound') && deltaX >= this.area.width && this.area.left + this.area.width < this.paneWidth && !this.area.overflow) {
        pDeltaX = Math.ceil(deltaX - this.area.width);
        this.area.left = Math.ceil(this.area.left + this.area.width - 1);
        this.area.width = pDeltaX + 1;
        return this.area.subState = 'moveRightBound';
      } else {
        return this[this.area.subState](deltaX);
      }
    };

    /**
    * @ngdoc method
    * @name wh.timeline.selection.SelectionAreaMover#move
    *
    * @param {integer} x
    * @description moves the current selection by x
    */


    SelectionAreaMover.prototype.move = function(x) {
      var maxX, minX;
      if (this.area.overflow) {
        return;
      }
      minX = this.getLeftMargin() * -1;
      maxX = this.getRightMargin();
      x = Math.min(maxX, x);
      x = Math.max(minX, x);
      return this.area.left = this.area.left + x;
    };

    /**
    * @ngdoc method
    * @name wh.timeline.selection.SelectionAreaMover#moveLeftBound
    *
    * @param {integer} x
    * @description moves left bound by x (right bound stays at the same place)
    */


    SelectionAreaMover.prototype.moveLeftBound = function(x) {
      x = this.calcPossibleLeftBoundMovement(x);
      this.area.left = this.area.left + x;
      this.area.width = this.area.width - x;
      return x;
    };

    /**
    * @ngdoc method
    * @name wh.timeline.selection.SelectionAreaMover#calcPossibleLeftBoundMovement
    *
    * @param {integer} x
    * @param {boolean} considerOverflow
    * @description adjusts x to be valid left bound movement delta in case it isn't
    */


    SelectionAreaMover.prototype.calcPossibleLeftBoundMovement = function(x, considerOverflow) {
      var maxX, minX;
      if (considerOverflow == null) {
        considerOverflow = true;
      }
      if (considerOverflow) {
        if (this.area.overflow < 0 && x > 0) {
          return 0;
        }
        if (this.area.overflow > 0 && this.area.left + this.area.width >= this.paneWidth && x < 0) {
          return 0;
        }
      }
      minX = this.getLeftMargin() * -1;
      maxX = this.area.width - 1;
      x = Math.min(maxX, x);
      x = Math.max(minX, x);
      return Math.ceil(x);
    };

    /**
    * @ngdoc method
    * @name wh.timeline.selection.SelectionAreaMover#moveRightBound
    *
    * @param {integer} x
    * @description moves right bound by x (left bound stays at the same place)
    */


    SelectionAreaMover.prototype.moveRightBound = function(x) {
      x = this.calcPossibleRightBoundMovement(x);
      this.area.width = this.area.width + x;
      return x;
    };

    /**
    * @ngdoc method
    * @name wh.timeline.selection.SelectionAreaMover#calcPossibleRightBoundMovement
    *
    * @param {integer} x
    * @param {boolean} considerOverflow
    * @description adjusts x to be valid right bound movement delta in case it isn't
    */


    SelectionAreaMover.prototype.calcPossibleRightBoundMovement = function(x, considerOverflow) {
      var maxX, minX;
      if (considerOverflow == null) {
        considerOverflow = true;
      }
      if (considerOverflow) {
        if (this.area.overflow > 0 && x < 0) {
          return 0;
        }
        if (this.area.overflow < 0 && this.area.left === 0 && x > 0) {
          return 0;
        }
      }
      minX = this.area.width * -1 + 1;
      maxX = this.getRightMargin();
      x = Math.min(maxX, x);
      x = Math.max(minX, x);
      return x;
    };

    return SelectionAreaMover;

  })();

  /**
  * @ngdoc service
  * @name wh.timeline.selection.mover.SelectionPointMover
  *
  * @description Internal class that performs calculations related to moving a selection point
  */


  SelectionPointMover = (function(_super) {
    __extends(SelectionPointMover, _super);

    function SelectionPointMover() {
      _ref = SelectionPointMover.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    SelectionPointMover.prototype.setup = function(area, paneWidth) {
      SelectionPointMover.__super__.setup.call(this, area, paneWidth);
      return area.width = 1;
    };

    SelectionPointMover.prototype.compose = function(deltaX) {
      var pDeltaX;
      if ((!this.area.subState || this.area.subState === 'moveRightBound') && -deltaX >= this.area.width && this.area.left > 0 && !this.area.overflow) {
        pDeltaX = -deltaX - this.area.width;
        this.area.left = this.area.left - pDeltaX;
        this.area.subState = 'moveLeftBound';
      } else if ((!this.area.subState || this.area.subState === 'moveLeftBound') && deltaX >= this.area.width && this.area.left + this.area.width < this.paneWidth && !this.area.overflow) {
        this.area.left = Math.ceil(this.area.left + this.area.width + deltaX - 2);
        this.area.subState = 'moveRightBound';
      } else {
        this[this.area.subState](deltaX);
      }
      return this.area.width = 1;
    };

    SelectionPointMover.prototype.moveLeftBound = function(x) {
      if (SelectionPointMover.__super__.moveLeftBound.call(this, x)) {
        return this.__proto__.__proto__.moveRightBound.call(this, x);
      }
    };

    SelectionPointMover.prototype.moveRightBound = function(x) {
      if (SelectionPointMover.__super__.moveRightBound.call(this, x)) {
        return this.__proto__.__proto__.moveLeftBound.call(this, x);
      }
    };

    return SelectionPointMover;

  })(SelectionAreaMover);

  /**
  * @ngdoc object
  * @service wh.timeline.selection.nodeResolver.SingleSelectionAreaNodeResolver
  *
  * @description "Abstract" Node Resolver
  */


  SelectionAreaNodeResolver = (function() {
    function SelectionAreaNodeResolver() {}

    /**
    * @ngdoc method
    * @name wh.timeline.selection.SelectionAreaMover#calcPossibleRightBoundMovement
    *
    * @param {event} areaSelectionEvent
    * @description Computes appropriate SelectionArea to modify after areaSelectionEvent was intercepted
    * It will be useful when two or more SelectionAreas are present and they are overlapping
    * @return {SelectionArea}
    */


    SelectionAreaNodeResolver.prototype.resolve = function(areaSelectionEvent) {};

    return SelectionAreaNodeResolver;

  })();

  /**
  * @ngdoc object
  * @name wh.timeline.selection.SingleSelectionAreaNodeResolver
  *
  * @description Simple Node Resolver, always returns clicked selection
  */


  SingleSelectionAreaNodeResolver = (function() {
    function SingleSelectionAreaNodeResolver(options) {
      if (options == null) {
        options = {};
      }
      this.options = $.extend(true, {
        selectionElementSelector: ""
      }, options);
    }

    SingleSelectionAreaNodeResolver.prototype.resolve = function(event) {
      return $(event.originalEvent.target).closest(this.options.selectionElementSelector);
    };

    return SingleSelectionAreaNodeResolver;

  })();

  /**
  * @ngdoc object
  * @name wh.timeline.selection.SelectionAreaManagementStrategy
  *
  * @description "Abstract" management strategy just to expose some interface
  */


  SelectionAreaManagementStrategy = (function() {
    function SelectionAreaManagementStrategy() {}

    /**
    * @ngdoc method
    * @name wh.timeline.selection.SelectionAreaManagementStrategy#resolveAnotherSelection
    *
    * @param {array} managedSelectionAreas
    * @param {event} selectionDetails
    *
    * @description Computes SelectionAreaManagementDelta based on managedSelectionAreas and selectionDetails
    * @return {SelectionAreaManagementDelta}
    */


    SelectionAreaManagementStrategy.prototype.resolveAnotherSelection = function(managedSelectionAreas, selectionDetails) {};

    return SelectionAreaManagementStrategy;

  })();

  /**
  * @ngdoc object
  * @service wh.timeline.selection.strategy.SingleSelectionAreaManagementStrategy
  *
  * @description selection management strategy suited to single selection.
  * It either creates a selection if there is none, or returns existing one.
  */


  SingleSelectionAreaManagementStrategy = (function(_super) {
    __extends(SingleSelectionAreaManagementStrategy, _super);

    function SingleSelectionAreaManagementStrategy(options) {
      if (options == null) {
        options = {};
      }
      this.options = $.extend(true, {
        nodeResolver: null
      }, options);
    }

    SingleSelectionAreaManagementStrategy.prototype.resolveAnotherSelection = function(managedSelectionAreas, event) {
      var droppedSelectionAreas, k, selectionArea, selectionAreaClicked, v;
      selectionAreaClicked = this.options.nodeResolver.resolve(event).length > 0 && managedSelectionAreas.length > 0;
      if (selectionAreaClicked) {
        selectionArea = managedSelectionAreas[0];
        droppedSelectionAreas = [];
      } else {
        selectionArea = new SelectionArea(event.selection.bounds.left, Math.max(event.selection.dimensions.width, 1));
        droppedSelectionAreas = (function() {
          var _i, _len, _results;
          _results = [];
          for (k = _i = 0, _len = managedSelectionAreas.length; _i < _len; k = ++_i) {
            v = managedSelectionAreas[k];
            _results.push(k);
          }
          return _results;
        })();
      }
      return new SelectionAreaManagementDelta(selectionArea, droppedSelectionAreas);
    };

    return SingleSelectionAreaManagementStrategy;

  })(SelectionAreaManagementStrategy);

  /**
  * @ngdoc object
  * @name wh.timeline.selection.SelectionAreaManagementDelta
  *
  * @description Created by SelectionAreaManagementStrategy. It tells SelectionAreaManager
  * what selections should be dropped and what is the currently active one.
  */


  SelectionAreaManagementDelta = (function() {
    SelectionAreaManagementDelta.prototype.activeSelection = null;

    SelectionAreaManagementDelta.prototype.droppedSelectionAreas = null;

    function SelectionAreaManagementDelta(activeSelection, droppedSelectionAreas) {
      this.activeSelection = activeSelection;
      this.droppedSelectionAreas = droppedSelectionAreas;
    }

    return SelectionAreaManagementDelta;

  })();

  /**
  * @ngdoc service
  * @name wh.timeline.selection.SelectionAreaManager
  *
  * @description Manages selections model and view. Updates seletions based on events
  * received from the browser.
  */


  SelectionAreaManager = (function() {
    /**
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
    */

    var createEvent, setup;

    function SelectionAreaManager(pane, options) {
      this.selections = [];
      this.params = {
        initialArea: null,
        pane: {
          width: null
        },
        resize: {
          left: false,
          right: false
        }
      };
      this.plugins = [];
      this.pane = null;
      this.state = "none";
      this.activeSelection = null;
      this.listeners = {
        beforeSelectionChange: [],
        afterSelectionStart: [],
        afterSelectionChange: [],
        afterSelectionFinish: []
      };
      this.pane = pane;
      this.options = $.extend(true, {
        maxSelections: 1,
        strategy: null,
        mover: null,
        isPeriod: true,
        afterSelectionStart: $.noop,
        afterSelectionChange: $.noop,
        afterSelectionFinish: $.noop
      }, options);
      if (!this.options.mover) {
        this.options.mover = this.options.isPeriod ? new SelectionAreaMover() : new SelectionPointMover();
      }
      setup.call(this);
    }

    createEvent = function(props) {
      if (props == null) {
        props = {};
      }
      return $.extend({
        'manager': this
      }, props, {
        defaultPrevented: false,
        preventDefault: function() {
          return this.defaultPrevented = true;
        },
        propagationStopped: false,
        stopPropagation: function() {
          return this.propagationStopped = true;
        }
      });
    };

    SelectionAreaManager.prototype.notifyListeners = function(eventName, data) {
      var event, listener, _i, _len, _ref1;
      if (data == null) {
        data = {};
      }
      event = createEvent(data);
      _ref1 = this.listeners[eventName];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        listener = _ref1[_i];
        listener(event);
        if (event.propagationStopped) {
          break;
        }
      }
      return event;
    };

    SelectionAreaManager.prototype.forceNewInitialState = function(left, width) {
      var pluginModel;
      this.params.initialArea.left = left;
      this.params.initialArea.width = width;
      pluginModel = this.pane.selectableArea().model;
      return pluginModel.x = 0;
    };

    SelectionAreaManager.prototype.stopInteraction = function() {
      var plugin, _i, _len, _ref1, _results;
      this.activeSelection = null;
      _ref1 = this.plugins;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        plugin = _ref1[_i];
        _results.push(plugin.stopInteraction());
      }
      return _results;
    };

    /**
    * @ngdoc method
    * @name wh.timeline.selection.SelectionAreaManager#setup
    *
    * @description configures current SelectionAreaManager, attach DOM events and handlers,
    * notify listeners, define a way of processing events, move the selections, and so on.
    * This method is responsible for configuring all selection-related logic
    */


    setup = function() {
      var changed,
        _this = this;
      this.pane.selectableArea();
      changed = false;
      this.pane.on("areaSelectionStart", function(e) {
        var delta, droppedAreaIndex, event, is_area_new, _i, _len, _ref1;
        delta = _this.options.strategy.resolveAnotherSelection(_this.selections, e);
        changed = false;
        _this.activeSelection = delta.activeSelection;
        _this.activeSelection.isClicked = false;
        if (delta.droppedSelectionAreas) {
          _ref1 = delta.droppedSelectionAreas;
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            droppedAreaIndex = _ref1[_i];
            _this.selections.splice(droppedAreaIndex, 1);
          }
        }
        is_area_new = _this.selections.indexOf(_this.activeSelection) === -1;
        if (is_area_new) {
          _this.selections.push(_this.activeSelection);
        }
        if (is_area_new) {
          _this.activeSelection.state = "compose";
        } else if (_this.params.resize.left) {
          _this.activeSelection.state = "resize-left";
        } else if (_this.params.resize.right) {
          _this.activeSelection.state = "resize-right";
        } else {
          _this.activeSelection.state = "move";
        }
        _this.params.initialArea = $.extend(true, {}, _this.activeSelection);
        _this.params.pane.width = _this.pane.width();
        event = _this.notifyListeners('afterSelectionStart', {
          delta: delta,
          activeSelection: _this.activeSelection
        });
        if (!event.defaultPrevented) {
          return _this.options.afterSelectionStart.call(_this, event);
        }
      });
      this.pane.on("areaSelectionFinish", function(e) {
        var droppedSelectionArea, event;
        if (_this.options.isPeriod && _this.activeSelection && !changed && _this.activeSelection.width === 1) {
          e.keepActive = true;
          return _this.activeSelection.isClicked = true;
        } else {
          droppedSelectionArea = _this.activeSelection;
          if (_this.activeSelection) {
            _this.activeSelection.state = "none";
            _this.activeSelection.overflow = 0;
          }
          _this.activeSelection = null;
          event = _this.notifyListeners('afterSelectionFinish', {
            droppedSelectionArea: droppedSelectionArea
          });
          if (!event.defaultPrevented) {
            return _this.options.afterSelectionFinish.call(_this, event);
          }
        }
      });
      return this.pane.on("areaSelectionChange", function(e) {
        var event, eventData;
        if (!_this.activeSelection) {
          return;
        }
        changed = true;
        eventData = {
          event: e,
          activeSelection: _this.activeSelection
        };
        event = _this.notifyListeners('beforeSelectionChange', eventData);
        if (!event.defaultPrevented) {
          _this.options.mover.handle(_this.activeSelection, _this.params.pane.width, e);
        }
        event = _this.notifyListeners('afterSelectionChange', eventData);
        if (!event.defaultPrevented) {
          return _this.options.afterSelectionChange.call(_this, event);
        }
      });
    };

    SelectionAreaManager.prototype.addPlugin = function(plugin) {
      return plugin.init(this);
    };

    return SelectionAreaManager;

  })();

  /**
  * @ngdoc service
  * @name wh.timeline.selection.plugin.StickySelectionPlugin
  *
  * @description Attaches sticky selection handlers
  */


  StickySelectionPlugin = (function() {
    function StickySelectionPlugin(chartManager, options) {
      this.chartManager = chartManager;
      if (options == null) {
        options = {};
      }
      this.interactionStopped = false;
      this.options = $.extend(true, {
        onUpdate: $.noop()
      }, options);
    }

    StickySelectionPlugin.prototype.init = function(selectionAreaManager) {
      this.selectionAreaManager = selectionAreaManager;
      this.selectionAreaManager.plugins.push(this);
      this.selectionAreaManager.listeners.afterSelectionStart.push(this.afterSelectionStart.bind(this));
      return this.selectionAreaManager.listeners.afterSelectionChange.push(this.afterSelectionChange.bind(this));
    };

    StickySelectionPlugin.prototype.stopInteraction = function() {
      return this.interactionStopped = true;
    };

    StickySelectionPlugin.prototype.afterSelectionStart = function(event) {
      this.sumDelta = 0;
      if (!event.activeSelection.subState) {
        return event.activeSelection.subState = "moveRightBound";
      }
    };

    StickySelectionPlugin.prototype.afterSelectionChange = function(event) {
      var alignedProjection, boundMethod, currentDelta, currentLeft, currentRight, deltaX, mover, oppositeEdge, projection, projectionSiblings, sameHandEdge, viewportOverlayWidth;
      if (this.interactionStopped) {
        this.interactionStopped = false;
        return;
      }
      if (!event.activeSelection.isClicked) {
        return;
      }
      if (!this.selectionAreaManager.options.isPeriod) {
        return;
      }
      event.stopPropagation();
      currentDelta = event.event.selection.atomicDelta.x;
      this.sumDelta += currentDelta;
      viewportOverlayWidth = this.chartManager.viewModel.viewportOverlay.width;
      mover = this.selectionAreaManager.options.mover;
      mover.setup(event.activeSelection, viewportOverlayWidth);
      currentLeft = event.activeSelection.left;
      currentRight = event.activeSelection.right;
      if (event.activeSelection.subState === "moveLeftBound") {
        boundMethod = "moveLeftBound";
        sameHandEdge = currentLeft - 1;
        oppositeEdge = currentRight - 1;
      } else {
        boundMethod = "moveRightBound";
        sameHandEdge = currentRight - 2;
        oppositeEdge = currentLeft - 1;
      }
      projection = oppositeEdge + this.sumDelta;
      projectionSiblings = this.computeSurroundingTicksX(projection);
      alignedProjection = this.computeClosestTickX(projection);
      deltaX = alignedProjection - sameHandEdge;
      return mover[boundMethod](deltaX);
    };

    StickySelectionPlugin.prototype.computeSurroundingTicksX = function(left) {
      var date, siblings,
        _this = this;
      date = this.chartManager.xToDate(left - this.chartManager.viewModel.paneLeft);
      siblings = this.chartManager.getMainActiveChart().view.findSurroundingTicks(date).map(function(x) {
        return _this.chartManager.dateToX(x) + _this.chartManager.viewModel.paneLeft;
      });
      siblings[0] = Math.max(siblings[0], 0);
      siblings[1] = Math.min(siblings[1], this.chartManager.viewModel.viewportOverlay.width);
      return siblings;
    };

    StickySelectionPlugin.prototype.computeClosestTickX = function(left) {
      var distance0, distance1, siblings;
      siblings = this.computeSurroundingTicksX(left);
      distance0 = Math.abs(siblings[0] - left);
      distance1 = Math.abs(siblings[1] - left);
      if (distance0 < distance1) {
        return siblings[0];
      } else {
        return siblings[1];
      }
    };

    return StickySelectionPlugin;

  })();

  /**
  * @ngdoc service
  * @name wh.timeline.selection.plugin.ChartPanePlugin
  *
  * @description Allows scrolling chart pane when there is an overflow
  */


  ChartPanePlugin = (function() {
    function ChartPanePlugin(chartManager, options) {
      this.chartManager = chartManager;
      if (options == null) {
        options = {};
      }
      this.inProgress = false;
      this.overflow = 0;
      this.options = $.extend(true, {
        pane: this.chartManager.viewModel.pane,
        onUpdate: $.noop()
      }, options);
    }

    ChartPanePlugin.prototype.init = function(selectionAreaManager) {
      this.selectionAreaManager = selectionAreaManager;
      this.selectionAreaManager.plugins.push(this);
      this.selectionAreaManager.listeners.afterSelectionStart.push(this.afterSelectionStart.bind(this));
      this.selectionAreaManager.listeners.afterSelectionChange.push(this.afterSelectionChange.bind(this));
      return this.selectionAreaManager.listeners.afterSelectionFinish.push(this.afterSelectionFinish.bind(this));
    };

    ChartPanePlugin.prototype.animatePane = function(activeSelection) {
      var absDeltaPx, beforeStep, deltaPx, initialSelectionLeft, initialSelectionWidth, mover, paneLeft, treshold, viewport, viewportOverlayWidth, viewportWidth,
        _this = this;
      if (this.overflow) {
        this.inProgress = true;
        deltaPx = this.overflow * 5;
        treshold = this.chartManager.viewModel.viewportOverlay.width * 3 / 5;
        viewportOverlayWidth = this.chartManager.viewModel.viewportOverlay.width;
        initialSelectionWidth = activeSelection.width;
        initialSelectionLeft = activeSelection.left;
        viewport = this.options.pane;
        paneLeft = this.chartManager.viewModel.paneLeft;
        viewportWidth = viewport.width();
        if (deltaPx < 0) {
          deltaPx = Math.max(deltaPx, -treshold);
          if (paneLeft > deltaPx) {
            this.onCloseToBoundary(true);
          }
        } else {
          deltaPx = Math.min(deltaPx, treshold);
          if (paneLeft - deltaPx < -this.chartManager.computeRenderOptions([]).renderWidth + this.chartManager.viewModel.viewportOverlay.width) {
            this.onCloseToBoundary(false);
          }
        }
        paneLeft = this.chartManager.viewModel.paneLeft;
        beforeStep = $.noop;
        if (activeSelection.state === "compose") {
          mover = this.selectionAreaManager.options.mover;
          mover.setup(activeSelection, viewportOverlayWidth);
          absDeltaPx = Math.abs(deltaPx);
          if (activeSelection.subState === "moveLeftBound") {
            deltaPx = -this.selectionAreaManager.options.mover.calcPossibleRightBoundMovement(-deltaPx, false);
            beforeStep = function(absStepDeltaPx) {
              return activeSelection.width = initialSelectionWidth + absStepDeltaPx;
            };
          } else {
            deltaPx = -this.selectionAreaManager.options.mover.calcPossibleLeftBoundMovement(-deltaPx, false);
            beforeStep = function(absStepDeltaPx) {
              activeSelection.width = initialSelectionWidth + absStepDeltaPx;
              return activeSelection.left = initialSelectionLeft - absStepDeltaPx;
            };
          }
          if (!this.selectionAreaManager.options.isPeriod) {
            beforeStep = function() {};
          }
        }
        return viewport.animate({
          textIndent: 0
        }, {
          progress: function(animation, progress, remainingMs) {
            var newpaneLeft, stepDeltaPx;
            if (_this.interactionStopped) {
              return;
            }
            stepDeltaPx = Math.round(progress * deltaPx + 0.00001);
            beforeStep(Math.abs(stepDeltaPx));
            newpaneLeft = Math.ceil(paneLeft - stepDeltaPx);
            _this.chartManager.viewModel.paneLeft = newpaneLeft;
            return _this.options.onUpdate({
              selection: activeSelection,
              viewportBounds: {
                left: -newpaneLeft,
                right: -newpaneLeft + viewportOverlayWidth
              }
            });
          },
          easing: 'linear',
          duration: 600,
          complete: function() {
            return _this.animatePane(activeSelection);
          },
          fail: function() {
            return _this.chartManager.suppressRendering(false);
          }
        });
      } else {
        return this.chartManager.suppressRendering(false);
      }
    };

    ChartPanePlugin.prototype.afterSelectionStart = function(event) {
      this.step = null;
      this.selArea = $('.selection-area');
      return this.inProgress = false;
    };

    ChartPanePlugin.prototype.afterSelectionChange = function(event) {
      this.overflow = event.activeSelection.overflow;
      if (this.inProgress) {
        this.options.pane.stop();
      }
      this.chartManager.suppressRendering(true);
      return this.animatePane(event.activeSelection);
    };

    ChartPanePlugin.prototype.afterSelectionFinish = function(event) {
      return this.options.pane.stop();
    };

    ChartPanePlugin.prototype.onCloseToBoundary = function(isLeftBoundary) {
      var left, renderOptions, viewportOverlayWidth;
      renderOptions = this.chartManager.computeRenderOptions([]);
      viewportOverlayWidth = this.chartManager.viewModel.viewportOverlay.width;
      left = this.options.pane.position().left;
      this.options.pane.stop();
      return this.options.onUpdate({
        type: "onCloseToBoundary",
        viewportBounds: {
          left: -left,
          right: -left + viewportOverlayWidth
        },
        forceUpdate: true
      });
    };

    return ChartPanePlugin;

  })();

  angular.module('wh.timeline').factory('wh.timeline.selection.plugin.ChartPanePlugin', function() {
    return ChartPanePlugin;
  }).factory('wh.timeline.selection.plugin.StickySelectionPlugin', function() {
    return StickySelectionPlugin;
  }).factory('wh.timeline.selection.strategy.SingleSelectionAreaManagementStrategy', function() {
    return SingleSelectionAreaManagementStrategy;
  }).factory('wh.timeline.selection.nodeResolver.SingleSelectionAreaNodeResolver', function() {
    return SingleSelectionAreaNodeResolver;
  }).factory('wh.timeline.selection.mover.SelectionAreaMover', function() {
    return SelectionAreaMover;
  }).factory('wh.timeline.selection.mover.SelectionPointMover', function() {
    return SelectionPointMover;
  }).factory('wh.timeline.selection.SelectionArea', function() {
    return SelectionArea;
  }).factory('wh.timeline.selection.SelectionAreaManager', function() {
    return SelectionAreaManager;
  });

}).call(this);

/*
//@ sourceMappingURL=wh-timeline-selection.js.map
*/