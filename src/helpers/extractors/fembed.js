import axios from 'axios';

export const extractFembed = async(url) => {
    try {
        url = new URL(url);
        const fembedApiUrl = url.href.replace('/v/', '/api/source/');
        const res = await axios.post(fembedApiUrl, {
            headers: {
                Referer: url.href,
            },
        });

        if (!res.data.success) return false;

        return {
            headers: {
                Referer: url.href,
            },
            data: res.data.data,
        };
    } catch (e) {
        return { error: 'No sources found!! Try different source\n\n' + e.message };
    }
};