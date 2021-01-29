import _ from "lodash";
import cacheManager from "cache-manager";
import fsStore from "cache-manager-fs";
import fs from "fs";
import path from "path";
import { Cache } from "cache-manager";

export type ExtractOptions = {
  urls?: string[];
  input?: string;
  columnName?: string;
  token: string;
  output: string;
  cacheExpiry: number;
  cachePath: string;
  sleep: number;
  bucket: number;
  limit: number;
  debug: boolean;
};

type ExportOptions = {
  content: string;
  filePath: string;
};

export type UrlInfo = {
  url: string;
  type: string;
  related_to: string;
  retweet_count: number;
  favorite_count: number;
  reply_count: number;
  quote_count: number;
};

export type TwitterResponse = {
  globalObjects: {
    tweets: {
      [key: string]: {
        created_at: string;
        id_str: string;
        full_text: string;
        display_text_range: any[];
        entities: any[];
        extended_entities?: any[];
        source: string;
        in_reply_to_status_id_str?: string;
        in_reply_to_user_id_str?: string;
        in_reply_to_screen_name?: string;
        user_id_str: string;
        is_quote_status?: boolean;
        quoted_status_id_str?: string;
        retweeted_status_id_str?: string;
        quoted_status_permalink?: any;
        retweet_count: number;
        favorite_count: number;
        reply_count: number;
        quote_count: number;
        conversation_id_str: string;
        possibly_sensitive_editable?: boolean;
        lang: string;
      };
    };
  };
  errors?: any;
};

export const exportData = ({ content, filePath }: ExportOptions) => {
  const parsedPath = path.parse(filePath);

  if (parsedPath.dir) {
    fs.mkdir(parsedPath.dir, { recursive: true }, (err) => {
      if (err) throw err;
    });
  }

  fs.writeFileSync(filePath, content);
};

export const getCSVHeaders = () => {
  return [
    "type",
    "retweet_count",
    "favorite_count",
    "reply_count",
    "quote_count",
    "related_to",
  ];
};

export const toCSVContent = ({ urlInfos }: { urlInfos: UrlInfo[] }) => {
  return urlInfos
    .map((u) =>
      [
        u.url,
        u.type,
        u.retweet_count,
        u.favorite_count,
        u.reply_count,
        u.quote_count,
        u.related_to,
      ].join(",")
    )
    .join(`\n`);
};

export const setupCache = async ({
  days,
  path,
}: {
  days: number;
  path: string;
}): Promise<Cache> => {
  return new Promise((resolve) => {
    const cache = cacheManager.caching({
      store: fsStore,
      ttl: days * 24 * 60 * 60 /* days in seconds */,
      maxsize: 1000 * 1000 * 1000 /* 1GB max size in bytes on disk */,
      path,
      zip: false,
      fillcallback: () => {
        resolve(cache);
      },
    });
  });
};

export const printExtractSummary = ({
  filePath,
  urlInfos,
  limit,
}: {
  filePath: string;
  urlInfos: UrlInfo[];
  limit: number;
}) => {
  const size = limit > 0 ? Math.min(limit, urlInfos.length) : urlInfos.length;
  console.log(
    `${size}/${urlInfos.length} urls scanned exported at ${filePath}!`
  );
};
