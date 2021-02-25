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
}