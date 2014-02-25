'use strict';
(function () {

    describe('wh:timeline TimeInterval', function () {

        var $injector;

        beforeEach(module('wh.timeline'));
        beforeEach(inject(function(_$injector_) { $injector = _$injector_ }));

        it('should return sane values', function () {
            var TimeInterval = $injector.get('wh.timeline.utils.TimeInterval')

            // Js timestamps
            var interval1 = new TimeInterval(1385856000000, 1388849426000); // December 1, 2013, midnight - January 4, 2013, 15:30:26
            expect(interval1.start).toBe(1385856000000)
            expect(interval1.end).toBe(1388849426000)

            expect(interval1.startUnix).toBe(1385856000)
            expect(interval1.endUnix).toBe(1388849426)

            expect(interval1.startDate.getTime()).toBe(1385856000000)
            expect(interval1.endDate.getTime()).toBe(1388849426000)

            // Unix timestamps
            var interval1 = new TimeInterval(1385856000, 1388849426, true); // December 1, 2013, midnight - January 4, 2013, 15:30:26
            expect(interval1.start).toBe(1385856000000)
            expect(interval1.end).toBe(1388849426000)

            expect(interval1.startUnix).toBe(1385856000)
            expect(interval1.endUnix).toBe(1388849426)

            expect(interval1.startDate.getTime()).toBe(1385856000000)
            expect(interval1.endDate.getTime()).toBe(1388849426000)
        });

    });

    describe('wh:timeline Selection', function () {

        var $injector;

        beforeEach(module('wh.timeline'));
        beforeEach(inject(function(_$injector_) { $injector = _$injector_ }));

        it('SelectionAreaMover.move() should handle simple cases properly', function () {
            var SelectionArea      = $injector.get('wh.timeline.selection.SelectionArea');
            var SelectionAreaMover = $injector.get('wh.timeline.selection.mover.SelectionAreaMover');

            var area = new SelectionArea(20, 50);
            var mover = new SelectionAreaMover();

            expect(area.left).toBe(20)
            expect(area.width).toBe(50)
            expect(area.right).toBe(70)

            mover.setup(area, 800);

            expect(mover.getLeftMargin()).toBe(20)
            expect(mover.getRightMargin()).toBe(730)

            mover.move(10);
            expect(area.left).toBe(30)
            expect(area.width).toBe(50)
            expect(area.right).toBe(80)

            expect(mover.getLeftMargin()).toBe(30)
            expect(mover.getRightMargin()).toBe(720)

            mover.move(10);
            expect(area.left).toBe(40)
            expect(area.width).toBe(50)
            expect(area.right).toBe(90)

            expect(mover.getLeftMargin()).toBe(40)
            expect(mover.getRightMargin()).toBe(710)

            mover.move(-10);
            expect(area.left).toBe(30)
            expect(area.width).toBe(50)
            expect(area.right).toBe(80)

            expect(mover.getLeftMargin()).toBe(30)
            expect(mover.getRightMargin()).toBe(720)

            mover.move(-10);

            expect(area.left).toBe(20)
            expect(area.width).toBe(50)
            expect(area.right).toBe(70)
        });

        it('SelectionAreaMover.move() should handle edge cases properly', function () {
            var SelectionArea      = $injector.get('wh.timeline.selection.SelectionArea');
            var SelectionAreaMover = $injector.get('wh.timeline.selection.mover.SelectionAreaMover');

            var area = new SelectionArea(20, 50);
            var mover = new SelectionAreaMover();

            mover.setup(area, 800);

            mover.move(1000);

            expect(area.left).toBe(750)
            expect(area.width).toBe(50)
            expect(area.right).toBe(800)
            expect(mover.getLeftMargin()).toBe(750)
            expect(mover.getRightMargin()).toBe(0)

            mover.move(-1000);

            expect(area.left).toBe(0)
            expect(area.width).toBe(50)
            expect(area.right).toBe(50)
            expect(mover.getLeftMargin()).toBe(0)
            expect(mover.getRightMargin()).toBe(750)
        });

        it('SelectionAreaMover.moveLeftBound() should handle simple cases properly', function () {
            var SelectionArea      = $injector.get('wh.timeline.selection.SelectionArea');
            var SelectionAreaMover = $injector.get('wh.timeline.selection.mover.SelectionAreaMover');

            var area = new SelectionArea(20, 50);
            var mover = new SelectionAreaMover();

            mover.setup(area, 800);

            mover.moveLeftBound(-10);

            expect(area.left).toBe(10);
            expect(area.width).toBe(60);
            expect(area.right).toBe(70);
            expect(mover.getLeftMargin()).toBe(10);
            expect(mover.getRightMargin()).toBe(730);

            mover.moveLeftBound(-10);

            expect(area.left).toBe(0);
            expect(area.width).toBe(70);
            expect(area.right).toBe(70);
            expect(mover.getLeftMargin()).toBe(0);
            expect(mover.getRightMargin()).toBe(730)

            mover.moveLeftBound(0);

            expect(area.left).toBe(0);
            expect(area.width).toBe(70);
            expect(area.right).toBe(70);
            expect(mover.getLeftMargin()).toBe(0);
            expect(mover.getRightMargin()).toBe(730)

            mover.moveLeftBound(10);

            expect(area.left).toBe(10);
            expect(area.width).toBe(60);
            expect(area.right).toBe(70);
            expect(mover.getLeftMargin()).toBe(10);
            expect(mover.getRightMargin()).toBe(730);
        });

        it('SelectionAreaMover.moveLeftBound() should handle edge cases properly', function () {
            var SelectionArea      = $injector.get('wh.timeline.selection.SelectionArea');
            var SelectionAreaMover = $injector.get('wh.timeline.selection.mover.SelectionAreaMover');

            var area = new SelectionArea(20, 50);
            var mover = new SelectionAreaMover();

            mover.setup(area, 800);

            mover.moveLeftBound(-100);

            expect(area.left).toBe(0);
            expect(area.width).toBe(70);
            expect(area.right).toBe(70);
            expect(mover.getLeftMargin()).toBe(0);
            expect(mover.getRightMargin()).toBe(730);

            mover.moveLeftBound(200);

            expect(area.left).toBe(69);
            expect(area.width).toBe(1);
            expect(area.right).toBe(70);
            expect(mover.getLeftMargin()).toBe(69);
            expect(mover.getRightMargin()).toBe(730);
        });


        it('SelectionAreaMover.moveRightBound() should handle simple cases properly', function () {
            var SelectionArea      = $injector.get('wh.timeline.selection.SelectionArea');
            var SelectionAreaMover = $injector.get('wh.timeline.selection.mover.SelectionAreaMover');

            var area = new SelectionArea(20, 50);
            var mover = new SelectionAreaMover();

            mover.setup(area, 800);

            mover.moveRightBound(-10);

            expect(area.left).toBe(20);
            expect(area.width).toBe(40);
            expect(area.right).toBe(60);
            expect(mover.getLeftMargin()).toBe(20);
            expect(mover.getRightMargin()).toBe(740);

            mover.moveRightBound(-10);

            expect(area.left).toBe(20);
            expect(area.width).toBe(30);
            expect(area.right).toBe(50);
            expect(mover.getLeftMargin()).toBe(20);
            expect(mover.getRightMargin()).toBe(750)

            mover.moveRightBound(0);

            expect(area.left).toBe(20);
            expect(area.width).toBe(30);
            expect(area.right).toBe(50);
            expect(mover.getLeftMargin()).toBe(20);
            expect(mover.getRightMargin()).toBe(750)

            mover.moveRightBound(10);

            expect(area.left).toBe(20);
            expect(area.width).toBe(40);
            expect(area.right).toBe(60);
            expect(mover.getLeftMargin()).toBe(20);
            expect(mover.getRightMargin()).toBe(740);
        });

        it('SelectionAreaMover.moveRightBound() should handle edge cases properly', function () {
            var SelectionArea      = $injector.get('wh.timeline.selection.SelectionArea');
            var SelectionAreaMover = $injector.get('wh.timeline.selection.mover.SelectionAreaMover');

            var area = new SelectionArea(20, 50);
            var mover = new SelectionAreaMover();

            mover.setup(area, 800);

            mover.moveRightBound(1000);

            expect(area.left).toBe(20);
            expect(area.width).toBe(780);
            expect(area.right).toBe(800);
            expect(mover.getLeftMargin()).toBe(20);
            expect(mover.getRightMargin()).toBe(0);

            mover.moveRightBound(-1000);

            expect(area.left).toBe(20);
            expect(area.width).toBe(1);
            expect(area.right).toBe(21);
            expect(mover.getLeftMargin()).toBe(20);
            expect(mover.getRightMargin()).toBe(779);
        });

        it('SelectionAreaMover.compose() should handle all cases properly', function () {
            var SelectionArea      = $injector.get('wh.timeline.selection.SelectionArea');
            var SelectionAreaMover = $injector.get('wh.timeline.selection.mover.SelectionAreaMover');

            var area = new SelectionArea(20, 50);
            var mover = new SelectionAreaMover();
            area.subState = "moveRightBound"

            mover.setup(area, 800);

            mover.compose(10);

            expect(area.left).toBe(20);
            expect(area.width).toBe(60);
            expect(area.right).toBe(80);
            expect(mover.getLeftMargin()).toBe(20);
            expect(mover.getRightMargin()).toBe(720);

            mover.compose(10);

            expect(area.left).toBe(20);
            expect(area.width).toBe(70);
            expect(area.right).toBe(90);
            expect(mover.getLeftMargin()).toBe(20);
            expect(mover.getRightMargin()).toBe(710);

            mover.compose(1000);

            expect(area.left).toBe(20);
            expect(area.width).toBe(780);
            expect(area.right).toBe(800);
            expect(mover.getLeftMargin()).toBe(20);
            expect(mover.getRightMargin()).toBe(0);

            mover.compose(-800);
            mover.compose(-500);

            expect(area.left).toBe(0);
            expect(area.width).toBe(21);
            expect(area.right).toBe(21);
            expect(mover.getLeftMargin()).toBe(0);
            expect(mover.getRightMargin()).toBe(779);

            mover.compose(20);

            expect(area.left).toBe(20);
            expect(area.width).toBe(1);
            expect(area.right).toBe(21);
            expect(mover.getLeftMargin()).toBe(20);
            expect(mover.getRightMargin()).toBe(779);
        });

        it('SelectionAreaMover.handleOverflowMove() should calculate appropriate overflow values for left edge', function () {
            var SelectionArea      = $injector.get('wh.timeline.selection.SelectionArea');
            var SelectionAreaMover = $injector.get('wh.timeline.selection.mover.SelectionAreaMover');

            var mover = new SelectionAreaMover();

            var area = new SelectionArea(0, 50);
            mover.setup(area, 800);

            // separated tests:
            expect(mover.handleOverflowMove({left: 20, right: 70}, 10)).toBe(0)
            expect(mover.handleOverflowMove({left: 20, right: 70}, 100)).toBe(0)
            expect(mover.handleOverflowMove({left: 20, right: 70}, -1)).toBe(-1)

            expect(mover.handleOverflowMove({left: 20, right: 70}, -10)).toBe(-11)
            area.overflow = 0;
            expect(mover.handleOverflowMove({left: -20, right: 70}, -10)).toBe(-20)
            area.overflow = 0;
            expect(mover.handleOverflowMove({left: 20, right: 70}, -20)).toBe(-20)
            area.overflow = 0;
            expect(mover.handleOverflowMove({left: -20, right: 70}, -20)).toBe(-20)
            area.overflow = 0;
            expect(mover.handleOverflowMove({left: 20, right: 70}, -21)).toBe(-21)
            area.overflow = 0;
            expect(mover.handleOverflowMove({left: -20, right: 70}, -21)).toBe(-21)
            area.overflow = 0;
            expect(mover.handleOverflowMove({left: 20, right: 70}, -28)).toBe(-28)
            area.overflow = 0;
            expect(mover.handleOverflowMove({left: -20, right: 70}, -28)).toBe(-28)
            area.overflow = 0;

            // combined tests:
            expect(mover.handleOverflowMove({left: 20, right: 70}, -10)).toBe(-10)
            expect(mover.handleOverflowMove({left: 20, right: 70}, -20)).toBe(-30)
            expect(mover.handleOverflowMove({left: 20, right: 70}, -21)).toBe(-51)
            expect(mover.handleOverflowMove({left: 20, right: 70}, -28)).toBe(-79)
            area.overflow = 0;

            expect(mover.handleOverflowMove({left: -20, right: 70}, -10)).toBe(-20)
            expect(mover.handleOverflowMove({left: -30, right: 70}, -20)).toBe(-40)
            expect(mover.handleOverflowMove({left: -20, right: 70}, -21)).toBe(-61)
            expect(mover.handleOverflowMove({left: 10, right: 70}, -28)).toBe(-89)
            expect(mover.handleOverflowMove({left: -145, right: 70}, -28)).toBe(-145)
            area.overflow = 0;

            area = new SelectionArea(30, 50);
            mover.setup(area, 800);

            // separated tests:
            expect(mover.handleOverflowMove({left: 20, right: 70}, -1)).toBe(0)

            expect(mover.handleOverflowMove({left: 20, right: 70}, -10)).toBe(0)
            expect(mover.handleOverflowMove({left: -20, right: 70}, -10)).toBe(0)
            expect(mover.handleOverflowMove({left: 20, right: 70}, -20)).toBe(0)
            expect(mover.handleOverflowMove({left: -20, right: 70}, -20)).toBe(0)
            expect(mover.handleOverflowMove({left: 20, right: 70}, -21)).toBe(0)
            expect(mover.handleOverflowMove({left: -20, right: 70}, -21)).toBe(0)
            expect(mover.handleOverflowMove({left: 20, right: 70}, -28)).toBe(0)
            expect(mover.handleOverflowMove({left: -20, right: 70}, -28)).toBe(0)
            expect(mover.handleOverflowMove({left: 20, right: 70}, -10)).toBe(0)
            expect(mover.handleOverflowMove({left: 20, right: 70}, -20)).toBe(0)
            expect(mover.handleOverflowMove({left: 20, right: 70}, -21)).toBe(0)
            expect(mover.handleOverflowMove({left: 20, right: 70}, -28)).toBe(0)
            expect(mover.handleOverflowMove({left: 20, right: 70}, 10)).toBe(0)
            expect(mover.handleOverflowMove({left: 20, right: 70}, 100)).toBe(0)
            expect(mover.handleOverflowMove({left: -20, right: 70}, -10)).toBe(0)
            expect(mover.handleOverflowMove({left: -30, right: 70}, -20)).toBe(0)
            expect(mover.handleOverflowMove({left: -20, right: 70}, -21)).toBe(0)
            expect(mover.handleOverflowMove({left: 10, right: 70}, -28)).toBe(0)
            expect(mover.handleOverflowMove({left: -145, right: 70}, -28)).toBe(0)
        });

        it('SelectionAreaMover.handleOverflowMove() should calculate appropriate overflow values for right edge', function () {
            var SelectionArea      = $injector.get('wh.timeline.selection.SelectionArea');
            var SelectionAreaMover = $injector.get('wh.timeline.selection.mover.SelectionAreaMover');

            var mover = new SelectionAreaMover();

            var area = new SelectionArea(750, 50);
            mover.setup(area, 800);

            // separated tests:
            expect(mover.handleOverflowMove({left: 750, right: 780}, -10)).toBe(0)
            expect(mover.handleOverflowMove({left: 750, right: 780}, -100)).toBe(0)
            expect(mover.handleOverflowMove({left: 750, right: 780}, 1)).toBe(1)
            expect(mover.handleOverflowMove({left: 750, right: 780}, 10)).toBe(11)

            area.overflow = 0;
            expect(mover.handleOverflowMove({left: 750, right: 820}, 10)).toBe(20)

            area.overflow = 0;
            expect(mover.handleOverflowMove({left: 750, right: 800}, 20)).toBe(20)

            area.overflow = 0;
            expect(mover.handleOverflowMove({left: 750, right: 800}, 21)).toBe(21)

            area.overflow = 0;
            expect(mover.handleOverflowMove({left: 750, right: 820}, 21)).toBe(21)

            area.overflow = 0;
            expect(mover.handleOverflowMove({left: 750, right: 822}, 21)).toBe(22)

            area.overflow = 0;
            expect(mover.handleOverflowMove({left: 750, right: 780}, 28)).toBe(28)

            area.overflow = 0;
            expect(mover.handleOverflowMove({left: 750, right: 820}, 28)).toBe(28)

            area.overflow = 0;

            // combined tests:
            expect(mover.handleOverflowMove({left: 750, right: 780}, 10)).toBe(10)
            expect(mover.handleOverflowMove({left: 750, right: 780}, 20)).toBe(30)
            expect(mover.handleOverflowMove({left: 750, right: 780}, 21)).toBe(51)
            expect(mover.handleOverflowMove({left: 750, right: 780}, 28)).toBe(79)

            area.overflow = 0;

            expect(mover.handleOverflowMove({left: 750, right: 820}, 10)).toBe(20)
            expect(mover.handleOverflowMove({left: 750, right: 830}, 28)).toBe(48)
            expect(mover.handleOverflowMove({left: 750, right: 820}, 21)).toBe(69)
            expect(mover.handleOverflowMove({left: 750, right: 790}, 21)).toBe(90)
            expect(mover.handleOverflowMove({left: 750, right: 945}, 21)).toBe(145)

            area.overflow = 0;

            area = new SelectionArea(750, 20);
            mover.setup(area, 800);

            // separated tests:
            expect(mover.handleOverflowMove({left: 750, right: 780}, 1)).toBe(0)

            expect(mover.handleOverflowMove({left: 750, right: 780}, 10)).toBe(0)
            expect(mover.handleOverflowMove({left: 750, right: 820}, 10)).toBe(0)
            expect(mover.handleOverflowMove({left: 750, right: 780}, 20)).toBe(0)
            expect(mover.handleOverflowMove({left: 750, right: 820}, 20)).toBe(0)
            expect(mover.handleOverflowMove({left: 750, right: 780}, 21)).toBe(0)
            expect(mover.handleOverflowMove({left: 750, right: 820}, 1)).toBe(0)
            expect(mover.handleOverflowMove({left: 750, right: 780}, 28)).toBe(0)
            expect(mover.handleOverflowMove({left: 750, right: 820}, 28)).toBe(0)
            expect(mover.handleOverflowMove({left: 750, right: 780}, 10)).toBe(0)
            expect(mover.handleOverflowMove({left: 750, right: 780}, 20)).toBe(0)
            expect(mover.handleOverflowMove({left: 750, right: 780}, 21)).toBe(0)
            expect(mover.handleOverflowMove({left: 750, right: 780}, 28)).toBe(0)
            expect(mover.handleOverflowMove({left: 750, right: 820}, 10)).toBe(0)
            expect(mover.handleOverflowMove({left: 750, right: 830}, 20)).toBe(0)
            expect(mover.handleOverflowMove({left: 750, right: 820}, 21)).toBe(0)
            expect(mover.handleOverflowMove({left: 750, right: 790}, 28)).toBe(0)
            expect(mover.handleOverflowMove({left: 750, right: 845}, 28)).toBe(0)
        });

    });

})();


