import axios from 'axios';
import cheerio from 'cheerio';

import {
 generateEncryptAjaxParameters,
 decryptEncryptAjaxResponse,
} from './helpers/extractors/goload.js';
import { extractStreamSB } from './helpers/extractors/streamsb.js';
import { extractFembed } from './helpers/extractors/fembed.js';
import { USER_AGENT, renameKey } from './utils.js';

const BASE_URL = 'https://gogoanime.film/';
const BASE_URL2 = 'https://gogoanime.gg/';
const ajax_url = 'https://ajax.gogo-load.com/';
const anime_info_url = 'https://gogoanime.film/category/';
const anime_movies_path = '/anime-movies.html';
const popular_path = '/popular.html';
const new_season_path = '/new-season.html';
const search_path = '/search.html';
const popular_ongoing_url = `${ajax_url}ajax/page-recent-release-ongoing.html`;
const recent_release_url = `${ajax_url}ajax/page-recent-release.html`;
const list_episodes_url = `${ajax_url}ajax/load-list-episode`;
const seasons_url = 'https://gogoanime.film/sub-category/';

const Referer = 'https://gogoplay.io/';
const goload_stream_url = 'https://goload.pro/streaming.php';
export const DownloadReferer = 'https://goload.pro/';

const disqus_iframe = (episodeId) =>
 `https://disqus.com/embed/comments/?base=default&f=gogoanimetv&t_u=https%3A%2F%2Fgogoanime.vc%2F${episodeId}&s_o=default#version=cfefa856cbcd7efb87102e7242c9a829`;
const disqus_api = (threadId, page) =>
 `https://disqus.com/api/3.0/threads/listPostsThreaded?limit=100&thread=${threadId}&forum=gogoanimetv&order=popular&cursor=${page}:0:0&api_key=E8Uh5l5fHZ6gD8U3KycjAIAk46f68Zw7C6eW8WSjZvCLXebZ7p0r1yrYDrLilk2F`;

const Genres = [
 'action',
 'adventure',
 'cars',
 'comedy',
 'crime',
 'dementia',
 'demons',
 'drama',
 'dub',
 'family',
 'fantasy',
 'game',
 'gourmet',
 'harem',
 'hentai',
 'historical',
 'horror',
 'josei',
 'kids',
 'magic',
 'martial-arts',
 'mecha',
 'military',
 'music',
 'mystery',
 'parody',
 'police',
 'psychological',
 'romance',
 'samurai',
 'school',
 'sci-fi',
 'seinen',
 'shoujo',
 'shoujo-ai',
 'shounen',
 'shounen-ai',
 'slice-of-Life',
 'space',
 'sports',
 'super-power',
 'supernatural',
 'suspense',
 'thriller',
 'vampire',
 'yaoi',
 'yuri',
 'isekai',
];

const cachedDownloadLinks = {};

export const scrapeFembed = async ({ id }) => {
 try {
  const epPage = await axios.get(BASE_URL2 + id);
  const $ = cheerio.load(epPage.data);

  const server = $('.xstreamcdn > a:nth-child(1)').attr('data-video');
  const serverUrl = new URL(server);

  const sources = await extractFembed(serverUrl.href);

  if (!sources) return { error: 'No sources found!! Try different source.' };

  return sources;
 } catch (e) {
  return { error: e.message };
 }
};

export const scrapeStreamSB = async ({ id }) => {
 try {
  const epPage = await axios.get(BASE_URL2 + id);
  const $ = cheerio.load(epPage.data);

  const server = $(
   'div.anime_video_body > div.anime_muti_link > ul > li.streamsb > a'
  ).attr('data-video');
  const serverUrl = new URL(server);

  const res = await extractStreamSB(serverUrl.href);

  if (!res.stream_data) return { error: 'No sources found!! Try different source.' };

  return {
   headers: { Referer: serverUrl.href, 'User-Agent': USER_AGENT },
   data: [{ file: res.stream_data.file }, { backup: res.stream_data.backup }],
  };
 } catch (err) {
  console.log(err);
  return { error: err.message };
 }
};

