import axios from 'axios';

import { USER_AGENT } from '../../utils.js';

const HOST = 'https://sbplay2.com/sources43';

const PAYLOAD = (hex) =>
    `7361696b6f757c7c${hex}7c7c7361696b6f757c7c73747265616d7362/7361696b6f757c7c363136653639366436343663363136653639366436343663376337633631366536393664363436633631366536393664363436633763376336313665363936643634366336313665363936643634366337633763373337343732363536313664373336327c7c7361696b6f757c7c73747265616d7362`;

export const extractStreamSB = async(url) => {
    url = new URL(url);

    const id = url.href.split('/e/').pop();
    let arrBytes = new TextEncoder().encode(id);

    const res = await axios.get(`${HOST}/${PAYLOAD(toHexString(Array.from(arrBytes)))}`, {
        headers: { watchsb: 'streamsb', 'User-Agent': USER_AGENT },
    });

    return res.data;
};

function toHexString(byteArray) {
    return Array.from(byteArray, function(byte) {
        return ('0' + (byte & 0xff).toString(16)).slice(-2);
    }).join('');
}