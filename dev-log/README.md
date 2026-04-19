# Living Eamon — Dev Log

A "build in public" workspace for tracking progress, architecture decisions, screenshots, and content for posting to social platforms.

## Structure

- **`screenshots/`** — Raw screenshots of game UI, sprites, scenes
- **`architecture/`** — Design decisions, system diagrams, technical notes
- **`posts/`** — Drafted posts ready for X.com, our website, etc.

## Posting Workflow

Content here is structured for programmatic distribution to:

### Currently planned

- **X.com** — short posts with screenshots (use X API v2)
- **Living Eamon website** — longer-form dev updates via custom API

### Other "build in public" platforms with APIs worth considering

| Platform | API | Best for |
|----------|-----|----------|
| **Bluesky** (AT Protocol) | Open API, free | Long-form dev posts, growing dev community |
| **Mastodon** | Open API, free | Tech-friendly audience, federated |
| **Threads (Meta)** | Threads API (Meta) | Cross-post from Instagram audience |
| **Reddit** | Reddit API (limited free tier) | r/gamedev, r/IndieDev, r/roguelikes |
| **Discord** | Webhooks + Bot API | Direct community engagement |
| **Dev.to** | Dev.to API | Long-form articles, indie dev SEO |
| **Hashnode** | Hashnode API | Long-form dev blog posts |
| **YouTube** | Data API v3 | Devlog video uploads + descriptions |
| **TikTok** | Content Posting API | Short clips of gameplay |
| **itch.io** | itch.io API | Game page updates, demo releases |
| **Steam** | Steamworks Web API | Once Steam page exists — news posts |

### High-leverage combinations

1. **X + Bluesky + Mastodon** — same short post syndicated everywhere via one webhook
2. **Dev.to + Hashnode + website** — same long-form article cross-posted
3. **YouTube + TikTok** — same gameplay clip in short and long form
4. **Discord webhook** — auto-announce when new content is posted anywhere else
