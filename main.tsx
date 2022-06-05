/** @jsx h */
import { h, renderToString } from "https://deno.land/x/jsx@v0.1.5/mod.ts";
import { parseFeed } from "https://deno.land/x/rss@0.5.6/mod.ts";
import { serve } from "https://deno.land/std@0.142.0/http/server.ts";
import { feeds } from "./feeds.ts";

type FeedEntry = { link: string; title: string; updated: Date };

// Load the feed entries from a feed URL
async function loadFeedEntries(feedUrl: string): Promise<FeedEntry[]> {
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

// Generate the combined feed from the list of feed URLs
async function generateCombinedFeed(feeds: string[]): Promise<string> {
  // Load feeds in parallel
  const entries =
    (await Promise.all(feeds.map((feedUrl) => loadFeedEntries(feedUrl)))).flat(
      1,
    );

  const url = "https://github.com/canac/feed-masher";
  return '<?xml version="1.0" encoding="utf-8"?>\n' + await renderToString(
    <feed xmlns="http://www.w3.org/2005/Atom">
      <title>Caleb Cox's tech feeds</title>
      <link href={url} />
      <updated>{new Date().toISOString()}</updated>
      <id>{url}</id>
      <author>
        <name>Caleb Cox</name>
        <email>canac@users.noreply.github.com</email>
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

serve(async (req) => {
  if (req.method !== "GET") {
    return new Response("Bad Method", { status: 405 });
  }

  const url = new URL(req.url);

  if (url.pathname === "/") {
    return new Response("Feed Masher");
  }

  if (url.pathname === "/feed.xml") {
    const xml = await generateCombinedFeed(feeds);
    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  return new Response("Not Found", { status: 404 });
});
