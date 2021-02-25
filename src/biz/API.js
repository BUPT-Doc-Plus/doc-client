import axios from "axios";
import config from "./config";

export default class API {
    static token() {
        return localStorage.getItem("token")
    }
    static currentUser(forceUpdate=false) {
        if (API.user === undefined || forceUpdate)
            return new Promise((resolve, reject) => {
                axios.get(`http://${config.bizHost}/reveal/?token=${API.token()}`).then((resp) => {
                    API.user = resp.data.data;
                    resolve(resp);
                }).catch((err) => {
                    reject(err);
                })
            })
        else return new Promise((resolve) => {
            resolve({data: {data: API.user}});
        })
    }
    static revealToken(token) {
        return axios.get(`http://${config.bizHost}/reveal/?token=${token}`);
    }
}
