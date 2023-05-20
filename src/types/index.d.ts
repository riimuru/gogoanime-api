export type AnimeList = {
 animeId?: string;
 animeTitle?: string;
 animeUrl?: string;
 animeImg?: string;
 status?: string;
};

export type GogoEpisode = {
 episodeId?: string;
 episodeNum?: number | string;
 episodeUrl?: string;
};

export type Gogoanime = {
 animeId?: string;
 type?: string;
 animeTitle?: string;
 animeImg?: string;
 status?: string;
 genres?: string[];
 otherNames?: string[] | string;
 synopsis?: string;
 totalEpisodes?: number | string;
 episodesList?: GogoEpisode[];
};

/**
 * @typedef {Object} AnimeList
 * @param {AnimeList[]} list out put of the anime list
 * @param {string} keyw query keyword to search
 * @param {string} page current page
 */
export declare function scrapeSearch(
 list: AnimeList[] | null | undefined,
 keyw: string,
 page: number = 1
): Promise<AnimeList[] | null | undefined>;

/**
 *
 * @param animeId anime id to scrape the anime info
 * @returns {Gogoanime} anime info object
 */
export declare function scrapeAnimeDetails(
 animeId: string
): Promise<Gogoanime | null | undefined>;

// TODO: add more functions
