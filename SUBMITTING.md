# Submitting to the Alfie Marketplace

Anyone can offer a **skill** (new abilities for Alfie) or a **character** (a VRM model) for the Marketplace.
Everything is reviewed by hand before it's listed, and the catalogue is signed, so only reviewed items ever
show up in people's Alfie.

## How it works

1. **Make it.** Skills: follow [MAKING-SKILLS.md](MAKING-SKILLS.md). Characters: a `.vrm` model that you made, or
   whose licence lets you share it.
2. **Submit it** with a GitHub form (you need a free GitHub account):
   - [Submit a skill](../../issues/new?template=submit-skill.yml)
   - [Submit a character](../../issues/new?template=submit-character.yml)
3. **Review.** The curator reads the code (skills), checks the licence (characters), tries it, and may ask
   questions in the issue.
4. **Listed.** When it's accepted, it's added to the catalogue and the issue is closed with a note. It appears in
   everyone's Marketplace the next time they open or refresh it.

Submitting is free. Not everything is accepted; the issue says why if it isn't.

## Skills

Before you submit:

- Test it: `node alfie-skill.cjs test <folder>` (put a few cases in `tests.json`).
- **Sign it with your own key** and keep that key for every future version:
  `node alfie-skill.cjs keygen --out <somewhere safe>\alfie-signing-key.pem`, then
  `node alfie-skill.cjs pack <folder> --key <that key> --out dist`. Never share or upload the key itself.
- Check the package: `node alfie-skill.cjs inspect dist\<id>-<version>.alfieskill` shows your **maker
  fingerprint**; put it in the form.
- Ask only for the permissions it needs (`files.read`, `files.write`, `programs`, `network`) and say why in the
  form.
- Share the source code (a public repository link is best). Skills that can't be reviewed won't be listed.

GitHub doesn't accept `.alfieskill` files as attachments, so **zip the package** and attach the `.zip`.

Not accepted: anything that collects people's data without saying so, sends messages or posts on someone's
behalf without asking, mines cryptocurrency, shows ads, or tries to get around Alfie's permission checks.

## Characters

- Only characters **you made** or whose licence explicitly allows sharing (and commercial use, if the licence
  says so). Characters from games, anime or films that you don't have the rights to won't be listed, even if
  they're available elsewhere.
- Give the licence (VRoid Hub or VRM metadata settings, or a link to the terms).
- Zip the `.vrm` and attach it (GitHub attachments are limited to 25 MB; for bigger files, give a download link).
- A picture helps: a PNG or JPEG, ideally 16:9, at most 2 MB.

## Updates and removal

- **Update:** submit again with the new version (same skill id; signed with the same key). People who have the
  old one see **Update** in the Marketplace.
- **Remove:** open an issue asking for it to be taken down; it's removed from the catalogue (people who installed it
  keep their copy).
