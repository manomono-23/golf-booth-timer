$(document).ready(function() {
    renderTimelineLabels();
    loadData('day');  // デフォルトで「日」を選択
});

function loadData(period) {
    const url = "https://script.google.com/macros/s/AKfycbyML8uxIvza5FRzSFNk42arYrmMRD4Wq-YW1Tjse4Wnyld7Dsu10oAJHNcr4HtKHe47HQ/exec";

    $.get(`${url}?period=${period}`, function(data) {
        const timelineContainer = $('#timeline');
        timelineContainer.empty();

        for (let i = 1; i <= 36; i++) {

            const boxData = data.filter(d => d.boxId === i);
            const timelineEntry = $('<div>').addClass('timeline-entry');

            boxData.forEach(d => {
                const reservation = $('<div>').addClass('reservation')
                    .css('left', calculatePosition(d.startTime, period) + '%')
                    .css('width', calculateWidth(d.duration, period) + '%');
                timelineEntry.append(reservation);

                const actual = $('<div>').addClass('actual')
                    .css('left', calculatePosition(d.startTime, period) + '%')
                    .css('width', calculateWidth((new Date(d.endTime)).getTime() - (new Date(d.startTime)).getTime(), period) + '%');
                timelineEntry.append(actual);
            });

            timelineContainer.append(timelineEntry);
            const boxIdLabel = $('<div>').addClass('box-id').text(`Box ID: ${i}`);
            timelineEntry.append(boxIdLabel);
        }
    });
}

function calculatePosition(time, period) {
    const startOfDay = new Date(time).setHours(6, 0, 0, 0);
    const ms = new Date(time).getTime() - startOfDay;
    return (ms / (12 * 60 * 60 * 1000)) * 100;  // 6時から18時までのスパンを基準として計算
}

function calculateWidth(duration, period) {
    return (duration / (12 * 60 * 60 * 1000)) * 100;  // 6時から18時までのスパンを基準として計算
}

function renderTimelineLabels() {
    const timelineContainer = $('#timeline');
    const labels = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
    const timeLabels = $('<div>').addClass('time-labels');
    labels.forEach(label => {
        timeLabels.append($('<span>').text(label));
    });
    timelineContainer.append(timeLabels);
}