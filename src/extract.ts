import path from "path";
import {
  setupCache,
  exportData,
  toCSVContent,
  getCSVHeaders,
  ExtractOptions,
  UrlInfo,
  printExtractSummary,
  TwitterResponse,
} from "./utils";
import _ from "lodash";
import fetch from "node-fetch";
import fs from "fs";
import parseCSV from "csv-parse/lib/sync";
import { Cache } from "cache-manager";

const getGuestToken = async (authToken: string) => {
  const result = await fetch(
    "https://api.twitter.com/1.1/guest/activate.json",
    {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9,fr;q=0.8",
        authorization: `Bearer ${authToken}`,
        "content-type": "application/x-www-form-urlencoded",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "x-twitter-active-user": "yes",
        "x-twitter-client-language": "en",
      },
      method: "POST",
    }
  );

  const resultJson = await result.json();
  return resultJson.guest_token;
};

const getTweetInfo = async ({
  tweetId,
  authToken,
  guestToken,
  cache,
  sleep,
}: {
  tweetId: string;
  authToken: string;
  guestToken: string;
  cache: Cache;
  sleep: number;
}) => {
  return await cache.wrap(`tweet-${tweetId}`, async () => {
    await pause(sleep);
    console.log(`Cache miss for tweet ${tweetId}`);

    const url = `https://twitter.com/i/api/2/timeline/conversation/${tweetId}.json?include_profile_interstitial_type=1&include_blocking=1&include_blocked_by=1&include_followed_by=1&include_want_retweets=1&include_mute_edge=1&include_can_dm=1&include_can_media_tag=1&skip_status=1&cards_platform=Web-12&include_cards=1&include_ext_alt_text=true&include_quote_count=true&include_reply_count=1&tweet_mode=extended&include_entities=true&include_user_entities=true&include_ext_media_color=true&include_ext_media_availability=true&send_error_codes=true&simple_quoted_tweet=true&count=20&include_ext_has_birdwatch_notes=false&ext=mediaStats%2ChighlightedLabel`;

    const result = await fetch(url, {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9,fr;q=0.8",
        authorization: `Bearer ${authToken}`,
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-guest-token": `${guestToken}`,
        "x-twitter-active-user": "yes",
        "x-twitter-client-language": "en",
      },
      body: null,
      method: "GET",
    });

    return await result.json();
  });
};

const tweetUrlRegex = /https:\/\/twitter\.com\/.+\/status\/(\d+)/;

const extractUrls = async ({
  urlsToScan,
  cache,
  authToken,
  guestToken,
  sleep,
}: {
  urlsToScan: string[];
  cache: Cache;
  authToken: string;
  guestToken: string;
  sleep: number;
}) => {
  const urlInfos: UrlInfo[] = await Promise.all(
    urlsToScan.map(async (url) => {
      const tweetId = tweetUrlRegex.exec(url)[1];

      try {
        const resultJson: TwitterResponse = await getTweetInfo({
          cache,
          authToken,
          guestToken,
          tweetId,
          sleep,
        });

        if (resultJson.errors) {
          console.log(resultJson.errors);
          return {
            url,
            type: "ERROR",
            related_to: "",
            retweet_count: -1,
            favorite_count: -1,
            reply_count: -1,
            quote_count: -1,
          };
        }

        const tweet = resultJson.globalObjects.tweets[tweetId];
        let type = "ORIGINAL";
        let related_to = "";
        if (tweet.in_reply_to_status_id_str) {
          type = "REPLY";
          related_to = tweet.in_reply_to_status_id_str;
        } else if (tweet.quoted_status_id_str) {
          type = "QUOTE";
          related_to = tweet.quoted_status_id_str;
        } else if (tweet.retweeted_status_id_str) {
          type = "RETWEET";
          related_to = tweet.retweeted_status_id_str;
        }

        return {
          url,
          type,
          related_to,
          retweet_count: tweet.retweet_count,
          favorite_count: tweet.favorite_count,
          reply_count: tweet.reply_count,
          quote_count: tweet.quote_count,
        };
      } catch (e) {
        console.log(e);
        return {
          url,
          type: "ERROR",
          related_to: "",
          retweet_count: -1,
          favorite_count: -1,
          reply_count: -1,
          quote_count: -1,
        };
      }
    })
  );

  return urlInfos;
};

const pause = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const extract = async ({
  urls,
  columnName,
  input,
  output,
  cacheExpiry,
  cachePath,
  sleep,
  bucket,
  limit,
  token,
}: ExtractOptions) => {
  const cache = await setupCache({
    days: cacheExpiry,
    path: cachePath,
  });

  let urlsToScan = urls;
  let csv;
  if (input && columnName) {
    const inputFile = fs.readFileSync(input, { encoding: "utf-8" });
    csv = parseCSV(inputFile, { columns: true });
    urlsToScan = csv.map((row: any) => row[columnName]);
  }

  if (limit > 0) {
    urlsToScan = urlsToScan.slice(0, limit);
  }

  const urlsBuckets = _.chunk(urlsToScan, bucket);

  console.log(
    `Estimated time: ${(urlsBuckets.length * sleep) / 60000} minutes`
  );

  const results = [];
  for (let i = 0; i < urlsBuckets.length; i++) {
    console.log(`Batch ${i}`);
    const bucket = urlsBuckets[i];
    const guestToken = await getGuestToken(token);
    const urlInfos = await extractUrls({
      urlsToScan: bucket,
      cache,
      guestToken,
      authToken: token,
      sleep,
    });
    results.push(urlInfos);
    console.log(`End of batch ${i}`);
  }

  const urlInfos = _.flatten(results);

  const defaultFileName = "results.csv";
  let filePath: string;
  if (output !== undefined) {
    const outputHasFileName = output && path.parse(output).ext !== "";
    filePath = outputHasFileName ? output : path.join(output, defaultFileName);
  } else {
    filePath = defaultFileName;
  }

  if (csv) {
    const currentHeaders = _.keys(csv[0]).filter(
      (x: string) => x !== columnName
    );
    const csvHeaders = [columnName, ...getCSVHeaders(), ...currentHeaders].join(
      ","
    );

    const rowsByUrl = _.mapKeys(csv, (row: any) => row[columnName]);

    const csvContent = urlInfos
      .map((u) =>
        [
          u.url,
          u.type,
          u.retweet_count,
          u.favorite_count,
          u.reply_count,
          u.quote_count,
          u.related_to,
          ...currentHeaders.map((head: string) => {
            return `"${rowsByUrl[u.url][head].replace(/"/g, '""')}"`;
          }),
        ].join(",")
      )
      .join(`\n`);

    exportData({
      content: `${csvHeaders}\n${csvContent}`,
      filePath,
    });
  } else {
    const csvHeaders = ["url", ...getCSVHeaders()].join(",");
    exportData({
      content: `${csvHeaders}\n${toCSVContent({
        urlInfos,
      })}`,
      filePath,
    });
  }

  printExtractSummary({ filePath, urlInfos, limit });
};
