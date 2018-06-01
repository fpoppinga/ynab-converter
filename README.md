# YNAB-Converter
If you are using (YNAB)[https://youneedabudget.com] from a non-US country, you'll often find that you credit institute is not supported for automatic import of transactions. Instead you'll have to manually import CSV files in a format YNAB understands.

This tool can make this process easier. It takes in arbitrary csv records (see `src/config/starmoney.ts` for an example) and converts them to a format YNAB can read. Even better, it also supports the new and shiny YNAB REST API, which saves you the hassle and also uploads the transactions easily. 

## Usage
```
ynab-converter --help

  Usage: ynab-converter [options] [command]

  Options:

    -V, --version               output the version number
    -h, --help                  output usage information

  Commands:

    convert <input> [<output>]  parse StarMoney export format and output it as YNAB format.
    push [options] <input>      parse StarMoney export format and push contents to YNAB directly.
  ```
  
  ### Convert Files
  ```
    Usage: convert [options] <input> [<output>]

  parse StarMoney export format and output it as YNAB format.

  Options:

    -h, --help  output usage information
```

### Push Transactions to YNAB
```
  Usage: push [options] <input>

  parse StarMoney export format and push contents to YNAB directly.

  Options:

    -t, --token <token>
            Your YNAB access token. Don't have one?
            Go to https://app.youneedabudget.com/settings/developer to get one.

            You can alternatively just set the environment variable YNAB_TOKEN to the value of your token.
    -b, --budget <budget>
            The name of your YNAB Budget. If you don't provide a budget, the one with the most
            recent change will be used.
    -a, --account <account>
            Your account's name. Partial name is enough (e.g. "cr" for "Credit Card").

    -h, --help               output usage information
```
