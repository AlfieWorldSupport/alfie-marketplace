# Alfie Marketplace

The catalogue Alfie shows in its **Marketplace** window: skills (new abilities), characters, voices and
personalities. Browse it on the web at <https://alfieworldsupport.github.io/market.html> (**Open in Alfie** shows a
listing in the app).

- **Want to offer something?** See [SUBMITTING.md](SUBMITTING.md): make it, submit it with a form, and it's
  listed once it has been reviewed.
- **Making a skill?** See [MAKING-SKILLS.md](MAKING-SKILLS.md). The developer kit is `npx alfie-skill` (on npm; needs
  Node.js 22.13 or newer; also here as [`tools/alfie-skill.cjs`](tools/alfie-skill.cjs)), and there's an example in
  [`examples/unit-converter`](examples/unit-converter).

## How the catalogue is protected

`catalogue.json` lists every item with its size and SHA-256; `catalogue.sig` is the curator's signature over it.
Alfie shows the catalogue only if that signature checks out against the curator key built into the app, and it
checks every download against the listed size and hash. Skills are also signed by their makers, and Alfie shows
who made each one before installing.
