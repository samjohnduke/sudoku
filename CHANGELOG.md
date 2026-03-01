# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Bug Fixes

- Add build step before deploy in CI by @samjohnduke ([60e4a9f](https://github.com/samjohnduke/sudoku/commit/60e4a9f6803a0009d6958d7f27e4c8e03bd432c2))

- Pass CLOUDFLARE_ACCOUNT_ID to deploy step by @samjohnduke ([29620ae](https://github.com/samjohnduke/sudoku/commit/29620ae9888b95739b5f526dd20b8003fa6414ad))

- Include env.d.ts in tsconfig so secret types are found by @samjohnduke ([0b4760a](https://github.com/samjohnduke/sudoku/commit/0b4760aa5de92bea7ea68dc15a1c3cea2d2df30c))

- Declare secret env bindings for CI typecheck by @samjohnduke ([ad6f688](https://github.com/samjohnduke/sudoku/commit/ad6f6887f7cce7e798d5d618ad7daf865f5e58fe))

- Generate worker types in CI before typecheck by @samjohnduke ([068e6dc](https://github.com/samjohnduke/sudoku/commit/068e6dcdd0a9d296da9bfdf0801de22b1cebbb00))

- Add w-full to page containers so children fill width by @samjohnduke ([7284532](https://github.com/samjohnduke/sudoku/commit/7284532a7f5629bfb01880ec770d82c449d4d139))

- Set stats page to max-w-xl to match learn page width by @samjohnduke ([4417efe](https://github.com/samjohnduke/sudoku/commit/4417efe3083fe5031ad0606731a441dbf420fd86))

- Restore stats page to max-w-2xl for charts and tables by @samjohnduke ([020102d](https://github.com/samjohnduke/sudoku/commit/020102da7f9c5d88c295909fdbef85df6ed420bc))

- Unify page widths to match learn page (max-w-xl) by @samjohnduke ([38b1234](https://github.com/samjohnduke/sudoku/commit/38b1234a1a93c954e4af70d59c2fa3ea978a9e7a))

- Improve mobile nav active state and sign-out button cursor by @samjohnduke ([fe4ad11](https://github.com/samjohnduke/sudoku/commit/fe4ad1177a159930688d6559f56c1bf2422065e9))

- Use solution-validated board for hint computation by @samjohnduke ([e37610b](https://github.com/samjohnduke/sudoku/commit/e37610bd7ab1cd84e09c8833a8dd58ef8e8cf4e2))

- Resolve TypeScript errors in offline cache access by @samjohnduke ([5233699](https://github.com/samjohnduke/sudoku/commit/5233699a4bf6abb54643ee642dd74fdd1fd1d0fb))

- Repair auth system — D1 compatibility, cookie security, error handling by @samjohnduke ([35fa2df](https://github.com/samjohnduke/sudoku/commit/35fa2df3ff5a4aa27324e619ddb0cac73542eef3))

- Redesign lesson pages to match editorial style by @samjohnduke ([2857cfa](https://github.com/samjohnduke/sudoku/commit/2857cfac4b682e40ac92d2033de11a48e11c3967))

- Redesign learn index as editorial guide by @samjohnduke ([68d6d06](https://github.com/samjohnduke/sudoku/commit/68d6d066155a553fa793d79477a58d993927b2d0))

- Replace difficulty chips with segmented control by @samjohnduke ([96f3cb1](https://github.com/samjohnduke/sudoku/commit/96f3cb101aa5a8130e3a6e932d17cb4eed6383b1))

- Swap to Instrument Serif, rework logo and learn page cards by @samjohnduke ([886d04c](https://github.com/samjohnduke/sudoku/commit/886d04ca8322dcc297f00e25c27982a608da5043))


### Documentation

- Update changelog [skip ci] by @github-actions[bot] ([1df3802](https://github.com/samjohnduke/sudoku/commit/1df38029a16d869b677d5da57d9d9acb777bcd4b))

- Update changelog [skip ci] by @github-actions[bot] ([a592ab3](https://github.com/samjohnduke/sudoku/commit/a592ab3ae766916c091eb482d7e959661d4d3215))

- Update changelog [skip ci] by @github-actions[bot] ([e65cdd6](https://github.com/samjohnduke/sudoku/commit/e65cdd64a20e37bb5c72bebb8f565f546e4c06a1))

- Update changelog [skip ci] by @github-actions[bot] ([bcc8638](https://github.com/samjohnduke/sudoku/commit/bcc863858141603ee4a3f0180281f271f441dbfb))

- Update changelog [skip ci] by @github-actions[bot] ([4a265b1](https://github.com/samjohnduke/sudoku/commit/4a265b1e3771fc0b5ba77a45cb220352e533e6a3))

- Add user menu design and implementation plan by @samjohnduke ([db21241](https://github.com/samjohnduke/sudoku/commit/db212413aa65516f5c35a4e67adcbb73b0d33ef0))

- Update changelog [skip ci] by @github-actions[bot] ([d8d5a70](https://github.com/samjohnduke/sudoku/commit/d8d5a70433f4586680e9cf9f5a0ab72e16ba6c90))

- Add security policy for vulnerability reporting by @samjohnduke ([418f340](https://github.com/samjohnduke/sudoku/commit/418f3404a4f56bfaa99e199d69431bdae9b7d0c5))

- Update changelog [skip ci] by @github-actions[bot] ([2f08549](https://github.com/samjohnduke/sudoku/commit/2f0854981644740ee4af97c8439f49c7fb4ab31a))

- Update changelog [skip ci] by @github-actions[bot] ([120b8f3](https://github.com/samjohnduke/sudoku/commit/120b8f373474364212777615407d21925d24ef5a))

- Add TODO.md with application review findings by @samjohnduke ([1da8501](https://github.com/samjohnduke/sudoku/commit/1da85014f3b89953f92cdd73810c1a78b0d43e9c))


### Features

- Add account page route for mobile user menu by @samjohnduke ([623906f](https://github.com/samjohnduke/sudoku/commit/623906f136a4a26f5b8b43f64ffbc29f18726393))

- Add desktop dropdown menu and update mobile nav tabs by @samjohnduke ([ca539d7](https://github.com/samjohnduke/sudoku/commit/ca539d7c56759a9c5e338909e2327dac206a54a7))

- Add DropdownMenu UI component by @samjohnduke ([74a2006](https://github.com/samjohnduke/sudoku/commit/74a2006c0ebc95ee5080e393eb3444b131dffdce))

- Add automated changelog generation with git-cliff by @samjohnduke ([96383b9](https://github.com/samjohnduke/sudoku/commit/96383b97dc11969b10b33558b578730da1e90331))

- Add GitHub Actions CI workflow with typecheck, test, build, and deploy by @samjohnduke ([d140430](https://github.com/samjohnduke/sudoku/commit/d140430f691cbc0642e88b4f55454510d22d493f))

- Add offline fallback for play page via cached puzzle data by @samjohnduke ([de8b4a4](https://github.com/samjohnduke/sudoku/commit/de8b4a42d8d30d1028b160e7e952dc2ff32b5448))

- Add offline fallback for random puzzle selection by @samjohnduke ([f8ba103](https://github.com/samjohnduke/sudoku/commit/f8ba1039ef45dfaeacdb5e588aca3fee73c366bc))

- Add service worker for offline caching by @samjohnduke ([bd7dc5b](https://github.com/samjohnduke/sudoku/commit/bd7dc5b798beff567a5d9df5a88c3186884db4fe))

- Add /api/puzzles/all endpoint for offline puzzle caching by @samjohnduke ([6b664d5](https://github.com/samjohnduke/sudoku/commit/6b664d51742e777a996cea23195cf7a9e703a834))

- Add PWA meta tags, manifest link, and service worker registration by @samjohnduke ([3ad6cfb](https://github.com/samjohnduke/sudoku/commit/3ad6cfb4ccaa4a1a856376f8dce3d521ba81fe26))

- Add web app manifest for PWA installability by @samjohnduke ([0efb27a](https://github.com/samjohnduke/sudoku/commit/0efb27ad9ac7dcac9bc455444cd8be9fd5a4cce8))

- Add PWA app icons generated from logo SVG by @samjohnduke ([6b5714c](https://github.com/samjohnduke/sudoku/commit/6b5714cc07fb0f5cd99e1c3085fdef2027f82d5b))

- Add abstract grid logo mark by @samjohnduke ([077c4e2](https://github.com/samjohnduke/sudoku/commit/077c4e2d4436c290d8732c3b218bcaa030842552))

- Restyle tutorial board to match new game board by @samjohnduke ([4c5c92a](https://github.com/samjohnduke/sudoku/commit/4c5c92a530c21634465ecf1f1e3d0b1ea4c73c03))

- Restyle sign-in page by @samjohnduke ([efd5f3a](https://github.com/samjohnduke/sudoku/commit/efd5f3a1364e010a7242b8287ace5e47c0c178e4))

- Restyle learn pages with serif headings by @samjohnduke ([0685c24](https://github.com/samjohnduke/sudoku/commit/0685c24097f3697b5036c9ec29f11c835f227867))

- Restyle stats with serif headings and new chart colors by @samjohnduke ([06bbbe7](https://github.com/samjohnduke/sudoku/commit/06bbbe7a75db82805cb9df17aebec5cf8d0a6d08))

- Restyle settings with serif headings by @samjohnduke ([d418850](https://github.com/samjohnduke/sudoku/commit/d418850728eb55598c0d2b1513383837e36b4d5b))

- Immersive play screen with floating info bar by @samjohnduke ([bd7bd16](https://github.com/samjohnduke/sudoku/commit/bd7bd1654e1ecde7aadd79d3e9d643f409312e4d))

- Redesign number pad with segmented toggle, 4-col layout, icons by @samjohnduke ([59458ab](https://github.com/samjohnduke/sudoku/commit/59458abcf08918663813a32e4abb7e584e460cd3))

- Redesign cell with mono font, refined colors, and animations by @samjohnduke ([af6a5e1](https://github.com/samjohnduke/sudoku/commit/af6a5e1842eeee2e5ad860da5a19208ac1bf47c3))

- Refined board with stronger box borders and shadow by @samjohnduke ([f0ee370](https://github.com/samjohnduke/sudoku/commit/f0ee3705ad078cfae85264bb35cf7a9bcd1af46d))

- Redesign home screen with difficulty chips, resume card, and serif logo by @samjohnduke ([d6c3af5](https://github.com/samjohnduke/sudoku/commit/d6c3af5a98146a87f6345cd2075450e6caa9c39f))

- Redesign header with serif logo, icon bottom nav, immersive play mode by @samjohnduke ([b0f8d34](https://github.com/samjohnduke/sudoku/commit/b0f8d348b4db24277ce482cbe92d45214deba692))

- New Paper & Ink theme tokens, fonts, and animation keyframes by @samjohnduke ([c9fa85a](https://github.com/samjohnduke/sudoku/commit/c9fa85aa9822768107778fe454dab892a38b00ab))

- Add puzzle difficulty control, auth signin, and data sync by @samjohnduke ([e3656de](https://github.com/samjohnduke/sudoku/commit/e3656de81252e6b3de3dc770bc1424349cc0c0ae))

- Responsive mobile layout by @samjohnduke ([8572ed2](https://github.com/samjohnduke/sudoku/commit/8572ed2a99b253ddb1cbac669805f3b89e2f8e77))

- Add navigation layout with header and mobile bottom nav by @samjohnduke ([37bbfae](https://github.com/samjohnduke/sudoku/commit/37bbfaec64cf3ea9c7138bf329c5a48df414c81e))

- Apply warm approachable theme by @samjohnduke ([df74dea](https://github.com/samjohnduke/sudoku/commit/df74dea9bf1320ef4d668d2e26ed82a926db4b91))

- Add personal stats page by @samjohnduke ([3b691a7](https://github.com/samjohnduke/sudoku/commit/3b691a77a5b97765d7231be23bfd51fb70608aa6))

- Add settings page with assist toggles, theme switch, and account management by @samjohnduke ([22c0ce0](https://github.com/samjohnduke/sudoku/commit/22c0ce0a35b46d413e8eff730cdc3ad5b2410353))

- Add interactive tutorial board component and tutorial data by @samjohnduke ([d0d5921](https://github.com/samjohnduke/sudoku/commit/d0d59213f5820cf0c8d69c64ac3f9b5893cca2f5))

- Add solving bible index page by @samjohnduke ([761455d](https://github.com/samjohnduke/sudoku/commit/761455d37b285a834fe5ea25afcc15cc69b4ba37))

- Add hint system using human-strategy solver by @samjohnduke ([dd66d09](https://github.com/samjohnduke/sudoku/commit/dd66d097a105c219fc045e1c1a06aa63d7f9d152))

- Add home route with difficulty slider and random puzzle API by @samjohnduke ([cce211f](https://github.com/samjohnduke/sudoku/commit/cce211fb17fa21d2dee15ca9903844e020339b5b))

- Add play route with board rendering and save API by @samjohnduke ([b13cb02](https://github.com/samjohnduke/sudoku/commit/b13cb02a312fed32693ce517242db7a40815d6b4))

- Add useGame hook for game state management by @samjohnduke ([dd93f4d](https://github.com/samjohnduke/sudoku/commit/dd93f4d6243dc251a37466a291847e4926bb1995))

- Add core sudoku board, cell, and number pad components by @samjohnduke ([5994b03](https://github.com/samjohnduke/sudoku/commit/5994b03940106174488e0ee6f363fc83a9a048df))

- Add CLI tools for puzzle generation and upload by @samjohnduke ([57a4821](https://github.com/samjohnduke/sudoku/commit/57a4821542c31e58cab8fc878b6ad1ab0d73b8af))

- Add puzzle generator with unique-solution verification by @samjohnduke ([b226a91](https://github.com/samjohnduke/sudoku/commit/b226a91cbc48acadcba25a8ad4a94eb9a35f392b))

- Add difficulty grading with technique-based scoring by @samjohnduke ([9f38156](https://github.com/samjohnduke/sudoku/commit/9f38156fa00f3ea9c2dbd9ea5699317c41878ca9))

- Add all remaining solving techniques to solver engine by @samjohnduke ([a08ebff](https://github.com/samjohnduke/sudoku/commit/a08ebffe33ed87e0c1e1daedec12993de641f187))

- Add Better Auth with passkey support by @samjohnduke ([41a0877](https://github.com/samjohnduke/sudoku/commit/41a08777d330c4f7d8ce3694baed47f794c3a54c))

- Set up D1 database with Drizzle schema by @samjohnduke ([04d801f](https://github.com/samjohnduke/sudoku/commit/04d801f486466183eb004261acc23fba7622112a))

- Add shadcn/ui with initial components by @samjohnduke ([931cdc0](https://github.com/samjohnduke/sudoku/commit/931cdc0ea95d84a70679e89f0d552a6dc5d47f1d))

- Scaffold React Router v7 + Cloudflare Workers by @samjohnduke ([62d1d91](https://github.com/samjohnduke/sudoku/commit/62d1d9175aa0ea8844b959a8b0e16a9e6b3560aa))


### Miscellaneous

- Fix branding, import ordering, localStorage keys, and add sharp dep by @samjohnduke ([48efc9e](https://github.com/samjohnduke/sudoku/commit/48efc9ecf6f99847eebd36a501c6d51a0d5394fc))


### Testing

- Add integration tests for bible data, hints, utils, and grader calibration by @samjohnduke ([79ba2eb](https://github.com/samjohnduke/sudoku/commit/79ba2ebded31473dc0f97a3c0c86b6139c231a6d))


