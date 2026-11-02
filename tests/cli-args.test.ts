import { expect, test } from "bun:test";
import { parseToolArgs } from "../src/cli.ts";

test("cli args parse JSON-shaped values and keep URL query strings intact", () => {
  expect(parseToolArgs([
    "url=https://www.unknowncheats.me/forum/showthread.php?t=123&page=2",
    "latest_pages=3",
    "fetch_all_pages=true",
  ])).toEqual({
    url: "https://www.unknowncheats.me/forum/showthread.php?t=123&page=2",
    latest_pages: 3,
    fetch_all_pages: true,
  });

  expect(parseToolArgs(["refresh=true", "subforums=[\"apex-legends\"]", "plain=text with = inside"])).toEqual({
    refresh: true,
    subforums: ["apex-legends"],
    plain: "text with = inside",
  });

  expect(parseToolArgs(["no-equals", "= orphan", "bad={json"])).toEqual({ bad: "{json" });
});
