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
    static getDoc(docId, code=null) {
        let requrl = `http://${config.bizHost}/doc/${docId}?token=${DocAPI.token()}`;
        if (code !== null) {
            requrl += "&code=" + code;
        }
        return axios.get(requrl);
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
    static genInviteLink(docId, auth) {
        return axios.get(`http://${config.bizHost}/get_invite_link/?token=${DocAPI.token()}&doc_id=${docId}&auth=${auth}`);
    }
    static batchDelete(docIds) {
        return axios.post(`http://${config.bizHost}/batch/delete/doc?token=${DocAPI.token()}`, {
            ids: docIds
        })
    }
}
