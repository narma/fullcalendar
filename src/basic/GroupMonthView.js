fcViews.groupMonth = GroupMonthView;

function GroupMonthView(element, calendar) {
    var t = this;

    // exports
    t.render = render;

    // надо ли это в контексте - хз, тем более в экспорте
    // мб сойдёт и константа -- TODO
    t.DISPLAY_MONTHS = 3;


    // imports
    SpanView.call(t, element, calendar, 'groupMonth');
    var opt = t.opt;
    var renderSpan = t.renderSpan;
    var formatDate = calendar.formatDate;

    function render(date, delta) {
        if (delta) {
            addMonths(date, delta);
            date.setDate(1);
        }
        var start = cloneDate(date, true);
        start.setDate(1);
        var end = addMonths(cloneDate(start), t.DISPLAY_MONTHS);
        var visStart = cloneDate(start);
        var visEnd = cloneDate(end);
        var firstDay = opt('firstDay');
        var nwe = opt('weekends') ? 0 : 1;
        if (nwe) {
            skipWeekend(visStart);
            skipWeekend(visEnd, -1, true);
        }
        //addDays(visStart, -((visStart.getDay() - Math.max(firstDay, nwe) + 7) % 7));
        //addDays(visEnd, (7 - visEnd.getDay() + Math.max(firstDay, nwe)) % 7);
        var rowCnt = Math.round((visEnd - visStart) / (DAY_MS * 7));
        /*if (opt('weekMode') == 'fixed') {
            addDays(visEnd, (6 - rowCnt) * 7);
            rowCnt = 6;
        }*/

        t.title = formatDates(
            start,
            addDays(cloneDate(visEnd), -1),
            opt('titleFormat')
        );

        t.start = start;
        t.end = end;

        t.xstart = new XDate(t.start);
        t.xend = new XDate(t.end);

        t.visStart = visStart;
        t.visEnd = visEnd;
        renderSpan(6*t.DISPLAY_MONTHS, rowCnt, nwe ? 5 : 7, true);
    }


}
