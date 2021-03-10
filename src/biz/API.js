import axios from "axios";
import config from "./config";

export default class API {
    static token() {
        return localStorage.getItem("token")
    }
    static async currentUser(forceUpdate=false) {
        try {
            let resp = await axios.get(`http://${config.bizHost}/reveal/?token=${API.token()}`);
            API.user = resp.data.data;
            return resp;
        } catch (e) {
            return e;
        }
    }
    static revealToken(token) {
        return axios.get(`http://${config.bizHost}/reveal/?token=${token}`);
    }
}
