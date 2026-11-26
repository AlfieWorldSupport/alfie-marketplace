# Writing skills for Alfie

A **skill** gives Alfie new abilities (tools she can use when you ask). It's a folder with two files:

```
my-skill/
  skill.json   the manifest: who made it, what it may do, its tools
  index.js     the code
```

While you work on it, install it from **Settings → Skills → Install from a folder…** Alfie shows what it asks
for and installs a copy. To share it, pack it into one signed `.alfieskill` file (below); people install that
with **Install a skill…**. A complete example is in [`examples/unit-converter`](examples/unit-converter). When it's ready, you can offer it to everyone through the Alfie Marketplace: see [SUBMITTING.md](SUBMITTING.md).

## The alfie-skill tool (developer kit)

Download [`tools/alfie-skill.cjs`](tools/alfie-skill.cjs) from this repository and run it with `node alfie-skill.cjs <command>`.
It's a single file and needs only [Node.js](https://nodejs.org) 22.13 or newer.

| Command | What it does |
|---|---|
| `create <folder> [--name "My skill"]` | Starts a skill from a template: `skill.json`, `index.js`, `tests.json`, `README.md` |
| `validate [folder]` | Checks `skill.json`, then loads the code in the sandbox and checks it exports every tool |
| `run [folder] <tool> '<json args>' [--folder <dir>]` | Runs one tool exactly as Alfie would: same sandbox and permissions (`--folder` stands in for the user's shared folders) |
| `test [folder]` | Runs the cases in `tests.json`: `[{ "tool": "...", "args": {...}, "expect": { "contains": "..." } }]` or `"expect": { "error": true }` |
| `keygen [--out <file>]` | Makes your signing key and prints your maker fingerprint |
| `pack [folder] [--key <file>] [--out <dir>]` | Makes `<id>-<version>.alfieskill`, signed with `--key` |
| `inspect <file.alfieskill>` | Checks a package (intact? signed by whom?) and lists what's in it |

A typical session:

```bash
node alfie-skill.cjs create weather --name "Weather"
node alfie-skill.cjs test weather
node alfie-skill.cjs keygen --out C:\Keys\alfie-signing-key.pem
node alfie-skill.cjs pack weather --key C:\Keys\alfie-signing-key.pem --out dist
```

### Signing

A package carries a fingerprint (SHA-256) of every file in it. Alfie refuses a package whose files don't match,
so a damaged or edited package can't be installed. With `--key`, the package is also signed (Ed25519), and Alfie
shows your **maker fingerprint** (like `6C4C-90BE-F53F-9623`) before installing and on the Skills page. Sign
every version with the same key: if an update is signed by a different key, Alfie warns that it may not come
from the same maker. Keep the key file secret and backed up, and never inside a skill folder (`pack` leaves out
`alfie-signing-key.pem` files anyway). An unsigned package still installs, but Alfie says it can't tell who made it.

## skill.json

```json
{
  "id": "unit-converter",
  "name": "Unit converter",
  "version": "1.0.0",
  "author": "You",
  "description": "What it does, in a sentence or two.",
  "entry": "index.js",
  "permissions": [],
  "tools": [
    {
      "name": "convert_units",
      "description": "Convert a number from one unit to another …",
      "risk": "read",
      "parameters": {
        "type": "object",
        "properties": { "value": { "type": "number" }, "from": { "type": "string" }, "to": { "type": "string" } },
        "required": ["value", "from", "to"]
      }
    }
  ],
  "prompt": "Optional notes for her about when to use it."
}
```

| Field | Rules |
|---|---|
| `id` | lower-case letters, digits and `-`, 2–40 characters; unique |
| `version` | like `1.0.0` |
| `entry` | a `.js` or `.cjs` file inside the folder (default `index.js`) |
| `permissions` | any of `files.read`, `files.write`, `programs`, `network` (see below) |
| `tools` | 1–30 tools; `name` is lower-case letters, digits and `_`; `parameters` is a JSON Schema object |
| `risk` | `read` (only looks), `low`, `modify` (default) or `destructive`: decides when she asks you first |
| `prompt` | up to 1000 characters, shown to her with the tools |

The model sees each tool as `skill_<id>__<tool>`, with your description and parameters.

## index.js

Export the tools as functions. Each gets the arguments she chose and returns a string, or `{ content, note }`:

```js
module.exports.tools = {
  async convert_units({ value, from, to }) {
    // … work it out …
    return { content: `${value} ${from} = ${result} ${to}`, note: `Converted ${from} to ${to}` };
  },
};
```

- `content` is what she reads (up to 100,000 characters). It's treated as information, never as instructions.
- `note` is the short line shown under her reply (optional).
- Throw an `Error` to report a problem; she sees the message.
- `console.log` is fine: it goes to Alfie's log, not to her.
- The second argument has `folders`: the user's shared folders (useful with file permissions).
- Read your own files with `path.join(__dirname, 'file')`: the working directory isn't your folder.
- Each call has 60 seconds.

## Permissions and the sandbox

Skills run in their own process with Node's permission model:

| Permission | Without it | With it |
|---|---|---|
| (always) | reads only its own folder | |
| `files.read` | | also reads the user's shared folders |
| `files.write` | | also writes in the shared folders |
| `programs` | can't start other programs | can (and gets the PATH) |
| `network` | **not enforced yet**: shown to the user only | |

Native add-ons and worker threads are blocked. The process gets an empty environment (no keys, no user
settings). Alfie stops skills on emergency stop and when they're turned off.

Every call still goes through Alfie's checks: computer actions must be on, it never runs in Chatting mode,
approvals follow the user's "When to ask" setting and the tool's `risk`, and it's written to Activity.

## MCP servers ("connectors")

Alfie can also use **Model Context Protocol** servers (the standard many apps publish). In Settings → Skills →
Add an MCP server, enter the name, command, arguments and any environment values (stored encrypted) from the
server's own setup instructions, for example `npx` and `-y @modelcontextprotocol/server-filesystem C:\Notes`.

- Only **stdio** servers (started by a command) are supported, and only their **tools** (not resources or prompts).
- MCP servers run with the user's full rights; Alfie says so before adding one.
- A tool's risk comes from its annotations: `readOnlyHint` → read, `destructiveHint` → destructive, otherwise
  modify (asks first in Supervised mode).