export const scrapeM3U8 = async ({ id }) => {
 let sources = [];
 let sources_bk = [];
 try {
  let epPage, server, $, serverUrl;

  if (id) {
   epPage = await axios.get(BASE_URL2 + id);
   $ = cheerio.load(epPage.data);

   server = $('#load_anime > div > div > iframe').attr('src');
   serverUrl = new URL(server);
  } else throw Error('Episode id not found');

  const goGoServerPage = await axios.get(serverUrl.href, {
   headers: { 'User-Agent': USER_AGENT },
  });
  const $$ = cheerio.load(goGoServerPage.data);

  const params = await generateEncryptAjaxParameters(
   $$,
   serverUrl.searchParams.get('id')
  );

  const fetchRes = await axios.get(
   `
        ${serverUrl.protocol}//${serverUrl.hostname}/encrypt-ajax.php?${params}`,
   {
    headers: {
     'User-Agent': USER_AGENT,
     'X-Requested-With': 'XMLHttpRequest',
    },
   }
  );

  const res = decryptEncryptAjaxResponse(fetchRes.data);

  if (!res.source) return { error: 'No sources found!! Try different source.' };

  res.source.forEach((source) => sources.push(source));
  res.source_bk.forEach((source) => sources_bk.push(source));

  return {
   Referer: serverUrl.href,
   sources: sources,
   sources_bk: sources_bk,
  };
 } catch (err) {
  return { error: err };
 }
};

export const scrapeSearch = async ({ list = [], keyw, page = 1 }) => {
 try {
  const searchPage = await axios.get(
   `${BASE_URL + search_path}?keyword=${keyw}&page=${page}`
  );
  const $ = cheerio.load(searchPage.data);

  $('div.last_episodes > ul > li').each((i, el) => {
   list.push({
    animeId: $(el).find('p.name > a').attr('href').split('/')[2],
    animeTitle: $(el).find('p.name > a').attr('title'),
    animeUrl: BASE_URL + '/' + $(el).find('p.name > a').attr('href'),
    animeImg: $(el).find('div > a > img').attr('src'),
    status: $(el).find('p.released').text().trim(),
   });
  });

  return list;
 } catch (err) {
  console.log(err);
  return { error: err };
 }
};

export const scrapeRecentRelease = async ({ list = [], page = 1, type = 1 }) => {
 try {
  const mainPage = await axios.get(`
        ${recent_release_url}?page=${page}&type=${type}
        `);
  const $ = cheerio.load(mainPage.data);

  $('div.last_episodes.loaddub > ul > li').each((i, el) => {
   list.push({
    animeId: $(el).find('p.name > a').attr('href').split('/')[1].split('-episode-')[0],
    episodeId: $(el).find('p.name > a').attr('href').split('/')[1],
    animeTitle: $(el).find('p.name > a').attr('title'),
    episodeNum: $(el).find('p.episode').text().replace('Episode ', '').trim(),
    subOrDub: $(el).find('div > a > div').attr('class').replace('type ic-', ''),
    animeImg: $(el).find('div > a > img').attr('src'),
    episodeUrl: BASE_URL + '/' + $(el).find('p.name > a').attr('href'),
   });
  });
  return list;
 } catch (err) {
  console.log(err);
  return { error: err };
 }
};

export const scrapeNewSeason = async ({ list = [], page = 1 }) => {
 try {
  const popularPage = await axios.get(`
        ${BASE_URL + new_season_path}?page=${page}
        `);
  const $ = cheerio.load(popularPage.data);

  $('div.last_episodes > ul > li').each((i, el) => {
   list.push({
    animeId: $(el).find('p.name > a').attr('href').split('/')[2],
    animeTitle: $(el).find('p.name > a').attr('title'),
    animeImg: $(el).find('div > a > img').attr('src'),
    releasedDate: $(el).find('p.released').text().replace('Released: ', '').trim(),
    animeUrl: BASE_URL + '/' + $(el).find('p.name > a').attr('href'),
   });
  });
  return list;
 } catch (err) {
  console.log(err);
  return { error: err };
 }
};

