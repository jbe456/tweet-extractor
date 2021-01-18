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
};

type ExportOptions = {
  content: string;
  filePath: string;
};

export type ExtractUrlOptions = { cache: Cache; url: string };

export type UrlInfo = {
  url: string;
  retweet_count: number;
  favorite_count: number;
  reply_count: number;
  quote_count: number;
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
  return ["retweet_count", "favorite_count", "reply_count", "quote_count"];
};

export const toCSVContent = ({ urlInfos }: { urlInfos: UrlInfo[] }) => {
  return urlInfos
    .map((u) =>
      [
        u.url,
        u.retweet_count,
        u.favorite_count,
        u.reply_count,
        u.quote_count,
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
