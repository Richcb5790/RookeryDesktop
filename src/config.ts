// Where installers are published. The download buttons read this repository's latest GitHub release.
export const RELEASES_REPO = 'Richcb5790/RookeryDesktop'

export const LINKS = {
  repo: `https://github.com/${RELEASES_REPO}`,
  releases: `https://github.com/${RELEASES_REPO}/releases`,
  // The list rather than /releases/latest: it answers 200 with [] before the first release, where
  // /latest answers 404, which browsers log as an error in every visitor's console.
  releasesApi: `https://api.github.com/repos/${RELEASES_REPO}/releases?per_page=10`
}
