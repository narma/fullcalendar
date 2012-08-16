
function SpanEventRenderer() {
    var t = this;


    // exports
    t.renderEvents = renderEvents;
    t.clearEvents = clearEvents;
    t.bindDaySeg = bindDaySeg;

    // imports
    var opt = t.opt;
    var reportEventClear = t.reportEventClear;
    var reportEvents = t.reportEvents;
    var getStart = t.getStart;
    var getEnd = t.getEnd;
    var getEventsContainer = t.getEventsContainer;
    var getGroupingCurrent = t.getGroupingCurrent;
    var getSplitSeqEvents = t.getSplitSeqEvents;



    /* Rendering
    --------------------------------------------------------------------*/


    function renderEvents(events, modifiedEventId) {
        reportEvents(events);

        var rows = compileRows(events);
        renderRows(rows);

        // renderSpanSegs(compileSegs(events), modifiedEventId);
    }


    function clearEvents() {
        reportEventClear();
        $("div.spanRow").remove()

    }

    function getVisEventEnd(event) {
        // use for show, exactly end day
        if (event.end) return event.end;
        return cloneDate(event.start);
    }

    function getEventEnd(event) {
        // use for diffing, +1 day
        var day = event.end ? event.end : event.start;
        return addDays(cloneDate(day), 1);
    }

function compileRows(events) {
        var eventsGrouped = {};
        var rowsGrouped = {};
        var groupBy = getGroupingCurrent();
        var splitEvents = getSplitSeqEvents();
        var days_delta_splitting = splitEvents ? 0 : 1;


        // filter for dates and split events to categories
        // and add XDate instances for dates with prefixes x
        $(events).each(function (i, event) {
            var eventEnd = getEventEnd(event);
            var visEventEnd = getVisEventEnd(event);
            var start = getStart();
            var end = getEnd();


            if(eventEnd < start || event.start > end) {
                return true;
            }
            var val_group = event[groupBy] || '';

            if (eventsGrouped[val_group] == undefined) {
                eventsGrouped[val_group] = [];
            }
            event.xstart = new XDate(event.start);
            event.xend = new XDate(eventEnd);
            event.xVisEnd = new XDate(visEventEnd);

            eventsGrouped[val_group].push(event);
        });

        $.each(eventsGrouped, function(val_group, events_list) {
            var row_end = [];
            var rows = [[]];
            $.each(events_list, function (i, event) {
                // sorting the events in non-overlapping rows
                var row;
                for (row=0; row_end[row] && row_end[row].diffDays(event.xstart) < days_delta_splitting; ++row) {};
                    // find a "free" row (no other event)
                if(rows[row] == undefined) rows[row] = [];
                rows[row].push(event);
                row_end[row] = event.xend;
            });
            rowsGrouped[val_group] = rows;

        });

        return rowsGrouped;
    }

    function renderRows(rowsGrouped) {
        var container = getEventsContainer();
        var start = getStart();
        var end = getEnd();

        $.each(rowsGrouped, function(category, rows) {
            var category_div = $('<div>').attr({
                'class': 'spanRow'
            });
            var row_header = $('<div>').attr({
                'class': 'spanRowHeader'
            }).html(category);

            category_div.append(row_header);
            var events_div = $('<div>').attr({
                'class': 'spanEvents'
            });


            $.each(rows, function(i, row) {
                var even_odd = i % 2 == 0 ? 'odd' : 'even';
                var events_row_div = $('<div>').attr({
                    'class': 'spanEventsRow ' + even_odd
                });

                $.each(row, function(i, event) {
                    var left = span_pos(event.start, start, end);
                    var width = (span_pos(getEventEnd(event), start, end) - left).toFixed(2);

                    var skinCss = getSkinCss(event, opt, true);
                    var url = event.url;

                    if(url) {
                        var event_el = $('<a>').attr({href: url});
                    }
                    else {
                        var event_el = $('<div>');
                    }
                    event_el.attr({
                        'class': 'spanEvent'
                    }).html(event.title).css('left', '' + left + '%'
                    ).css('width', '' + width + '%').css(skinCss);

                    events_row_div.append(event_el);

                    event_el.tooltip({'title': function() {
                        if(event.tooltip) {
                            return event.tooltip;
                        }
                        else { // show basic tooltip
                            var t_html = '<table style="margin:0"><tr>';
                            t_html += '<td class="label">start</td>';
                            t_html += '<td>' + event.xstart.toString('dd-MM-yyyy') + '</td>';
                            t_html += '</tr>';
                            t_html += '<tr><td class="label">end</td><td>';
                            t_html += event.xVisEnd.toString('dd-MM-yyyy') + '</td></tr>';
                            t_html += '<tr><td colspan="2">' + event.title + '</td></tr>';
                            t_html += '</table>';
                            return t_html;
                        }
                    },
                    'placement': 'bottom'
                    });
                });

                events_div.append(events_row_div);

            });

            category_div.append(events_div);
            container.append(category_div);
        });

    }

    function span_pos(time, start, end) {
        if (time <= start) return 0;    // we are left of our scale
        if (time >= end) return 100;    // we are right of our scale

        var percent = (time - start) / (end - start);
        percent = (100 * percent).toFixed(2);
        return percent;
    }


    function bindDaySeg(event, eventElement, seg) {

    }



    /* Dragging
    ----------------------------------------------------------------------------*/
}