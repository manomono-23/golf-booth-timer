const GAS_ENDPOINT = "https://script.google.com/macros/s/AKfycbzqsTycExXZv77vedkedxCQzrnGNxjSgjhU9zmRfiqUUACQVfwmawOG5ZDavQTd64Gm/exec";


let timers = {};
let selectedBoxId = null;
let config = {};  // この行を追加


$(document).ready(function() {

    getConfig().then(data => {
        console.log(data);
        config = data;
        const weekdayTimers = config["weekday"];
        const holidayTimers = config["holiday"];
        
        // 平日のタイマーをセット
        for (let time of weekdayTimers) {
            $('#weekday-timers').append(
                `<button class="btn btn-primary m-1" data-time="${time}">${time}分</button>`
            );
        }

        // 休日のタイマーをセット
        for (let time of holidayTimers) {
            $('#holiday-timers').append(
                `<button class="btn btn-secondary m-1" data-time="${time}">${time}分</button>`
            );
        }

        // タイマーの開始
        $("#timerModal .btn-primary, #timerModal .btn-secondary").on("click", function() {
            let box = $(`.box[data-box-id="${selectedBoxId}"]`);
            box.find(".box-body").removeClass("inactive");
            let time = parseInt($(this).data("time"));
            startTimer(selectedBoxId, time);  // ← ここでstartTimer関数を呼び出します
            timers[selectedBoxId] = {
                start_time: new Date().getTime(), // 現在の時刻を開始時間として保存
                duration: time
            };
            updateBoxBasedOnStartTime(selectedBoxId); // 直ちに打席の表示を更新
            $("#timerModal").modal("hide"); // モーダルを非表示にする
        });


    });

    getTimers().then(data => {
        console.log(data);
        timers = data;
        for (let boxId in timers) {
            updateBoxBasedOnStartTime(boxId);
        }
        $(".box").each(function() {
            let boxId = $(this).data("box-id");
            if (!timers[boxId]) {
                // タイマーが動作していない打席の場合
                $(this).find(".box-body").addClass("inactive");
            }
        });
    });

    $(".box").on("click", function() {
        selectedBoxId = $(this).data("box-id");
        
        if (!timers[selectedBoxId]) {
            $("#timerModal").modal("show");
        } else {
            let elapsedTime = Math.floor((new Date().getTime() - timers[selectedBoxId].start_time) / 1000);
            let remainingTime = timers[selectedBoxId].duration - elapsedTime;
    
            if (remainingTime <= 0) {
                // 打席の使用を終了するかどうかを確認するモーダルを表示
                $("#endUseModal").modal("show");
            } else {
                // 打席の使用をキャンセルするかどうかを確認するモーダルを表示
                $("#cancelModal").modal("show");
            }
        }
    });

    $("#endUseModal .btn-primary").on("click", function() {
        let box = $(`.box[data-box-id="${selectedBoxId}"]`);
        box.find(".box-body").addClass("inactive");
        box.removeClass("flashing");
        box.css("background-color", "white");
        box.find(".box-body").text("00:00");
        endTimer(selectedBoxId);  // ← ここでendTimer関数を呼び出します
        delete timers[selectedBoxId];  // timersオブジェクトから該当打席の情報を削除
        $("#endUseModal").modal("hide");
    });
    

    // 打席使用キャンセルモーダルのOKボタンをクリックしたときの動作
    $("#cancelModal .btn-primary").on("click", function () {
        let box = $(`.box[data-box-id="${selectedBoxId}"]`);
        box.find(".box-body").addClass("inactive");
        clearInterval(timers[selectedBoxId].intervalId); // タイマーをクリア
        endTimer(selectedBoxId);  // ← ここでendTimer関数を呼び出します
        delete timers[selectedBoxId]; // タイマーの情報を削除
        box.css("background-color", "white");
        box.find(".box-body").text("00:00");
        $("#cancelModal").modal("hide"); // モーダルを閉じる

    });

    setInterval(function() {
        for (let boxId in timers) {
            updateBoxBasedOnStartTime(boxId);
        }
    }, 300);
});

function updateBoxBasedOnStartTime(boxId) {
    let startTime = new Date(timers[boxId].start_time);
    let duration = timers[boxId].duration * 60;
    let elapsedTime = Math.floor((new Date().getTime() - startTime) / 1000);
    let remainingTime = duration - elapsedTime;
    
    let box = $(`.box[data-box-id="${boxId}"]`);
    
    // 残り時間が0を下回った場合の処理
    if (remainingTime <= 0) {
        let overflowTime = Math.abs(remainingTime);
        let minutes = Math.floor(overflowTime / 60);
        let seconds = overflowTime % 60;
        
        box.addClass("flashing");
        box.find(".box-body").html(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        return;
    }
    
    updateBox(boxId, remainingTime);
}

function getConfig() {
    return fetch(GAS_ENDPOINT + "?action=getConfig")
        .then(response => response.json())
        .then(data => {
            const config = {
                holiday: data.map(item => item[0]),
                weekday: data.map(item => item[1])
            };
            return config;
        });
}

function getTimers() {
    return fetch(GAS_ENDPOINT + "?action=getTimers")
        .then(response => response.json())
        .then(data => {
            let timers = {};
            timers = data;
            return timers;
        });
}

function startTimer(boxId, duration) {
    console.log("StartTimer");
    const startTime = new Date();

    const data = {
        boxId: boxId,
        startTime: startTime.toISOString(),
        duration: duration
    };

    fetch(GAS_ENDPOINT + "?action=startTimer", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: JSON.stringify(data)
    });
}

function endTimer(boxId) {
    fetch(GAS_ENDPOINT + "?action=endTimer", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: JSON.stringify({ boxId: boxId })
    });
}

function updateBox(boxId, time) {
    let box = $(`.box[data-box-id="${boxId}"]`);
    let minutes = Math.floor(time / 60);
    let seconds = time % 60;
    box.find(".box-body").text(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    if (time <= 300) {
        box.css("background-color", "lightcoral");
    } else if (time <= 1200) {
        box.css("background-color", "lightyellow");
    } else {
        box.css("background-color", "lightgreen");
    }
}