export const scrapePopularAnime = async ({ list = [], page = 1 }) => {
 try {
  const popularPage = await axios.get(`
        ${BASE_URL + popular_path}?page=${page}
       `);
  const $ = cheerio.load(popularPage.data);

  $('div.last_episodes > ul > li').each((i, el) => {
   list.push({
    animeId: $(el).find('p.name > a').attr('href').split('/')[2],
    animeTitle: $(el).find('p.name > a').attr('title'),
    animeImg: $(el).find('div > a > img').attr('src'),
    releasedDate: $(el).find('p.released').text().replace('Released: ', '').trim(),
    animeUrl: BASE_URL + '/' + $(el).find('p.name > a').attr('href'),
   });
  });
  return list;
 } catch (err) {
  console.log(err);
  return { error: err };
 }
};

export const scrapeAnimeMovies = async ({ list = [], aph = '', page = 1 }) => {
 try {
  const popularPage = await axios.get(`
        ${BASE_URL + anime_movies_path}?aph=${aph.trim().toUpperCase()}&page=${page}
        `);
  const $ = cheerio.load(popularPage.data);

  $('div.last_episodes > ul > li').each((i, el) => {
   list.push({
    animeId: $(el).find('p.name > a').attr('href').split('/')[2],
    animeTitle: $(el).find('p.name > a').attr('title'),
    animeImg: $(el).find('div > a > img').attr('src'),
    releasedDate: $(el).find('p.released').text().replace('Released: ', '').trim(),
    animeUrl: BASE_URL + '/' + $(el).find('p.name > a').attr('href'),
   });
  });
  return list;
 } catch (err) {
  console.log(err);
  return { error: err };
 }
};

export const scrapeTopAiringAnime = async ({ list = [], page = 1 }) => {
 try {
  if (page == -1) {
   let pageNum = 1;
   let hasMore = true;
   while (hasMore) {
    const popular_page = await axios.get(`
                ${popular_ongoing_url}?page=${pageNum}
                `);
    const $ = cheerio.load(popular_page.data);

    if ($('div.added_series_body.popular > ul > li').length == 0) {
     hasMore = false;
     continue;
    }
    $('div.added_series_body.popular > ul > li').each((i, el) => {
     let genres = [];
     $(el)
      .find('p.genres > a')
      .each((i, el) => {
       genres.push($(el).attr('title'));
      });
     list.push({
      animeId: $(el).find('a:nth-child(1)').attr('href').split('/')[2],
      animeTitle: $(el).find('a:nth-child(1)').attr('title'),
      animeImg: $(el)
       .find('a:nth-child(1) > div')
       .attr('style')
       .match('(https?://.*.(?:png|jpg))')[0],
      latestEp: $(el).find('p:nth-child(4) > a').text().trim(),
      animeUrl: BASE_URL + '/' + $(el).find('a:nth-child(1)').attr('href'),
      genres: genres,
     });
    });
    pageNum++;
   }
   return list;
  }

  const popular_page = await axios.get(`
        ${popular_ongoing_url}?page=${page}
        `);
  const $ = cheerio.load(popular_page.data);

  $('div.added_series_body.popular > ul > li').each((i, el) => {
   let genres = [];
   $(el)
    .find('p.genres > a')
    .each((i, el) => {
     genres.push($(el).attr('title'));
    });
   list.push({
    animeId: $(el).find('a:nth-child(1)').attr('href').split('/')[2],
    animeTitle: $(el).find('a:nth-child(1)').attr('title'),
    animeImg: $(el)
     .find('a:nth-child(1) > div')
     .attr('style')
     .match('(https?://.*.(?:png|jpg))')[0],
    latestEp: $(el).find('p:nth-child(4) > a').text().trim(),
    animeUrl: BASE_URL + '/' + $(el).find('a:nth-child(1)').attr('href'),
    genres: genres,
   });
  });

  return list;
 } catch (err) {
  console.log(err);
  return { error: err };
 }
};

