export const USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36';
export const renameKey = (obj, oldKey, newKey) => {
    if (!obj.hasOwnProperty(oldKey)) return;
    const oldValue = obj[oldKey];
    delete obj[oldKey];
    obj[newKey] = oldValue;
};