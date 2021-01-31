import axios from "axios";
import config from "./config";

export default class API {
    static token() {
        return localStorage.getItem("token")
    }
    static currentUser() {
        return axios.get(`http://${config.bizHost}/reveal/?token=${API.token()}`);
    }
    static revealToken(token) {
        return axios.get(`http://${config.bizHost}/reveal/?token=${token}`);
    }
}

API.currentUser().then((resp) => {
    API.user = resp.data.data;
})