export const scrapeGenre = async ({ list = [], genre, page = 1 }) => {
 try {
  genre = genre.trim().replace(/ /g, '-').toLowerCase();

  if (Genres.indexOf(genre) > -1) {
   const genrePage = await axios.get(`${BASE_URL}genre/${genre}?page=${page}`);
   const $ = cheerio.load(genrePage.data);

   $('div.last_episodes > ul > li').each((i, elem) => {
    list.push({
     animeId: $(elem).find('p.name > a').attr('href').split('/')[2],
     animeTitle: $(elem).find('p.name > a').attr('title'),
     animeImg: $(elem).find('div > a > img').attr('src'),
     releasedDate: $(elem).find('p.released').text().replace('Released: ', '').trim(),
     animeUrl: BASE_URL + '/' + $(elem).find('p.name > a').attr('href'),
    });
   });
   return list;
  }
  return { error: 'Genre Not Found' };
 } catch (err) {
  console.log(err);
  return { error: err };
 }
};

// scrapeGenre({ genre: "cars", page: 1 }).then((res) => console.log(res))

/**
 * @param {string} id anime id.
 * @returns Resolves when the scraping is complete.
 * @example
 * scrapeGoGoAnimeInfo({id: "naruto"})
 * .then((res) => console.log(res)) // => The anime information is returned in an Object.
 * .catch((err) => console.log(err))
 *
 */
export const scrapeAnimeDetails = async ({ id }) => {
 try {
  let genres = [];
  let epList = [];

  const animePageTest = await axios.get(`https://gogoanime.gg/category/${id}`);

  const $ = cheerio.load(animePageTest.data);

  const animeTitle = $('div.anime_info_body_bg > h1').text();
  const animeImage = $('div.anime_info_body_bg > img').attr('src');
  const type = $('div.anime_info_body_bg > p:nth-child(4) > a').text();


  const desc = $('div.anime_info_body_bg > p:nth-child(5)')
   .text()
   .replace('Plot Summary: ', '');
  const releasedDate = $('div.anime_info_body_bg > p:nth-child(7)')
   .text()
   .replace('Released: ', '');
  const status = $('div.anime_info_body_bg > p:nth-child(8) > a').text();
  const otherName = $('div.anime_info_body_bg > p:nth-child(9)')
   .text()
   .replace('Other name: ', '')
   .replace(/;/g, ',');

  $('div.anime_info_body_bg > p:nth-child(6) > a').each((i, elem) => {
   genres.push($(elem).attr('title').trim());
  });

  const ep_start = $('#episode_page > li').first().find('a').attr('ep_start');
  const ep_end = $('#episode_page > li').last().find('a').attr('ep_end');
  const movie_id = $('#movie_id').attr('value');
  const alias = $('#alias_anime').attr('value');

  const html = await axios.get(
   `${list_episodes_url}?ep_start=${ep_start}&ep_end=${ep_end}&id=${movie_id}&default_ep=${0}&alias=${alias}`
  );
  const $$ = cheerio.load(html.data);

  $$('#episode_related > li').each((i, el) => {
    let episodeLocale = $(el).find(`div.cate`).text().toLowerCase() ;
   epList.push({
    episodeId: $(el).find('a').attr('href').split('/')[1],
    episodeNum: $(el).find(`div.name`).text().replace('EP ', ''),
    episodeUrl: BASE_URL + $(el).find(`a`).attr('href').trim(),
    isSubbed:  episodeLocale == "sub",
    isDubbed:  episodeLocale == "dub",
   });
  });

  return {
   animeTitle: animeTitle.toString(),
   type: type.toString(),
   releasedDate: releasedDate.toString(),
   status: status.toString(),
   genres: genres,
   otherNames: otherName,
   synopsis: desc.toString(),
   animeImg: animeImage.toString(),
   totalEpisodes: ep_end,
   episodesList: epList,
  };
 } catch (err) {
  console.log(err);
  return { error: err };
 }
};

