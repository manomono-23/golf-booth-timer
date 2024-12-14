let timers = {};
let selectedBoxId = null;
let config = {};  // この行を追加


$(document).ready(function() {


    Promise.all([getConfig(), getTimers()]).then(results => {
        // getConfigとgetTimersの結果を取得
        const configData = results[0];
        const timersData = results[1];

        config = configData;
        const weekdayTimers = config["weekday"];
        const holidayTimers = config["holiday"];

        // 平日のタイマーをセット
        for (let time of weekdayTimers) {
            if (time === "カゴ打ち") {
                $('#weekday-timers').append(
                    `<button class="btn btn-primary m-1" data-time="-1">カゴ打ち</button>`
                );
            } else {
                $('#weekday-timers').append(
                    `<button class="btn btn-primary m-1" data-time="${time}">${time}分</button>`
                );
            }
        }

        // 休日のタイマーをセット
        for (let time of holidayTimers) {
            if (time !== "") {
                $('#holiday-timers').append(
                    `<button class="btn btn-secondary m-1" data-time="${time}">${time}分</button>`
                );
            }
        }

        // タイマーの開始
        $("#timerModal .btn-primary, #timerModal .btn-secondary").on("click", function() {
            if (isLoadingSpinnerVisible()) {
                return;
            }
            let time = parseInt($(this).data("time"));
            let boxId = selectedBoxId;
        
            // checkModalに確認メッセージを設定して表示
            $("#timerModal").modal("hide");
            $('#checkModalTitle').text("打席開始の確認");
            if (time == -1) {
                $('#checkModalBody').text(`${boxId} 番の打席 カゴ打ち 開始しますか？`);
            } else {
                $('#checkModalBody').text(`${boxId} 番の打席 ${time} 分 開始しますか？`);
            }
            $('#checkModal').modal('show');

            // checkModalのOKボタンがクリックされた場合の処理
            $('#checkModal .btn-primary').off('click');
            $('#checkModal .btn-primary').on('click', function() {
                $("#checkModal").modal("hide");
                startTimer(selectedBoxId, time).then(success => {
                    if (success) {
                        let box = $(`.box[data-box-id="${selectedBoxId}"]`);
                        box.find(".box-body").removeClass("inactive");
                        timers[selectedBoxId] = {
                            start_time: new Date().getTime(),
                            duration: time
                        };
                        updateBoxBasedOnStartTime(selectedBoxId);


                    } else {
                        showErrorToast("処理に失敗しました。もう一度実行してください。");
                    }
                });
            });
        });
        

        // getTimersの結果を処理
        timers = timersData;
        for (let boxId in timers) {
            updateBoxBasedOnStartTime(boxId);
        }
        $(".box").each(function () {
            let boxId = $(this).data("box-id");
            if (!timers[boxId]) {
                $(this).find(".box-body").addClass("inactive");
            } else {
                $(this).find(".box-body").removeClass("inactive");
            }
        });
    }).catch(error => {
        showErrorToast("通信エラーが発生しました。再試行してください。");
    }).finally(() => {
        document.getElementById("loading-overlay").style.display = "none";

        // URLのパラメータを取得
        var params = new URLSearchParams(window.location.search);
    
        // readonlyパラメータがtrueの場合
        if (params.get('readonly') === 'true') {
            // clickイベントを無効にする
            $('*').off('click');

            // /timeline.htmlへのリンクを下部に追加
            $('body').append('<a href="timeline.html" id="timeline-link">タイムライン表示</a>');
        }

    });

    $(".box").on("click", function () {
        if (isLoadingSpinnerVisible()) {
            return;
        }
        selectedBoxId = $(this).data("box-id");

        if (!timers[selectedBoxId]) {
            $("#timerModal .modal-title").text(`${selectedBoxId}番の打席の利用時間を選択`);
            $("#timerModal").modal("show");
        } else {
            let box = $(`.box[data-box-id="${selectedBoxId}"]`);
            if (box.hasClass("flashing")) {
                // 打席の使用を終了するかどうかを確認するモーダルを表示
                $("#endUseModal .modal-body").text(`${selectedBoxId}番の打席の使用を終了しますか?`);
                $("#endUseModal").modal("show");
            } else {
                // 打席の使用をキャンセルするかどうかを確認するモーダルを表示
                $("#cancelModal .modal-body").text(`${selectedBoxId}番の打席の使用をキャンセルしますか?`);
                $("#cancelModal").modal("show");
            }
        }
    });

    $("#endUseModal .btn-primary").on("click", function() {
        if (isLoadingSpinnerVisible()) {
            return;
        }
        // モーダルを非表示にする
        $("#endUseModal").modal("hide");
        // endTimer関数が完了した後の処理をthen内に記述
        endTimer(selectedBoxId)
            .then(success => {
                if (success) {
                    let box = $(`.box[data-box-id="${selectedBoxId}"]`);
                    box.find(".box-body").addClass("inactive");
                    box.removeClass("flashing");
                    box.css("background-color", "white");
                    box.find(".box-body").text("00:00");
                    // timersオブジェクトから該当打席の情報を削除
                    delete timers[selectedBoxId];
                } else {
                    showErrorToast("処理に失敗しました。もう一度実行してください。");
                    // 必要に応じて、エラー時の処理を追加
                }
            });
    });

    

    // 打席使用キャンセルモーダルのOKボタンをクリックしたときの動作
    $("#cancelModal .btn-primary").on("click", function () {
        if (isLoadingSpinnerVisible()) {
            return;
        }

        $("#cancelModal").modal("hide"); // モーダルを閉じる
        endTimer(selectedBoxId)
            .then(success => {
                if (success) {
                    let box = $(`.box[data-box-id="${selectedBoxId}"]`);
                    box.find(".box-body").addClass("inactive");
                    clearInterval(timers[selectedBoxId].intervalId); // タイマーをクリア
                    box.css("background-color", "white");
                    box.find(".box-body").text("00:00");
                    delete timers[selectedBoxId]; // タイマーの情報を削除
                } else {
                    showErrorToast("処理に失敗しました。もう一度実行してください。");
                    // 必要に応じて、エラー時の処理を追加
                }
            });
    });

    setInterval(function() {
        for (let boxId in timers) {
            updateBoxBasedOnStartTime(boxId);
        }
    }, 300);
});

