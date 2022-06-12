/** @jsx h */
import { h, renderToString } from "https://deno.land/x/jsx@v0.1.5/mod.ts";
import { parseFeed } from "https://deno.land/x/rss@0.5.6/mod.ts";
import { z } from "https://deno.land/x/zod@v3.17.3/mod.ts";

const gistSchema = z.object({
  description: z.string(),
  files: z.record(z.object({ content: z.string() })),
  owner: z.object({ login: z.string() }),
});

type FeedEntry = { link: string; title: string; updated: Date };

// This class represents multiple feeds merged into one
export class MergedFeed {
  #id: string;
  #author: string;
  #title: string;
  #feedUrls: string[];

  constructor(
    init: { id: string; author: string; title: string; feedUrls: string[] },
  ) {
    this.#id = init.id;
    this.#author = init.author;
    this.#title = init.title;
    this.#feedUrls = init.feedUrls;
  }

  // Generate the combined feed from the list of feed URLs
  async generateFeed(): Promise<string> {
    const entries = (await Promise.all(
      this.#feedUrls.map((feedUrl) => MergedFeed.#loadFeedEntries(feedUrl)),
    )).flat(
      1,
    );

    const baseUrl = "https://feed-masher.deno.dev";
    return '<?xml version="1.0" encoding="utf-8"?>\n' + await renderToString(
      <feed xmlns="http://www.w3.org/2005/Atom">
        <title>{this.#title}</title>
        <link href={`${baseUrl}/`} />
        <link href={`${baseUrl}/${this.#id}/feed.xml`} rel="self" />
        <updated>{new Date().toISOString()}</updated>
        <id>{`${baseUrl}/${this.#id}`}</id>
        <author>
          <name>{this.#author}</name>
        </author>
        {entries.map((entry) => (
          <entry>
            <title>{entry.title}</title>
            <link href={entry.link} />
            <updated>{entry.updated.toISOString()}</updated>
            <id>{entry.link}</id>
          </entry>
        ))}
      </feed>,
    );
  }

  // Extract a new merged feed from a Gist
  // The Gist's username is used as feed author
  // The Gist's description is used as the feed title
  // The Gist's first file's content is interpreted as list of newline separated
  //   feed URLs that will make up the merged feed
  static async fromGist(gistId: string): Promise<MergedFeed> {
    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: {
        accept: "application/vnd.github.v3+json",
      },
    });
    const gist = gistSchema.parse(await res.json());
    const username = gist.owner.login;
    const description = gist.description;
    const content = Object.values(gist.files)[0].content;
    const feedUrls = content.split("\n").map((url) => url.trim()).filter((
      url,
    ) => url.length > 0);
    return new MergedFeed({
      id: "gist:" + gistId,
      author: "@" + username,
      title: description || "Mashed Feed",
      feedUrls,
    });
  }

  // Load the feed entries from a feed URL
  static async #loadFeedEntries(feedUrl: string): Promise<FeedEntry[]> {
    const res = await fetch(feedUrl);
    if (!res.ok) {
      console.error(`Couldn't load feed at ${feedUrl}`);
      return [];
    }

    try {
      const feed = await parseFeed(await res.text());
      const feedTitle = feed.title.value;
      if (!feedTitle) {
        console.error(`Missing title in feed at ${feedUrl}`);
        return [];
      }

      // Keep only the 10 most recent entries
      return feed.entries.slice(0, 10).flatMap((
        entry,
      ) => {
        const link = entry.links[0]?.href;
        const title = entry.title?.value;
        const updated = entry.updated;
        if (!link) {
          console.error(`Missing link in feed entry at ${feedUrl}`);
          return [];
        }
        if (!title) {
          console.error(`Missing title in feed entry at ${feedUrl}`);
          return [];
        }
        if (!updated) {
          console.error(
            `Missing updated date in feed entry at ${feedUrl}`,
          );
          return [];
        }

        return [{
          link,
          title: `${feedTitle} | ${title}`,
          updated,
        }];
      });
    } catch (err) {
      console.error(`Error parsing feed at ${feedUrl}`);
      console.error(err);
      return [];
    }
  }
}
