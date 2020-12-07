const reply_url = 'https://api.line.me/v2/bot/message/reply';
const profile_url = 'https://api.line.me/v2/bot/profile/';
const push_url = 'https://api.line.me/v2/bot/message/push';

function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}
function lottery() {
    function chooseUser(list, currentIndex, shiftNumber) {
        const num$ = (shiftNumber + currentIndex) % list.length;
        return list[num$];
    }
    const [header, ...infoList] = getAllSheetValue();
    const userIdOfGiftMap = infoList.reduce((map, giftInfo) => {
        map[giftInfo[0]] = {
            id: giftInfo[0],
            name: giftInfo[1],
            pic: giftInfo[2],
            gift: giftInfo[3],
        };
        return map;
    }, {})
    const idList = infoList.map(o => o[0]);
    const shiftNumber = getRandom(1, infoList.length);
    const lotteryMap = infoList.reduce((map, info, index, arr) => {
        const selfId = info[0];
        const id = chooseUser(idList, index, shiftNumber)
        map.push({
            ...userIdOfGiftMap[selfId],
            lottery: userIdOfGiftMap[id]
        });
        return map;
    }, [])

    lotteryMap.forEach((item, _, arr) => {
        const { id, name, lottery } = item;
        const giftMsg = (name, otherName, gift) => (`嗨～${name}!恭喜你抽到 ${otherName} ！\n他對禮物的描述是${gift}。\n你猜得到他想要的是什麼嗎～，去買吧！在聖誕節那天給他個驚喜！！`)
        pushMessage(id, giftMsg(name, lottery.name, lottery.gift))
    })
}

function pushMessage(userId, msg) {
    UrlFetchApp.fetch(push_url, {
        'headers': {
            'Content-Type': 'application/json; charset=UTF-8',
            'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
        },
        'method': 'post',
        'payload': JSON.stringify({
            'to': userId,
            'messages': [{
                type: 'text',
                text: msg,
            }]
        }),
    });
}

function doGet(e) {
    Logger.log('doget success')
}

function doPost(e) {
    const msg = JSON.parse(e.postData.contents);
    const { userMessage, userId, replyToken } = parseUserMessage(msg);

    if (!replyToken || !userId || !userMessage) {
        return;
    }

    parseMessageKeyWord(userMessage, userId, replyToken)
}

function parseUserMessage(msg) {
    const event = msg.events[0];
    if (!event) {
        return {
            userMessage: '',
            userId: '',
            replyToken: '',
        }
    } return {
        userMessage: event.message ? event.message.text.trim() : '',
        userId: event.source.userId,
        replyToken: event.replyToken,
    }
}

function parseMessageKeyWord(msg, userId, token) {
    const userExist = checkUserInSheet(userId);
    const defaultNotExistReplyMessage = (prefix) => replyMessage(`你傳了『${msg}』\n你還沒有選擇想要的禮物呦～,請照以下格式輸入『聖誕禮物 加薪』來選擇你想要的禮物`, token);
    if (msg.includes('聖誕禮物更改')) {
        if (userExist) {
            const gift = msg.split('聖誕禮物更改')[1].trim();
            if (!gift) {
                return replyMessage('沒打禮物還敢更改R，再給你一次機會！', token);
            }
            const giftsTitlePosition = findTextPositionFromSheet('gift');
            const [colSymbol, rowIndex] = findTextPositionFromSheet(userId);
            setInToSheet(`${giftsTitlePosition[0]}${rowIndex}`, gift)
            replyMessage(`已經幫你更改聖誕禮物為『${gift}』，hohoho`, token);
        } else {
            defaultNotExistReplyMessage();
        }
    } else if (msg.includes('聖誕禮物')) {
        if (userExist) {
            replyMessage('已經選擇過禮物呦～，想要更改請照以下格式輸入『聖誕禮物更改 老闆的跑車』', token);
        } else {
            const gift = msg.split('聖誕禮物')[1].trim();
            if (gift) {
                const { name, picture } = getUserProfile(userId);
                appendInToSheet([userId, name, picture, gift]);
                replyMessage(`你想要的禮物是『${gift}』。\n已儲存你想要的禮物，請靜候佳音～`, token);
            } else {
                replyMessage('哎呀，你的禮物空空如也呢！\n再給你一次機會選擇自己想要的禮物吧！', token);
            }
        }
    } else {
        if (userExist) {
            replyMessage('聖誕老人不明白你在說什麼呢～', token)
        } else {
            defaultNotExistReplyMessage();
        }
    }
}

function getUserProfile(userId) {
    try {
        const userProfileURL = `${profile_url}${userId}`;
        const res = UrlFetchApp.fetch(userProfileURL, {
            'headers': {
                'Content-Type': 'application/json; charset=UTF-8',
                'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
            },
            'method': 'GET',
        });
        const data = JSON.parse(res.getContentText());
        return {
            id: data.userId,
            name: data.displayName,
            picture: data.pictureUrl,
            statusMessage: data.statusMessage,
        }
    } catch (e) {
        console.log('getUserProfile error', e)
    }
}

function replyMessage(msg, token) {
    UrlFetchApp.fetch(reply_url, {
        'headers': {
            'Content-Type': 'application/json; charset=UTF-8',
            'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
        },
        'method': 'post',
        'payload': JSON.stringify({
            'replyToken': token,
            'messages': [{
                'type': 'text',
                'text': msg,
            }],
        }),
    });

}