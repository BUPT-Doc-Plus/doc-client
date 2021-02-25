import axios from "axios";
import config from "./config";

export default class AuthorAPI {
    static queryAuthors(keyword) {
        if (keyword !== undefined)
            return axios.get(`http://${config.bizHost}/author/?q=${keyword}`);
        return axios.get(`http://${config.bizHost}/author/`);
    }
    static exist(email) {
        return axios.get(`http://${config.bizHost}/check/author?email=${email}`);
    }
    static activate(code, token) {
        return axios.post(`http://${config.bizHost}/check/author`, {
            code, token
        })
    }
    static login(email, password) {
        return axios.post(`http://${config.bizHost}/auth/`, {
            email, password
        })
    }
    static register(nickname, email, password) {
        return axios.post(`http://${config.bizHost}/author/`, {
            nickname, email, password
        })
    }
    static getAuthorById(id) {
        return axios.get(`http://${config.bizHost}/author/${id}`);
    }
}