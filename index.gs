const reply_url = 'https://api.line.me/v2/bot/message/reply';
const profile_url = 'https://api.line.me/v2/bot/profile/';

function doGet(e) {
    Logger.log('doget success')
}

function doPost(e) {
    const msg = JSON.parse(e.postData.contents);
    log('doPost argument json parse format :>>', msg);
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
            const gift = msg.replace('聖誕禮物更改', '').trim();
            const giftsTitlePosition = findTextPositionFromSheet('gift');
            const [colSymbol, rowIndex] = findTextPositionFromSheet(userId);
            setInToSheet(`${giftsTitlePosition[0]}${rowIndex}`, gift)
            replyMessage('已經幫你更改生日禮物囉，吼吼吼', token);
        } else {
            defaultNotExistReplyMessage();
        }
    } else if (msg.includes('聖誕禮物')) {
        if (userExist) {
            replyMessage('已經選擇過禮物呦～，想要更改請照以下格式輸入『聖誕禮物更改 老闆的跑車』', token);
        } else {
            const gift = msg.replace('聖誕禮物', '').trim();
            const { name, picture } = getUserProfile(userId);
            appendInToSheet([userId, name, picture, gift]);
            replyMessage('已儲存你想要的禮物，請靜候佳音～', token);
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