export const scrapeSeason = async ({ list = [], season, page = 1 }) => {
 try {
  const season_page = await axios.get(`${seasons_url}${season}?page=${page}`);
  const $ = cheerio.load(season_page.data);

  $('div.last_episodes > ul > li').each((i, el) => {
   list.push({
    animeId: $(el).find('div > a').attr('href').split('/')[2],
    animeTitle: $(el).find('div > a').attr('title'),
    animeImg: $(el).find('div > a > img').attr('src'),
    animeUrl: BASE_URL + '/' + $(el).find('div > a').attr('href'),
   });
  });

  return list;
 } catch (err) {
  console.log(err);
  return { error: err };
 }
};

// scrapeAnimeDetails({ id: "naruto" }).then((res) => console.log(res))

export const scrapeThread = async ({ episodeId, page = 0 }) => {
 try {
  let threadId = null;

  const thread_page = await axios.get(disqus_iframe(decodeURIComponent(episodeId)));
  const $ = cheerio.load(thread_page.data, { xmlMode: true });

  const thread = JSON.parse($('#disqus-threadData')[0].children[0].data);

  if (thread.code === 0 && thread.cursor.total > 0) {
   threadId = thread.response.thread.id;
  }

  const thread_api_res = (await axios.get(disqus_api(threadId, page))).data;

  return {
   threadId: threadId,
   currentPage: page,
   hasNextPage: thread_api_res.cursor.hasNext,
   comments: thread_api_res.response,
  };
 } catch (err) {
  if (err.response.status === 400) {
   return { error: 'Invalid page. Try again.' };
  }
  return { error: err };
 }
};

// export const scrapeDownloadLinks = async({ episodeId }) => {
//     if (!episodeId) {
//         return { error: 'No episode id provided' };
//     }

//     if (cachedDownloadLinks[episodeId]) {
//         if (
//             parseInt(
//                 new URL(cachedDownloadLinks[episodeId].sources[0].url).searchParams.get('expires')
//             ) <
//             Date.now() + 1.08e7
//         ) {
//             return cachedDownloadLinks[episodeId];
//         }
//     }

//     const browser = await puppeteer.launch({
//         args: ['--no-sandbox', '--disable-setuid-sandbox'],
//     });

//     try {
//         const download_links = [];

//         const e_page = await axios.get(`https://gogoanime.gg/${episodeId}`);

//         const $ = cheerio.load(e_page.data);

//         const d_link = $(
//             `div.anime_video_body > div.download-anime > div > ul > li.dowloads > a`
//         ).attr('href');

//         const d_page = await browser.newPage();
//         await d_page.setUserAgent(userAgent.toString());
//         await d_page.goto(d_link, { waitUntil: 'networkidle2' });

//         const d_links = await d_page.$$eval(
//             'div.mirror_link:nth-child(1) > div.dowload',
//             (links) =>
//             links.map((link) => {
//                 return {
//                     quality: link.children[0].innerHTML.split('(')[1].split('P')[0] + 'p',
//                     url: link.children[0].getAttribute('href'),
//                 };
//             })
//         );

//         await Promise.all(
//             d_links.map(async(obj, i) => {
//                 await axios
//                     .get(obj.url)
//                     .catch(
//                         (err) => (d_links.at(i).url = `${err.response.request._redirectable._options.href}`)
//                     );
//             })
//         );

//         cachedDownloadLinks[episodeId] = {
//             headers: {
//                 Referer: DownloadReferer,
//             },
//             sources: d_links,
//         };

//         await browser.close();

//         return {
//             headers: {
//                 Referer: DownloadReferer,
//             },
//             sources: [...d_links],
//         };
//     } catch (err) {
//         await browser.close();
//         return { error: err };
//     }
// };
