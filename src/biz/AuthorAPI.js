import axios from "axios";
import config from "./config";

export default class AuthorAPI {
    static queryAuthors(keyword) {
        if (keyword !== undefined)
            return axios.get(`http://${config.bizHost}/author/?q=${keyword}`);
        return axios.get(`http://${config.bizHost}/author/`);
    }
}