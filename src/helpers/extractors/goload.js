import CryptoJS from 'crypto-js';

const keys = {
    key: CryptoJS.enc.Utf8.parse('37911490979715163134003223491201'),
    second_key: CryptoJS.enc.Utf8.parse('54674138327930866480207815084989'),
    iv: CryptoJS.enc.Utf8.parse('3134003223491201'),
};

/**
 * Parses the embedded video URL to encrypt-ajax.php parameters
 * @param {cheerio} $ Cheerio object of the embedded video page
 * @param {string} id Id of the embedded video URL
 */
export async function generateEncryptAjaxParameters($, id) {
    // encrypt the key
    const encrypted_key = CryptoJS.AES['encrypt'](id, keys.key, {
        iv: keys.iv,
    });

    const script = $("script[data-name='episode']").data().value;
    const token = CryptoJS.AES['decrypt'](script, keys.key, {
        iv: keys.iv,
    }).toString(CryptoJS.enc.Utf8);

    return 'id=' + encrypted_key + '&alias=' + id + '&' + token;
}
/**
 * Decrypts the encrypted-ajax.php response
 * @param {object} obj Response from the server
 */
export function decryptEncryptAjaxResponse(obj) {
    const decrypted = CryptoJS.enc.Utf8.stringify(
        CryptoJS.AES.decrypt(obj.data, keys.second_key, {
            iv: keys.iv,
        })
    );
    return JSON.parse(decrypted);
}
