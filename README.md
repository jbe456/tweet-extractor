## Tweet extractor

Extract tweet metadatas

### CLI

```console
> te --help
te extract --help

Commands:
  te extract  Extract tweet infos from a list of one or multiple space separated
              urls

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]

Examples:
  te extract --urls urlA                    Extract tweet infos from a list of
                                            urls
  te extract --input urls.csv --columnName  Extract tweet infos from a list of
  URL                                       urls provided by urls.csv via column
                                            URL
```

#### extract

```console
> te extract --help
te extract

Extract tweet infos from a list of one or multiple space separated urls

Options:
  --version      Show version number                                   [boolean]
  --help         Show help                                             [boolean]
  --urls         A list of space-separated urls to extract tweet infos from
                                                                         [array]
  --input        CSV source to extract urls from                        [string]
  --columnName   Column name from input file to extract urls            [string]
  --output       Destination folder or file where CSV results are exported,
                 relative or absolute path                              [string]
  --cacheExpiry  Number of days before cache entities expire.
                                                          [number] [default: 31]
  --cachePath    Path to the cache folder.       [number] [default: "uke-cache"]
  --bucket       Path to the cache folder.                 [number] [default: 5]
  --sleep        Path to the cache folder.              [number] [default: 1000]
  --limit        Maximum numbers of tweets to process or -1 to disable this
                 parameter.                               [number] [default: -1]
  --debug        Write the full JSON response for each tweet into a file name
                 debug-$tweetId.json.                 [boolean] [default: false]
```

### Troubleshoot

N/A
