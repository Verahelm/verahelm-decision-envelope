# Release build and verification

Release artifacts are generated from the exact tagged commit with Git's archive
format and `gzip -n`. The release workflow builds the archive twice and requires
byte equality before publication.

## Consumer verification

Requires GitHub CLI 2.49 or later and a SHA-256 utility.

```bash
gh release download v0.7.0 --repo Verahelm/verahelm-decision-envelope
sha256sum --check SHA256SUMS
gh attestation verify verahelm-decision-envelope-0.7.0.tar.gz --repo Verahelm/verahelm-decision-envelope
```

Compare the downloaded `SOURCE_COMMIT` with the release target shown by GitHub.
The checksum detects byte changes relative to the published digest. The
attestation identifies the GitHub workflow and repository that produced the
asset; it is not an independent security review.

## Independent archive rebuild

From a clean checkout of the `SOURCE_COMMIT` value:

```bash
version=0.7.0
git archive --format=tar --prefix="verahelm-decision-envelope-${version}/" HEAD | gzip -n > rebuilt.tar.gz
sha256sum rebuilt.tar.gz
```

Compare that digest with the archive line in `SHA256SUMS`. Reproduction requires
compatible Git archive and gzip behavior; the workflow's same-run double build
does not by itself prove cross-platform reproducibility.
