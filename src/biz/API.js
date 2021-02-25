import axios from "axios";
import config from "./config";

export default class API {
    static token() {
        return localStorage.getItem("token")
    }
    static currentUser() {
        if (API.user === undefined)
            return axios.get(`http://${config.bizHost}/reveal/?token=${API.token()}`);
        else return new Promise((resolve) => {
            resolve({data: {data: API.user}});
        })
    }
    static revealToken(token) {
        return axios.get(`http://${config.bizHost}/reveal/?token=${token}`);
    }
}

API.currentUser().then((resp) => {
    API.user = resp.data.data;
})
