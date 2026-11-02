# unknowncheats-mcp

MCP server + CLI for reading and searching the UnknownCheats forum
(https://www.unknowncheats.me): browser-based Cloudflare handling with a
persistent profile, forum/subforum search, thread reading, subforum crawling,
bulk fetch, code-block extraction, attachment inspection, offsets comparison,
and a local SQLite FTS5 index.

## Requirements

- [Bun](https://bun.sh) (`brew install bun` / `powershell -c "irm bun.sh/install.ps1 | iex"`)
- Google Chrome installed

```sh
git clone https://github.com/UnknownCr1ppl3/unknowncheats-mcp.git
cd unknowncheats-mcp
bun install --frozen-lockfile
```

First tool call opens a visible Chrome window; Cloudflare is normally cleared
automatically and the session persists in `~/.local/share/mcp-unknowncheat/`
(or `%LOCALAPPDATA%` on Windows), so later calls are quiet.

## Connect any MCP client

Point an MCP client at the stdio server. Generic form:

```json
{
  "command": "bun",
  "args": ["run", "/absolute/path/to/unknowncheats-mcp/src/index.ts"]
}
```

<details><summary><b>OpenCode</b> (<code>~/.config/opencode/opencode.json</code>)</summary>

```json
{
  "mcp": {
    "unknowncheat": {
      "type": "local",
      "command": ["bun", "run", "/absolute/path/to/unknowncheats-mcp/src/index.ts"],
      "enabled": true
    }
  }
}
```
</details>

<details><summary><b>Claude Code</b></summary>

```sh
claude mcp add --scope user unknowncheat -- bun run /absolute/path/to/unknowncheats-mcp/src/index.ts
```
</details>

<details><summary><b>Claude Desktop</b> (claude_desktop_config.json) / <b>Cursor</b> (.cursor/mcp.json)</summary>

```json
{
  "mcpServers": {
    "unknowncheat": {
      "command": "bun",
      "args": ["run", "/absolute/path/to/unknowncheats-mcp/src/index.ts"]
    }
  }
}
```
</details>

<details><summary><b>OpenAI Codex</b> (~/.codex/config.toml)</summary>

```toml
[mcp_servers.unknowncheat]
command = "bun"
args = ["run", "/absolute/path/to/unknowncheats-mcp/src/index.ts"]
tool_timeout_sec = 120
```
</details>

<details><summary><b>Any GLM / GPT client with MCP support</b></summary>

Use the generic stdio form above — `command: "bun"`,
`args: ["run", "<abs path>/src/index.ts"]`. Set a tool timeout of at least
120 seconds for first use.
</details>

Set `UC_CHROME_PATH` if Chrome is not in the standard location, `UC_HEADLESS=1`
to force headless, and see the configuration table below for the rest.

## CLI (no MCP client needed)

```sh
bun run uc tools                 # list all tools
bun run uc check_login           # session check + first-run CF solve
bun run uc search "cs2 external"
bun run uc thread "https://www.unknowncheats.me/forum/showthread.php?t=123" latest_pages=5
bun run uc offsets "Apex Legends"
bun run uc subforums refresh=true
bun run uc crawl_subforum subforum=anti-cheat-research max_pages=3
bun run uc search_index query="offsets"    # offline, local SQLite index
```

---

# upstream README (mcp-unknowncheat)


A TypeScript MCP server for reading and searching the [UnknownCheats](https://www.unknowncheats.me) forum. It uses Bun, a local Chrome window, and Cheerio to parse forum pages.

## Demo

https://github.com/user-attachments/assets/9f00f783-0a03-4e8d-b5b6-abd308936f20

## Install

Install [Bun](https://bun.sh) and Google Chrome. The server uses `puppeteer-real-browser` and your installed browser; installation does not download a browser. Set `UC_CHROME_PATH` to an absolute Chrome or Chromium executable path if Chrome is not in its standard location. Run the npm package with:

```sh
bunx mcp-unknowncheatz
```

To run the source:

```sh
git clone https://github.com/amangly/mcp-unknowncheat.git
cd mcp-unknowncheat
bun install --frozen-lockfile
bun run start
```

### CLI

A shell wrapper is included for direct use without an MCP client. It spawns the
MCP server, forwards the call over stdio, and prints the tool's JSON result:

```sh
bun run uc tools
bun run uc check_login
bun run uc search "cs2 external"
bun run uc thread "https://www.unknowncheats.me/forum/showthread.php?t=123" latest_pages=5
bun run uc offsets "Apex Legends"
bun run uc subforums refresh=true
bun run uc status
bun run uc crawl_subforum subforum=counter-strike-2-a max_pages=3
```

Arguments after the tool name are `key=value` pairs; values that look like
JSON (numbers, booleans, arrays) are parsed, everything else stays a string.
Only the first `=` separates key from value, so URLs with query strings work
unquoted.

The server uses MCP over standard input and output. Chrome opens when a tool first needs a page. It keeps a dedicated profile under the user's application data directory (`mcp-unknowncheat/chrome-profile`) so a manually completed browser challenge and login can survive restarts. Set `UC_PROFILE_DIR` to an absolute path to choose another profile; an existing `cookies.json` is imported only when the profile is first created. On Linux without a graphical display, Chrome runs headless; set `UC_HEADLESS=1` to request headless mode elsewhere. If a Cloudflare challenge appears, complete it in the visible Chrome window. The server waits up to 45 seconds by default (`UC_CF_WAIT_MS`), subject to each tool's time budget. Automated browsers are not guaranteed to pass production challenges. Clients may need a tool timeout over 60 seconds for first-time manual setup.

## Connect an MCP client

Install Bun and Chrome first. Your MCP client starts the server with `bunx mcp-unknowncheatz`; you do not need to leave a separate terminal running. The examples below use the published npm package. To use a source checkout, replace `bunx mcp-unknowncheatz` with `bun run /absolute/path/to/mcp-unknowncheat/src/index.ts`.

### Codex

Add the server from a terminal:

```sh
codex mcp add unknowncheat -- bunx mcp-unknowncheatz
codex mcp list
```

Or add this to `~/.codex/config.toml` (on Windows, `%USERPROFILE%\.codex\config.toml`):

```toml
[mcp_servers.unknowncheat]
command = "bunx"
args = ["mcp-unknowncheatz"]
tool_timeout_sec = 120
```

Restart Codex after editing the config file.

### Claude Code

```sh
claude mcp add --scope user unknowncheat -- bunx mcp-unknowncheatz
claude mcp list
```

Use `--scope project` if the server should be available only in one project.

### Claude Desktop and Cursor

Add the server entry under `mcpServers` in the client's JSON config. Claude Desktop uses `%APPDATA%\Claude\claude_desktop_config.json` on Windows or `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS. Cursor uses `~/.cursor/mcp.json` for all projects or `.cursor/mcp.json` in one project.

```json
{
  "mcpServers": {
    "unknowncheat": {
      "command": "bunx",
      "args": ["mcp-unknowncheatz"]
    }
  }
}
```

Merge this entry into an existing `mcpServers` object if you already have other servers. Quit and reopen the client after saving the file.

### VS Code

Add this to `.vscode/mcp.json` in your workspace, then run **MCP: List Servers** from the Command Palette to start or inspect it:

```json
{
  "servers": {
    "unknowncheat": {
      "type": "stdio",
      "command": "bunx",
      "args": ["mcp-unknowncheatz"]
    }
  }
}
```

For other clients, configure a local stdio MCP server with command `bunx` and argument `mcp-unknowncheatz`. If the client cannot find `bunx`, use its absolute executable path. On first use, allow time for the package to start and for any browser challenge; where supported, set a tool timeout of at least 120 seconds. Ask the client to list its MCP tools or call `check_login` to confirm the connection.

## Tools

| Tool | Purpose |
|---|---|
| `check_login` | Check session status |
| `login` | Log in with a username and password |
| `search_forum` | Search threads or browse a subforum |
| `get_thread` | Read the latest three pages of a thread by default, or an explicit page |
| `extract_code` | Extract code blocks from a thread |
| `download_file` | Download and inspect an attachment |
| `list_subforums` | List forum sections from a 24-hour local directory; use `refresh: true` to rebuild it |
| `crawl_subforum` | Collect threads from subforum pages |
| `bulk_get_threads` | Read the first and latest three pages of several threads by default |
| `get_user_reputation` | Read reputation details |
| `find_latest_offsets` | Compare recent pages of up to three plausible offsets threads by default |
| `debug_page` | Inspect page structure |
| `crawl_cache` | Inspect or clear the HTML cache |
| `index_subforum` | Refresh a bounded local thread and post index for one subforum |
| `search_index` | Search indexed titles, snippets, and sampled posts without a network request |
| `index_status` | Show local index coverage, counts, and last update times; optionally filter by subforum |

The MCP tool schemas provide the available arguments. For example:

```text
search_forum({ query: "example" })
get_thread({ url: "https://www.unknowncheats.me/forum/showthread.php?t=123" })
find_latest_offsets({ game: "Apex Legends" })
index_subforum({ subforum: "apex-legends", max_listing_pages: 1, max_threads: 5 })
search_index({ query: "offsets", subforum: "apex-legends" })
```

The server advertises forum research tools for game cheating scenes, cheat techniques and tooling, anti-cheat, reversing, and offsets questions. The connected AI client decides whether to invoke them; tool descriptions and server instructions guide selection but do not force a call. For a current or newest claim, compare plausible threads and read their latest three pages before concluding. Search hits and the original post alone do not establish freshness. Check `recentPagesComplete` and the fetched page numbers; a timeout or page error means coverage is incomplete. If a recent post points to a code block, use `extract_code` on that page before citing values.

The first directory lookup saves forum URLs in `forum-index.json`. Offsets lookups read the selected game's live thread listing, then compare the latest three pages of up to three plausible threads. `max_thread_pages` and `max_candidate_threads` can extend the search. For games in a shared forum, they try indexed thread titles and then native forum search. Results include every scanned thread, its page coverage, errors, and separate flags for incomplete candidate scans and incomplete discovery. A matching post does not prove the offsets work with the current game build or that unscanned threads have no newer post. If the game name is ambiguous, use a slug returned by `list_subforums` or pass an exact `thread_url`.

Browsing or crawling a subforum records its visible listing in the local index. Reading a thread records the pages visited. `index_subforum` additionally samples the first and recent post pages of changed threads, up to five by default, and rechecks unchanged threads after 24 hours. The index remains partial: `search_index` includes listing and post page counts, timestamps, and a partial coverage marker. Use live search when freshness or missing coverage matters. The SQLite database is stored under the user's application data directory (`mcp-unknowncheat/forum-index.sqlite`); set `UC_INDEX_PATH` to change it. Browser-backed tools share one page and run one at a time; a queued call returns a busy error after 10 seconds. `get_thread`, `bulk_get_threads`, `crawl_subforum`, `index_subforum`, and `find_latest_offsets` stop starting new page requests after a 45-second fetch budget. `crawl_cache` reports cache hits, queued requests, failures, and total fetch time.

## Development

If a tool returns `connect ECONNREFUSED 127.0.0.1:<port>` while Chrome stays on a blank page, update to a build containing the explicit debugging-port fix. `chrome-launcher 1.2.2` can select an old port from the dedicated profile's accumulated log on restart. The server now allocates a fresh loopback port for each launch. Close any abandoned Chrome window using the dedicated MCP profile before restarting the server; keep your ordinary Chrome windows open. A profile must be used by only one server instance at a time. This startup error occurs before forum navigation and is separate from a Cloudflare verification loop.

```sh
bun run typecheck
bun run test
bun run build
bun run inspect:html -- path/to/saved-forum-page.html
```

The browser code and tools are in `src/`; HTML parsers are in `src/parsers/`. `downloads/`, `exports/`, `cookies.json`, and `forum-index.json` are local output ignored by Git.
The HTML inspector reads a saved page locally and reports selector counts, parser coverage, pagination, and challenge markers without fetching the site.

## Contributing

Read the [contributing guide](https://github.com/amangly/mcp-unknowncheat/blob/master/CONTRIBUTING.md) for setup and pull requests. The [docs index](https://github.com/amangly/mcp-unknowncheat/blob/master/docs/README.md) links the architecture and testing guides. Bug reports should include the tool call, expected and actual result, and any page that could not be fetched; remove account data before posting.

## Configuration

| Variable | Default | Purpose |
|---|---:|---|
| `UC_CF_WAIT_MS` | `45000` | Time to wait for a Cloudflare challenge, in milliseconds |
| `UC_CACHE_TTL_MS` | `300000` | HTML cache lifetime, in milliseconds |
| `UC_MIN_REQUEST_INTERVAL_MS` | `900` | Minimum interval between crawl requests, in milliseconds |
| `UC_INDEX_PATH` | User application data directory | Path of the local SQLite search index |

The npm package is [mcp-unknowncheatz](https://www.npmjs.com/package/mcp-unknowncheatz). Report bugs in [GitHub Issues](https://github.com/amangly/mcp-unknowncheat/issues).

## License

Apache License 2.0 from version 0.3.7. See [LICENSE](https://github.com/amangly/mcp-unknowncheat/blob/master/LICENSE) and [NOTICE](https://github.com/amangly/mcp-unknowncheat/blob/master/NOTICE). Published versions through 0.3.6 remain MIT licensed.
