
setDefaults({
    weekMode: 'fixed'
});

XDate.prototype.startOfWeek = function() {
    var day = this.getDay();
    if (day == 1) return this;

    if (day == 0) {
        day = 7;
    }
    return this.addDays(1-day);
}


function SpanView(element, calendar, viewName) {
    var t = this;

    // exports
    t.changeGrouping = changeGrouping;
    t.renderSpan = renderSpan;
    t.setHeight = setHeight;
    t.setWidth = setWidth;
    t.renderDayOverlay = renderDayOverlay;
    t.defaultSelectionEnd = defaultSelectionEnd;
    t.renderSelection = renderSelection;
    t.clearSelection = clearSelection;
    t.reportDayClick = reportDayClick; // for selection (kinda hacky)
    t.dragStart = dragStart;
    t.dragStop = dragStop;
    t.defaultEventEnd = defaultEventEnd;
    t.getHoverListener = function() { return hoverListener };
    t.colContentLeft = colContentLeft;
    t.colContentRight = colContentRight;
    t.dayOfWeekCol = dayOfWeekCol;
    t.dateCell = dateCell;
    t.cellDate = cellDate;
    t.cellIsAllDay = function() { return true };
    t.allDayRow = allDayRow;
    t.allDayBounds = allDayBounds;

    t.getStart = function() { return t.xstart; };
    t.getEnd = function() { return t.xend; };

    t.getEventsContainer = function() { return mainDiv; };
    t.getGroupingCurrent = getGroupingCurrent;
    t.getSplitSeqEvents = getSplitSeqEvents;


    // imports
    View.call(t, element, calendar, viewName);
    OverlayManager.call(t);
    SelectionManager.call(t);
    // BasicEventRenderer.call(t);
    SpanEventRenderer.call(t);

    var opt = t.opt;
    var options = t.options;
    var rerenderEvents = t.rerenderEvents;
    var trigger = t.trigger;
    var clearEvents = t.clearEvents;
    var renderOverlay = t.renderOverlay;
    var clearOverlays = t.clearOverlays;
    var daySelectionMousedown = t.daySelectionMousedown;
    var formatDate = calendar.formatDate;


    // locals

    var mainDiv;
    var firstRow;
    var head;
    var headTitle;
    var headCells;

    var body;
    var eventsDiv;
    var bodyRows;
    var bodyCells;
    var bodyFirstCells = $([]);
    var bodyCellTopInners;
    var daySegmentContainer;

    var viewWidth;
    var viewHeight;
    var colWidth;

    var rowCnt, colCnt;
    var coordinateGrid;
    var hoverListener;
    var colContentPositions;

    var rtl, dis, dit;
    var firstDay;
    var nwe;
    var tm;
    var colFormat;

    var currentGrouping = opt('groupCurrent');
    var splitSequentialEvents = opt('splitSequentialEvents');
    /* Rendering
    ------------------------------------------------------------*/


    disableTextSelection(element.addClass('fc-grid'));


    function renderSpan(maxr, r, c, showNumbers) {
        rowCnt = r;
        colCnt = c;

        updateOptions();
        var firstTime = !mainDiv;
        if (firstTime) {
            // buildSkeleton(maxr, showNumbers);
            buildHeaderSkeleton();
        } else {
            clearHeaderSkeleton();
            buildHeaderSkeleton();
            clearEvents();
        }
        //updateEvents(firstTime);
    }



    function updateOptions() {
        rtl = opt('isRTL');
        if (rtl) {
            dis = -1;
            dit = colCnt - 1;
        }else{
            dis = 1;
            dit = 0;
        }
        firstDay = opt('firstDay');
        nwe = opt('weekends') ? 0 : 1;
        tm = opt('theme') ? 'ui' : 'fc';
        colFormat = opt('columnFormat');
    }


    function buildMonthHeader(start, end) {
        var s = '';

        var monthsCnt = Math.round(start.diffMonths(end));
        var scale = 100 / monthsCnt;

        var currScale = 0;
        var _i;

        for (_i = 0; _i < monthsCnt; _i++) {
            var even_odd = _i % 2 == 0 ? 'even' : 'odd';
            s += '<div class="spanScaleMonth ' + even_odd + '" style="left: ' + currScale.toFixed(2) + '%; width: ' + scale.toFixed(2) + '%">';
            currScale += scale;

             s += formatDate(
                 addMonths(start.clone(), _i),
                 'MMMM'
             );

            s += '</div>';
        }
        return s;
    }

    function buildWeeksHeader(start, end) {
        var s = '';

        var start_week = start.clone();
        var end_week = end.clone();
        var weeksChunks = 0;

        var startOffset = 0;
        var endOffset = 0;

        if (start.getDay() != 1) {
            start_week = start.clone().addWeeks(1).startOfWeek();
            weeksChunks += 1;
            startOffset = 7 - start.diffDays(start_week);
        }
        if (end.clone().addDays(-1).getDay() != 0) {
            end_week = end.clone().startOfWeek();
            weeksChunks += 1;
            endOffset = end.diffDays(end.clone().addWeeks(1).startOfWeek());
        }

        weeksChunks += start_week.diffWeeks(end_week);

        var scale = 100 / start.diffWeeks(end);

        var currScale = 0;
        var currWeek = start.getWeek();
        var _i;
        for (_i = 0; _i < weeksChunks; _i++) {
            var even_odd = _i % 2 == 0 ? 'even' : 'odd';
            var width = scale;


            if (_i == 0) {
                width *= (7 - startOffset)/7;
            }
            else if ((_i+1) >= weeksChunks) {
                width *= (7 - endOffset)/7;
            }

            s += '<div class="spanScaleWeek ' + even_odd + '" style="left: ' + currScale.toFixed(2) + '%; width: ' + width.toFixed(2) + '%">';
            s += '' + (currWeek);
            s += '</div>';

            currScale += width;
            if (currWeek == 53) currWeek = 0;
            currWeek += 1;
        }

        return s;
    }

    function changeGrouping(new_g) {
        currentGrouping = new_g;
        rerenderEvents();
    }

    function getGroupingCurrent() {
        return currentGrouping;
    }
    function getSplitSeqEvents() {
        return splitSequentialEvents;
    }

    function buildDropDownGroupLink(choices, current) {
        var select_html = '<option value="">Без категории</option>';
        $.each(choices, function(c) {
            select_html += '<option value="' + c + '" ';
            if(current==c) {
                select_html += 'selected="selected" ';
            }
            select_html += '>' + choices[c] + '</option>';
        });

        var select = $("<select>").attr({
            'id': 'groupChocer'
        }).html(select_html).on('change', function() {
            changeGrouping($(this).val());
        });

        return select;
    }


    function buildHeaderSkeleton(maxRowCnt, showNumbers) {
        var headerClass = tm + "-widget-header";
        var contentClass = tm + "-widget-content";
        var i, j;

        var spanMain = $("<div>").attr({'class': 'spanMain'});
        var spanHeader = $("<div>").attr({'class': 'spanHeader'});
        var spanHeaderTitle = $("<div>").attr({'class': 'spanHeaderTitle'});
        if (options.groupChoices) {
            spanHeaderTitle.append(buildDropDownGroupLink(options.groupChoices, options.groupCurrent));
        }

        var headerRows = $("<div>").attr({'class': 'spanHeaderRows'});
        var spanScaleMonths = $("<div>").attr({'class': 'spanScale'});
        spanScaleMonths.append(buildMonthHeader(t.xstart, t.xend));

        var spanScaleWeeks = $("<div>").attr({'class': 'spanScale'});
        spanScaleWeeks.append(buildWeeksHeader(t.xstart, t.xend));

        // build tree
        headerRows.append(spanScaleMonths);
        headerRows.append(spanScaleWeeks);
        spanHeader.append(spanHeaderTitle);
        spanHeader.append(headerRows);
        spanMain.append(spanHeader);

        mainDiv = spanMain.appendTo(element);

        head = mainDiv.find('div.spanHeader');
        headTitle = head.find('div.spanHeaderTitle');
        firstRow = mainDiv.find('div.spanEventsRows');

        body = firstRow;

        bodyRows = firstRow;
        bodyCells = firstRow;
        bodyFirstCells = firstRow;
        bodyCellTopInners = firstRow;

        markFirstLast(firstRow); // marks first+last tr/th's
        markFirstLast(firstRow); // marks first+last td's
        // bodyRows.eq(0).addClass('fc-first'); // fc-last is done in updateCells

        dayBind(firstRow);

        // daySegmentContainer =
        //     $("<div style='position:absolute;z-index:8;top:0;left:0'/>")
        //         .appendTo(element);
    }

    function clearHeaderSkeleton() {
        mainDiv.remove();
    }

    function updateCells(firstTime) {
        var dowDirty = firstTime || rowCnt == 1; // could the cells' day-of-weeks need updating?
        var month = t.start.getMonth();
        var today = clearTime(new Date());
        var cell;
        var date;
        var row;

        if (dowDirty) {
            headCells.each(function(i, _cell) {
                cell = $(_cell);
                date = indexDate(i);
                cell.html(formatDate(date, colFormat));
                setDayID(cell, date);
            });
        }

        bodyCells.each(function(i, _cell) {
            cell = $(_cell);
            date = indexDate(i);
            var odd = !(date.getMonth() % 2);
            cell.toggleClass('fc-month-odd', odd);
            cell.toggleClass('fc-month-even', !odd);

            if (date >= t.start && date < t.end) {
                cell.removeClass('fc-other-month');
            }else{
                cell.addClass('fc-other-month');
            }
            if (+date == +today) {
                cell.addClass(tm + '-state-highlight fc-today');
            }else{
                cell.removeClass(tm + '-state-highlight fc-today');
            }
            cell.find('div.fc-day-number').text(date.getDate());
            if (dowDirty) {
                setDayID(cell, date);
            }
        });

        bodyRows.each(function(i, _row) {
            row = $(_row);
            if (i < rowCnt) {
                row.show();
                if (i == rowCnt-1) {
                    row.addClass('fc-last');
                }else{
                    row.removeClass('fc-last');
                }
            }else{
                row.hide();
            }
        });
    }



    function setHeight(height) {
        viewHeight = height;

        var bodyHeight = viewHeight - head.height();
        var rowHeight;
        var rowHeightLast;
        var cell;

        if (opt('weekMode') == 'variable') {
            rowHeight = rowHeightLast = Math.floor(bodyHeight / (rowCnt==1 ? 2 : 6));
        }else{
            rowHeight = Math.floor(bodyHeight / rowCnt);
            rowHeightLast = bodyHeight - rowHeight * (rowCnt-1);
        }

        bodyFirstCells.each(function(i, _cell) {
            if (i < rowCnt) {
                cell = $(_cell);
                setMinHeight(
                    cell.find('> div'),
                    (i==rowCnt-1 ? rowHeightLast : rowHeight) - vsides(cell)
                );
            }
        });

    }


    function setWidth(width) {
        viewWidth = width;
        colContentPositions.clear();
        colWidth = Math.floor(viewWidth / colCnt);
        // FIXME: setOuterWidth(headCells.slice(0, -1), colWidth);
    }



    /* Day clicking and binding
    -----------------------------------------------------------*/


    function dayBind(days) {
        days.click(dayClick)
            .mousedown(daySelectionMousedown);
    }


    function dayClick(ev) {
        if (!opt('selectable')) { // if selectable, SelectionManager will worry about dayClick
            var index = parseInt(this.className.match(/fc\-day(\d+)/)[1]); // TODO: maybe use .data
            var date = indexDate(index);
            trigger('dayClick', this, date, true, ev);
        }
    }



    /* Semi-transparent Overlay Helpers
    ------------------------------------------------------*/


    function renderDayOverlay(overlayStart, overlayEnd, refreshCoordinateGrid) { // overlayEnd is exclusive
        if (refreshCoordinateGrid) {
            coordinateGrid.build();
        }
        var rowStart = cloneDate(t.visStart);
        var rowEnd = addDays(cloneDate(rowStart), colCnt);
        for (var i=0; i<rowCnt; i++) {
            var stretchStart = new Date(Math.max(rowStart, overlayStart));
            var stretchEnd = new Date(Math.min(rowEnd, overlayEnd));
            if (stretchStart < stretchEnd) {
                var colStart, colEnd;
                if (rtl) {
                    colStart = dayDiff(stretchEnd, rowStart)*dis+dit+1;
                    colEnd = dayDiff(stretchStart, rowStart)*dis+dit+1;
                }else{
                    colStart = dayDiff(stretchStart, rowStart);
                    colEnd = dayDiff(stretchEnd, rowStart);
                }
                dayBind(
                    renderCellOverlay(i, colStart, i, colEnd-1)
                );
            }
            addDays(rowStart, 7);
            addDays(rowEnd, 7);
        }
    }


    function renderCellOverlay(row0, col0, row1, col1) { // row1,col1 is inclusive
        var rect = coordinateGrid.rect(row0, col0, row1, col1, element);
        return renderOverlay(rect, element);
    }



    /* Selection
    -----------------------------------------------------------------------*/


    function defaultSelectionEnd(startDate, allDay) {
        return cloneDate(startDate);
    }


    function renderSelection(startDate, endDate, allDay) {
        renderDayOverlay(startDate, addDays(cloneDate(endDate), 1), true); // rebuild every time???
    }


    function clearSelection() {
        clearOverlays();
    }


    function reportDayClick(date, allDay, ev) {
        var cell = dateCell(date);
        var _element = bodyCells[cell.row*colCnt + cell.col];
        trigger('dayClick', _element, date, allDay, ev);
    }



    /* External Dragging
    -----------------------------------------------------------------------*/


    function dragStart(_dragElement, ev, ui) {
        hoverListener.start(function(cell) {
            clearOverlays();
            if (cell) {
                renderCellOverlay(cell.row, cell.col, cell.row, cell.col);
            }
        }, ev);
    }


    function dragStop(_dragElement, ev, ui) {
        var cell = hoverListener.stop();
        clearOverlays();
        if (cell) {
            var d = cellDate(cell);
            trigger('drop', _dragElement, d, true, ev, ui);
        }
    }



    /* Utilities
    --------------------------------------------------------*/


    function defaultEventEnd(event) {
        return cloneDate(event.start);
    }


    coordinateGrid = new CoordinateGrid(function(rows, cols) {
        var e, n, p;
        headCells.each(function(i, _e) {
            e = $(_e);
            n = e.offset().left;
            if (i) {
                p[1] = n;
            }
            p = [n];
            cols[i] = p;
        });
        p[1] = n + e.outerWidth();
        bodyRows.each(function(i, _e) {
            if (i < rowCnt) {
                e = $(_e);
                n = e.offset().top;
                if (i) {
                    p[1] = n;
                }
                p = [n];
                rows[i] = p;
            }
        });
        p[1] = n + e.outerHeight();
    });


    hoverListener = new HoverListener(coordinateGrid);


    colContentPositions = new HorizontalPositionCache(function(col) {
        return bodyCellTopInners.eq(col);
    });


    function colContentLeft(col) {
        return colContentPositions.left(col);
    }

    function colContentRight(col) {
        return colContentPositions.right(col);
    }

    function dateCell(date) {
        return {
            row: Math.floor(dayDiff(date, t.visStart) / 7),
            col: dayOfWeekCol(date.getDay())
        };
    }


    function cellDate(cell) {
        return _cellDate(cell.row, cell.col);
    }


    function _cellDate(row, col) {
        return addDays(cloneDate(t.visStart), row*7 + col*dis+dit);
        // what about weekends in middle of week?
    }


    function indexDate(index) {
        return _cellDate(Math.floor(index/colCnt), index%colCnt);
    }


    function dayOfWeekCol(dayOfWeek) {
        return ((dayOfWeek - Math.max(firstDay, nwe) + colCnt) % colCnt) * dis + dit;
    }




    function allDayRow(i) {
        return bodyRows.eq(i);
    }


    function allDayBounds(i) {
        return {
            left: 0,
            right: viewWidth
        };
    }


}
