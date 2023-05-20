function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function f_random(length) {
    var i = length,
        str = '';
    while (i > 0x0) {
        i--, (str += getRandomInt(0, 9));
    }
    return str;
}