import axios from "axios";
import API from "./API";
import config from "./config";

export default class ChatAPI extends API {
    static getAllChats(userId) {
        return axios.get(`http://${config.bizHost}/chat/?token=${ChatAPI.token()}&a1=${userId}`);
    }
    static getChatById(chatId) {
        return axios.get(`http://${config.bizHost}/chat/${chatId}?token=${ChatAPI.token()}`);
    }
    static getRecords(chat_id, page, pageSize) {
        return axios.get(`http://${config.bizHost}/get_records?token=${ChatAPI.token()}&chat_id=${chat_id}&page=${page}&page_size=${pageSize}`);
    }
    static search(keywords) {
        return axios.get(`http://${config.bizHost}/message/query?token=${ChatAPI.token()}&keywords=${keywords}`);
    }
}