import Axios from "axios";
import {tbkCommonB, tbkCommonF} from "./typedefs";

declare const wpApiSettings: { nonce: any; };
declare const TBK: tbkCommonF;
declare const tbkCommon: tbkCommonB;

const Api = Axios.create({
    baseURL: (typeof TBK !== 'undefined') ? TBK.restRouteRoot : (typeof tbkCommon !== 'undefined' ? tbkCommon.restRouteRoot : null),
    headers: {
        'Content-Type': 'application/json',
        'Accept'      : 'application/json',
        'X-WP-Nonce'  : wpApiSettings.nonce
    }
});

export default Api;