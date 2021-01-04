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
        try {
            // 尝试直接删除
            const resp = await axios.delete(`http://${config.bizHost}/doc/${doc.id}?token=${DocAPI.token()}`);
            return resp;
        } catch (err) {
            // 尝试移除自身权限
            const resp = await axios.delete(`http://${config.bizHost}/kick/${doc.id}/${userId}?token=${DocAPI.token()}`);
            return resp;
        }
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
}