function updateBoxBasedOnStartTime(boxId) {
    if (timers[boxId].duration == 'カゴ打ち') {
        updateBox(boxId, -1)
        return;
    }
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
        .then(response => {
            // レスポンスが正常でない場合はエラーを投げる
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            // 応答データが想定外の場合はエラーを投げる
            if (!Array.isArray(data)) {
                throw new Error('Unexpected response data');
            }

            const config = {
                holiday: data.map(item => item[0]),
                weekday: data.map(item => item[1])
            };
            return config;
        })
        .catch(error => {
            throw error;
        });
}

function getTimers() {
    return fetch(GAS_ENDPOINT + "?action=getTimers")
        .then(response => {
            // レスポンスが正常でない場合はエラーを投げる
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            // 応答データが想定外の場合はエラーを投げる
            if (typeof data !== 'object') {
                throw new Error('Unexpected response data');
            }

            let timers = {};
            timers = data;
            return timers;
        })
        .catch(error => {
            throw error;
        });
}


function startTimer(boxId, duration) {
    const startTime = new Date();

    const data = {
        boxId: boxId,
        startTime: startTime.toISOString(),
        duration: duration
    };

    // 対応するローディングスピナーを表示
    $(`div[data-box-id="${boxId}"] .loading-spinner`).css("display", "block");

    const url = new URL(GAS_ENDPOINT);
    url.searchParams.append("action", "startTimer");
    url.searchParams.append("data", JSON.stringify(data));

    // Promiseを返す
    return fetch(url)
    .then(response => {
        // レスポンスが正常でない場合はエラーを投げる
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        // ここで成功時の処理を行い、成功を示す値を返す
        return true;
    })
    .catch(error => {
        // エラーメッセージを表示

        // エラーだけどtrue
        return false;
    })
    .finally(() => {
        // 対応するローディングスピナーを非表示にする
        $(`div[data-box-id="${boxId}"] .loading-spinner`).css("display", "none");
    });
}

function showErrorToast(errorMessage) {
    // Toastのbody部分にエラーメッセージを設定
    $('#errorToast .toast-body').text(errorMessage);
    // Toastを表示
    $('#errorToast').toast('show');
}

function endTimer(boxId) {
    // 対応するローディングスピナーを表示
    $(`div[data-box-id="${boxId}"] .loading-spinner`).css("display", "block");

    const data = { boxId: boxId };
    const url = new URL(GAS_ENDPOINT);
    url.searchParams.append("action", "endTimer");
    url.searchParams.append("data", JSON.stringify(data));

    // Promiseを返す
    return fetch(url, {
        method: 'GET',
    })
    .then(response => {
        // レスポンスが正常でない場合はエラーを投げる
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        // ここで成功時の処理を行い、成功を示す値を返す
        return true;
    })
    .catch(error => {
        // エラーメッセージを表示
        // エラーを示す値を返す
        return false;
    })
    .finally(() => {
        // 対応するローディングスピナーを非表示にする
        $(`div[data-box-id="${boxId}"] .loading-spinner`).css("display", "none");
    });


}

    function isLoadingSpinnerVisible() {
        // 初期状態では、loading-spinnerは見つからないと仮定
        let isVisible = false;
    
        // 全てのloading-spinnerをチェック
        $(".loading-spinner").each(function() {
            // もしdisplayが"none"でなければ、loading-spinnerが見つかったとして処理を抜ける
            if ($(this).css("display") !== "none") {
                isVisible = true;
                return false;
            }
        });
    
        // loading-spinnerが見つかったかどうかの結果を返す
        return isVisible;
    }


function updateBox(boxId, time) {
    let box = $(`.box[data-box-id="${boxId}"]`);
    if (time == -1) {
        box.find(".box-body").text("カゴ打ち");
        box.css("background-color", "lightblue");
        return;
    }
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