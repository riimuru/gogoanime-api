import { scrapeM3U8 } from '../src/anime_parser.js';

test('scraping m3u8 file from vidcdn', async () => {
 const m3u8 = await scrapeM3U8({ id: 'oshi-no-ko-episode-5' });
 expect(m3u8.sources).not.toEqual([]);
});
