(function(){
    "use strict";

    const dev = false;
    const fs = require('fs');
    const tess = require('tesseract.js');
    const win = require('electron').remote.getCurrentWindow();
    //const {ipcRenderer} = require('electron');
    const jimp = require("jimp");
    const compare = require('hamming-distance');
    const remote = require('electron').remote;
    const dialog = remote.dialog;
    const {BrowserWindow} = require('electron').remote;
    const path = require('path');
    const app = remote.require('electron').app;
    
    const banketsu = 'http://pc-play.games.dmm.com/play/icchibanketu';
    const rootPath = app.getPath('pictures');
    
    const web_view = document.getElementById('webview');
    const mute = document.getElementById('mute');
    const notifyDesktop = document.getElementById('notify_desktop');
    const notifyIcon = document.getElementById('notify_icon');
    
    let aryNotification = [];
    
    window.Tesseract = tess.create({
        workerPath: "renderer.js",
        langPath: "eng.traineddata",
        corePath: "node_modules/tesseract.js-core/index.js"
    });

    //ミュート
    let setMute = function(){
        web_view.setAudioMuted(mute.checked);
        localStorage.setItem('mute', mute.checked);
    };
    mute.addEventListener('change', setMute, false);
    
    //通知設定
    let setNotifyDesktop = function(){
        localStorage.setItem('notifyDesktop', notifyDesktop.checked);
    };
    notifyDesktop.addEventListener('change', setNotifyDesktop, false);
    
    let setNotifyIcon = function(){
        localStorage.setItem('notifyIcon', notifyIcon.checked);
    };
    notifyIcon.addEventListener('change', setNotifyIcon, false);
    
    //通知アイコン初期化
    let clearInfo = function(elmId){
        document.getElementById(elmId).className = 'fa';
    };

    //時間表示初期化
    let clearTime = function(elmId){
        const elm = document.getElementById(elmId);
        if(elm.innerHTML === '00:00:00'){
            elm.innerHTML = '';
            if(aryNotification.indexOf(elmId) !== -1){
                aryNotification.splice(aryNotification.indexOf(elmId), 1);
            }
        }
    };

    //フォルダ取得
    let getFolder = function(){
        let folder = '';
        if(localStorage.save && localStorage.save !== 'undefined'){
            folder = localStorage.getItem('save');
        }else{
            folder = rootPath;
        }        
        return folder;
    };

    //読み込み時
    window.onload = function(){
        //ゲームページへ遷移
        web_view.src = banketsu;

        //ミュート設定復元
        if(localStorage.getItem('mute')){
            mute.checked = localStorage.getItem('mute') === 'true' ? true : false;
        }else{
            mute.checked = false;
        }

        //通知設定復元
        if(localStorage.notifyDesktop && localStorage.notifyDesktop !== 'undefined'){
            notifyDesktop.checked = localStorage.notifyDesktop === 'true' ? true : false;
        }else{
            notifyDesktop.checked = true;
        }
        if(localStorage.notifyIcon && localStorage.notifyIcon !== 'undefined'){
            notifyIcon.checked = localStorage.notifyIcon === 'true' ? true : false;
        }else{
            notifyIcon.checked = true;
        }

        //ウィンドウ位置復元
        if(localStorage.getItem('window_position')){
            const pos = JSON.parse(localStorage.getItem('window_position'));
            win.setPosition(pos[0], pos[1]);
        }

        //ウィンドウモード復元
        modeCompact();

        //通知アイコン初期化
        clearInfo('reibyou_info');
        clearInfo('karou_info');
        clearInfo('ensei_info');
        clearInfo('sigyoku_info');

        //ウィンドウ表示
        win.show();
    };

    //ページ読み込み
    web_view.addEventListener('dom-ready', function(){
        if(dev === true){
            web_view.openDevTools();
        }
        if(web_view.src === banketsu){
            //ゲームページ
            //webview側にメッセージ送信
            web_view.send('page_load_start');
        }
        setMute();
    });
    
    //ウィンドウ位置記憶
    win.on('move', function(){
        localStorage.setItem('window_position', JSON.stringify(win.getPosition()));
    });

    //画像保存
    let savePicture = function(){
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = ('00' + (today.getMonth() + 1)).slice(-2);
        const dd = ('00' + today.getDate()).slice(-2);
        const hh = ('00' + today.getHours()).slice(-2);
        const nn = ('00' + today.getMinutes()).slice(-2);
        const ss = ('00' + today.getSeconds()).slice(-2);
        const sss =('000' + today.getMilliseconds()).slice(-3);
        web_view.capturePage({
            x: 0,
            y: 0,
            width: 1024,
            height: 576
        }, function(img){
            let save = getFolder();
            fs.writeFileSync(path.join(save, 'バンケツ_' + yyyy + mm + dd + hh + nn + ss + sss + '.png'), img.toPng());
        });
    };

    //「画像保存」クリック
    document.getElementById('pic').addEventListener('mousedown', function(e){
        if(e.shiftKey){
            //Shift+クリック：保存フォルダ変更
            let focusWindow = BrowserWindow.getFocusedWindow();
            const folder = getFolder();
            dialog.showOpenDialog(focusWindow, {
                properties: ['openDirectory'],
                defaultPath: folder
            }, function(files){
                localStorage.setItem('save', files);
            });
        }else if(e.button === 2){
            //右クリック：保存フォルダを開く
            let focusWindow = BrowserWindow.getFocusedWindow();
            const folder = getFolder();
            dialog.showOpenDialog(focusWindow, {
                properties: ['openDirectory'],
                defaultPath: folder
            });
        }else if(e.button === 0){
            //左クリック：画像保存
            savePicture();            
        }
    }, false);

    //再読み込みボタン
    document.getElementById('reload').addEventListener('click', function(){
        web_view.reload();
    });

    //右下クリック
    let migisita = document.getElementById('migisita_info');
    let modeCompact = function(){
        if(localStorage.compact && localStorage.compact !== 'undefined'){
            if(localStorage.compact === 'true'){
                //コンパクトモード
                win.setSize(1024, 635);
                migisita.className = 'fa fa-chevron-down';
            }else{
                //詳細モード
                win.setSize(1024, 800);
                migisita.className = 'fa fa-chevron-up';
            }
        }else{
            //詳細モード
            win.setSize(1024, 800);
            migisita.className = 'fa fa-chevron-up';
        }
    };
    migisita.addEventListener('click', function(){
        if(localStorage.compact && localStorage.compact !== 'undefined'){
            localStorage.compact = (localStorage.compact === 'true' ? 'false' : 'true');
        }else{
            localStorage.compact = 'false';
        }
        modeCompact();
    }, false);

    //OCR
    let getImageText = function(img, id, time){
        tess.recognize(img, {
            lang: 'eng'
        })
        .catch(err => console.log(err))
        .then(function(result){
            setTime(result.text, id, time);
        });
    };

    //時間の計算
    let addTime = {
        toAdd: function(){
            let times = arguments[0].split(':');
            let second = this.toSecond(times[0], times[1], times[2]);
            let result = second + arguments[1];
            return this.toTimeFormat(result);
        },
        toSecond: function(hour, minute, second){
            return (Number(hour) * 60 * 60) + (Number(minute) * 60) + Number(second);
        },
        toTimeFormat: function(fulllSecond){
            let hour   = Math.floor(Math.abs(fulllSecond) / 3600);
            let minute = Math.floor(Math.abs(fulllSecond) % 3600 / 60);
            let second = Math.floor(Math.abs(fulllSecond) % 60);

            hour = ('00' + hour).slice(-2);
            minute = ('00' +minute).slice(-2);
            second = ('00' +second).slice(-2);

            return hour + ':' + minute + ':' + second;
        }
    };

    //画像から取得した時間をラベルに格納
    let setTime = function(result, id, time){
        let label = document.getElementById(id);
        let rText = result.replace(/\s/gi, '');
        const re = /([0-9][0-9]:[0-9][0-9]:[0-9][0-9])/gi;
        if(re.test(rText) || re.test(label.innerHTML === false)){
            rText = rText.replace(re, '$1');
            const nowTIme = new Date();
            const delay = time.getTime() - nowTIme.getTime();
            if(rText === '00:00:00'){
                label.innerHTML = '00:00:00';
            }else if(rText === ''){
                label.innerHTML = '';
            }else{
                label.innerHTML = addTime.toAdd(rText, delay / 1000);
            }
        }
    };

    //通知を出す
    let notification = function(elmId, type){
        //アイコン通知
        if(notifyIcon.checked === true){
            document.getElementById(type).className='fa fa-exclamation'; 
        }

        //デスクトップ通知
        if(notifyDesktop.checked === true){
            if(aryNotification.indexOf(elmId) !== -1){
                //既に通知が出ていた場合
            }else{
                //まだ通知されていない場合
                let taisyou = '';
                if(type.indexOf('reibyou') >= 0){
                    taisyou = '魂の回復';
                }else if(type.indexOf('karou') >= 0){
                    taisyou = '生成';
                }else if(type.indexOf('ensei') >= 0){
                    taisyou = '遠征';
                }else if(type.indexOf('sigyoku') >= 0){
                    taisyou = '紫玉の回復';
                }
                let nt = new Notification('バンケツくんブラウザ', {
                    body: taisyou + ' が終了しました',
                    icon: path.join(__dirname, 'favicon.ico'),
                });
                aryNotification.push(elmId);
            }
        }
    };
    

    //時間の表示更新処理
    let timeCountElement = function(elm, infoId){
        const re = /([0-9][0-9]:[0-9][0-9]:[0-9][0-9])/gi;
        if(re.test(elm.innerHTML)){
            if(elm.innerHTML === '00:00:00'){
                notification(elm.id, infoId);
            }else{
                clearInfo(infoId);
                elm.innerHTML = addTime.toAdd(elm.innerHTML, -1);
            }
        }else{
            //何もしない
        }
    };

    //紫玉の回復時間
    let updateSigyoku = function(){
        const re = /[0-9][0-9]分/gi;
        let elm = document.getElementById('sigyoku_01');
        const time = elm.innerHTML;
        if(re.test(time)){
            if(elm.innerHTML === '約00分'){
                notification(elm.id, 'sigyoku_info');
            }else{
                document.getElementById('sigyoku_info').className='fa';
                const hour = time.replace(/約([0-9]*)時間.*/gi, '$1');
                const minute = time.replace(/.*([0-9][0-9])分/gi, '$1');
                const newTime = addTime.toAdd((hour === time ? '00' : ('00' + hour).slice(-2)) + ':' + minute + ':' + ':00', -60);
                const newHour = newTime.replace(/[0-9]([0-9]):([0-9][0-9]):([0-9][0-9])/gi, '$1');
                const newMinute = newTime.replace(/[0-9]([0-9]):([0-9][0-9]):([0-9][0-9])/gi, '$2');
                elm.innerHTML = '約' + (newHour === '0' ? '' : newHour + '時間') + newMinute + '分';
            }
        }else{
            //何もしない
        }
    };

    //時間表示
    let displayTime = function(){
        const nowTime = new Date();
        const hh = ('00' + nowTime.getHours()).slice(-2);
        const mm = ('00' + nowTime.getMinutes()).slice(-2);
        document.getElementById('time').innerHTML = hh + ':' + mm;
    };

    //花廊の時間取得
    document.getElementById('karou').addEventListener('click', function(){
        clearInfo('karou_info');
        clearTime('karou_01');
        clearTime('karou_02');
        clearTime('karou_03');
        clearTime('karou_04');
        //苗床一
        web_view.capturePage({
            x: 407,
            y: 295,
            width: 100,
            height: 20
        }, function(img){
            getImageText(img.toPng(), 'karou_01', new Date());
        });
        //苗床二
        web_view.capturePage({
            x: 775,
            y: 350,
            width: 100,
            height: 20
        }, function(img){
            getImageText(img.toPng(), 'karou_02', new Date());
        });
        //苗床三
        web_view.capturePage({
            x: 230,
            y: 410,
            width: 100,
            height: 20
        }, function(img){
            getImageText(img.toPng(), 'karou_03', new Date());
        });
        //苗床四
        web_view.capturePage({
            x: 585,
            y: 460,
            width: 100,
            height: 20
        }, function(img){
            getImageText(img.toPng(), 'karou_04', new Date());
        });
    });

    //霊廟の時間取得
    document.getElementById('reibyou').addEventListener('click', function(){
        clearInfo('reibyou_info');
        clearTime('reibyou_01');
        clearTime('reibyou_02');
        clearTime('reibyou_03');
        clearTime('reibyou_04');
        //第一廟室
        web_view.capturePage({
            x: 155,
            y: 533,
            width: 100,
            height: 20
        }, function(img){
            getImageText(img.toPng(), 'reibyou_01', new Date());
        });
        //第二廟室
        web_view.capturePage({
            x: 380,
            y: 533,
            width: 100,
            height: 20
        }, function(img){
            getImageText(img.toPng(), 'reibyou_02', new Date());
        });
        //第三廟室
        web_view.capturePage({
            x: 615,
            y: 533,
            width: 100,
            height: 20
        }, function(img){
            getImageText(img.toPng(), 'reibyou_03', new Date());
        });
        //第四廟室
        web_view.capturePage({
            x: 850,
            y: 533,
            width: 100,
            height: 20
        }, function(img){
            getImageText(img.toPng(), 'reibyou_04', new Date());
        });
    });

    //遠征の時間取得
    document.getElementById('ensei').addEventListener('click', function(){
        clearInfo('ensei_info');
        clearTime('ensei_01');
        clearTime('ensei_02');
        clearTime('ensei_03');
        clearTime('ensei_04');
        //第一廟室
        web_view.capturePage({
            x: 440,
            y: 462,
            width: 100,
            height: 20
        }, function(img){
            getImageText(img.toPng(), 'ensei_01', new Date());
        });
        //第二廟室
        web_view.capturePage({
            x: 585,
            y: 462,
            width: 100,
            height: 20
        }, function(img){
            getImageText(img.toPng(), 'ensei_02', new Date());
        });
        //第三廟室
        web_view.capturePage({
            x: 730,
            y: 462,
            width: 100,
            height: 20
        }, function(img){
            getImageText(img.toPng(), 'ensei_03', new Date());
        });
        //第四廟室
        web_view.capturePage({
            x: 880,
            y: 462,
            width: 100,
            height: 20
        }, function(img){
            getImageText(img.toPng(), 'ensei_04', new Date());
        });
    });

    //時間の表示更新
    let timeCount = function(){
        timeCountElement(document.getElementById('reibyou_01'), 'reibyou_info');
        timeCountElement(document.getElementById('reibyou_02'), 'reibyou_info');
        timeCountElement(document.getElementById('reibyou_03'), 'reibyou_info');
        timeCountElement(document.getElementById('reibyou_04'), 'reibyou_info');
        timeCountElement(document.getElementById('karou_01'), 'karou_info');
        timeCountElement(document.getElementById('karou_02'), 'karou_info');
        timeCountElement(document.getElementById('karou_03'), 'karou_info');
        timeCountElement(document.getElementById('karou_04'), 'karou_info');
        timeCountElement(document.getElementById('ensei_01'), 'ensei_info');
        timeCountElement(document.getElementById('ensei_02'), 'ensei_info');
        timeCountElement(document.getElementById('ensei_03'), 'ensei_info');
        timeCountElement(document.getElementById('ensei_04'), 'ensei_info');
    };

    let timeCountSigyoku = function(){
        updateSigyoku();
    };

    let countSigyokuTime = function(minIdx, idx){
        let sigyoku = 0;
        if(minIdx === 2){
            //紫玉半分だけたまってる
            sigyoku = 0.5;
        }else{
            sigyoku = 0;
        }
        let cnt = idx + sigyoku;
        const sigyokuTime = cnt * 30;
        document.getElementById('sigyoku_01').innerHTML = '約' + (sigyokuTime < 60 ? '' : Math.floor(sigyokuTime / 60) + '時間') + ('00' + sigyokuTime % 60).slice(-2) + '分';
    };
    
    //紫玉の個数カウント
    let countSigyoku = function(idx, aryPattern){
        //右からカウント
        const arySigyoku = [891, 838, 785, 732, 679, 626, 573, 520];
        web_view.capturePage({
            x: arySigyoku[idx],
            y: 365,
            width: 28,
            height: 28
        }, function(img){
            const imgBuffer = new Buffer(img.toPng());//, 'base64');
            jimp.read(imgBuffer, function(err, image){
                if(err){
                    console.log(err);
                }
                const imgIdx = image.hash(16);
                let aryCompare = [];
                //ハッシュ値比較
                for(let i = 0; i < aryPattern.length; i++){
                    aryCompare[i] = compare(new Buffer(imgIdx, 'hex'), new Buffer(aryPattern[i], 'hex'));
                }
                //ハッシュの最小値を求める
                const minIdx = aryCompare.indexOf(Math.min.apply(null, aryCompare));
                if(aryCompare[minIdx] < 15){
                    //最小のハッシュ値の差が15を超えていたら別画像のため処理中止
                    if(minIdx === 3){
                        //紫玉がたまっていないので処理継続
                        if(idx + 1 < arySigyoku.length){
                            return countSigyoku(idx + 1, aryPattern);
                        }else{
                            countSigyokuTime(minIdx, idx + 1);
                        }
                    }else{
                        countSigyokuTime(minIdx, idx);
                        return 0;
                    }
                }else{
                    //何もしない
                    return -1;                    
                }
            });
        });
    };

    //紫玉
    document.getElementById('sigyoku').addEventListener('click', function(){
        //サンプル画像をハッシュ化して配列に格納
        const aryPattern = ['d35864a39b088208', 'df786ea29a088000', '9f3860c69b008e82', '9f21600387828a00'];
        countSigyoku(0, aryPattern);
    });

    setInterval(timeCount, 1000);   //霊廟・花廊・遠征の時間更新
    setInterval(timeCountSigyoku, 1000 * 60);    //紫玉の回復時間更新
    setInterval(displayTime, 1000);
    
    //webview側からのメッセージ受信
    web_view.addEventListener('ipd-message', function(event){
        switch(event.cannel){
            case 'page_load_end':
            console.log(event);
            break;
        }
    });

    //HTTPリクエスト検知
    web_view.addEventListener("did-get-response-details", function(details) {
        if(details.requestMethod === 'POST' && details.newURL.indexOf('itchibanketsu') >= 0){
            const URL = details.newURL;
            //各画面に遷移したら通知アイコンを消す
            if(URL.indexOf('seedbeds') >= 0){
                //花廊
                clearInfo('karou_info');
                clearTime('karou_01');
                clearTime('karou_02');
                clearTime('karou_03');
                clearTime('karou_04');
            }else if(URL.indexOf('pavilion') >= 0){
                //霊廟
                clearInfo('reibyou_info');
                clearTime('reibyou_01');
                clearTime('reibyou_02');
                clearTime('reibyou_03');
                clearTime('reibyou_04');
            }else if(URL.indexOf('expedition') >= 0){
                //遠征
                clearInfo('ensei_info');
                clearTime('ensei_01');
                clearTime('ensei_02');
                clearTime('ensei_03');
                clearTime('ensei_04');
            } 
        }
    });    

}());