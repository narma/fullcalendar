fcViews.threeMonth = ThreeMonthView;

function ThreeMonthView(element, calendar) {
    var t = this;

    // exports
    t.render = render;

    // imports
    BasicView.call(t, element, calendar, 'threeMonth');
    var opt = t.opt;
    var renderBasic = t.renderBasic;
    var formatDate = calendar.formatDate;

    function render(date, delta) {
        if (delta) {
            addMonths(date, delta);
            date.setDate(1);
        }
        var start = cloneDate(date, true);
        start.setDate(1);
        var end = addMonths(cloneDate(start), 3);
        var visStart = cloneDate(start);
        var visEnd = cloneDate(end);
        var firstDay = opt('firstDay');
        var nwe = opt('weekends') ? 0 : 1;
        if (nwe) {
            skipWeekend(visStart);
            skipWeekend(visEnd, -1, true);
        }
        addDays(visStart, -((visStart.getDay() - Math.max(firstDay, nwe) + 7) % 7));
        addDays(visEnd, (7 - visEnd.getDay() + Math.max(firstDay, nwe)) % 7);
        var rowCnt = Math.round((visEnd - visStart) / (DAY_MS * 7));
        /*if (opt('weekMode') == 'fixed') {
            addDays(visEnd, (6 - rowCnt) * 7);
            rowCnt = 6;
        }*/
        t.title = formatDates(
            visStart,
            addDays(cloneDate(visEnd), -1),
            opt('titleFormat')
        );
        t.start = start;
        t.end = end;
        t.visStart = visStart;
        t.visEnd = visEnd;
        renderBasic(6*3, rowCnt, nwe ? 5 : 7, true);

        /*var table = $('.fc-view-threeMonth table');
        console.log(table)

        table.find('thead tr').prepend($('<th/>'));

        table.find('tbody tr:first').prepend($('<td/>').attr('rowspan', 4));
        table.find('tbody tr:eq(4)').prepend($('<td/>').attr('rowspan', 3));
        table.find('tbody tr:eq(7)').prepend($('<td/>').attr('rowspan', rowCnt - 7));*/

    }


}
