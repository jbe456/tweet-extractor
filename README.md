## URL keywords extractor

Extract URL keywords from urls

### CLI

```console
> uke --help
uke extract --help

Commands:
  uke extract  Extract keywords from a list of one or multiple space separated
               urls

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]

Examples:
  uke extract --urls urlA                   Extract keywords from a list of urls
  uke extract --input urls.csv              Extract keywords from a list of urls
  --columnName URL                          provided by urls.csv via column URL
```

#### extract

```console
> uke extract --help
uke extract

Extract keywords from a list of one or multiple space separated urls

Options:
  --version      Show version number                                   [boolean]
  --help         Show help                                             [boolean]
  --urls         A list of space-separated urls to extract keywords from [array]
  --input        CSV source to extract urls from                        [string]
  --columnName   Column name from input file to extract urls            [string]
  --output       Destination folder or file where CSV results are exported,
                 relative or absolute path                              [string]
  --cacheExpiry  Number of days before cache entities expire.
                                                          [number] [default: 31]
  --cachePath    Path to the cache folder.       [number] [default: "uke-cache"]
```

### Troubleshoot

N/A
