import axios from "axios";
import API from "./API";
import config from "./config";

export default class DocAPI extends API {
    static createDoc(label, type, userId) {
        return axios.post(
            `http://${config.bizHost}/doc/d/${userId}?token=${DocAPI.token()}`,
            { label, type }
        )
    }
    static getDoc(docId) {
        return axios.get(`http://${config.bizHost}/doc/${docId}?token=${DocAPI.token()}`)
    }
    static rename(doc, newName) {
        doc.label = newName;
        return axios.put(
            `http://${config.bizHost}/doc/${doc.id}?token=${DocAPI.token()}`,
            doc
        )
    }
    static async remove(doc, userId) {
        const resp = await axios.delete(`http://${config.bizHost}/doc/${doc.id}?token=${DocAPI.token()}`);
        return resp;
    }
    static invite(doc, author, role) {
        return axios.post(`http://${config.bizHost}/invite/?token=${DocAPI.token()}`, {
            doc_id: doc.id,
            author_id: author.id,
            role: role
        });
    }
    static kick(doc, author) {
        return axios.delete(`http://${config.bizHost}/kick/${doc.id}/${author.id}?token=${DocAPI.token()}`);
    }
    static search(keywords) {
        return axios.get(`http://${config.bizHost}/batch/query/doc?token=${DocAPI.token()}&keywords=${keywords}`);
    }
}
