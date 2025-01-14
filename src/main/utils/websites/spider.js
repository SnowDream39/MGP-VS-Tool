import axios from "axios";
import html_entities from "html-entities";

// 超超超简易版本的数据采集器

export const regexp = {
    "youtube": /ytInitialPlayerResponse = (.*?);var/,
    "bilibili": /window.__INITIAL_STATE__=(.*?);\(function/,
    "nicovideo": /name=\"server-response\" content=\"(.*)\" \/>/
};

export const instance = axios.create({
    "headers": {
        "accept": "*/*",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "x-frontend-id": "6",
        "accept-language": "zh-CN,zh;q=0.9",
        "x-client-os-type": "others",
        "x-frontend-version": "0"
    },
    "timeout": 5000
});

export async function bilibili(url) {
    let response = (await instance.get(url)).data;

    let data = JSON.parse(response.match(regexp.bilibili)[1]).videoData;

    let count = data.stat;

    return {
        "view": count.view,
        "upload": new Date(data.pubdate * 1000)
    };
}

export async function nicovideo(url) {
    let response = (await instance.get(url)).data;

    let data = JSON.parse(html_entities.decode(
        response.match(regexp.nicovideo)[1]
    )).data.response.video;

    return {
        "view": data.count.view,
        "upload": new Date(data.registeredAt)
    };
}

export async function youtube(url) {
    let response = (await instance.get(url)).data;

    let data = JSON.parse(response.match(regexp.youtube)[1]);

    let video_data = data.microformat.playerMicroformatRenderer;

    return {
        "view": Number(video_data.viewCount),
        "upload": new Date(video_data.uploadDate)
    };
}
