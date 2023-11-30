$(document).ready(function() {
    const container = document.getElementById('visualization');
    const groups = Array.from({ length: 36 }, (_, i) => ({id: i + 1, content: `Box ${i + 1}`}));

    const items = new vis.DataSet();  // DataSetを作成

    let allData = [];

    function fetchData() {
        $.getJSON(TL_GAS, function(data) {
            allData = data;
            const currentDate = new Date().toISOString().split('T')[0];
            $('#datePicker').val(currentDate);
            renderData(currentDate);
        });
    }

    function renderData(date) {
        console.log(allData);
        const filteredData = allData.filter(entry => {
            const entryDate = moment.utc(entry['Start Time']).local().format('YYYY-MM-DD');
            return entryDate === date;
        });
        console.log(filteredData);

        const newItems = filteredData.flatMap((entry, index) => {
            const start = new Date(entry['Start Time']);
            const end = new Date(entry['End Time']);
            const duration = entry['Duration (mins)'] * 60000;
            const reservedEnd = new Date(start.getTime() + duration);
            const groupId = parseInt(entry['Box ID']);
            const earlyEnd = end.getTime() < reservedEnd.getTime();
            const lateEnd = end.getTime() > reservedEnd.getTime();

            const items = [
                {
                    id: `${index}-normal`,
                    group: groupId,
                    start: start,
                    end: earlyEnd ? end : reservedEnd,
                    content: '',
                    title: `開始: ${start.toLocaleString()}<br>終了: ${end.toLocaleString()}<br>利用時間: ${entry['Duration (mins)']} 分`
                }
            ];

            if (earlyEnd) {
                items.push({
                    id: `${index}-early`,
                    group: groupId,
                    start: end,
                    end: reservedEnd,
                    className: 'dotted-box',
                    title: `予定終了時間: ${reservedEnd.toLocaleString()}`
                });
            } else if (lateEnd) {
                items.push({
                    id: `${index}-late`,
                    group: groupId,
                    start: reservedEnd,
                    end: end,
                    className: 'late-box',
                    title: `超過時間: ${((end - reservedEnd) / 60000).toFixed(0)} 分`
                });
            }

            return items;
        });

        const startDate = new Date(date);
        startDate.setHours(6, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(18, 0, 0, 0);

        const options = {
            start: startDate,
            end: endDate,
            min: startDate,
            max: endDate,
            clickToUse: true,
            stack: false,
            zoomable: false,
            tooltip: {
                followMouse: true,
                overflowMethod: 'cap'
            },
            orientation: {
                axis: 'both',  // 時間軸を上部に移動
                item: 'bottom'
            }
        };

        timeline.setOptions(options);  // オプションのみを更新
        items.clear();  // DataSetのアイテムをクリア
        items.add(newItems);  // DataSetに新しいアイテムを追加
    }

    const timeline = new vis.Timeline(container, items, groups);

    $('#datePicker').on('change', function() {
        const date = $(this).val();
        renderData(date);
    });

    fetchData();
});
