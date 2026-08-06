// License: MPL-2.0

import { describe, expect, test } from "@jest/globals";
import { ARCHIVES, getArchiveById, isAllowedArchiveUrl } from "../archiveManifest.js";

describe("archive manifest", () => {
  test("最新と11件の日時別アーカイブを時系列で定義する", () => {
    expect(ARCHIVES).toHaveLength(12);
    expect(ARCHIVES[0].id).toBe("latest");
    const historyIds = ARCHIVES.slice(1).map((archive) => archive.id);
    expect(historyIds).toEqual([...historyIds].sort());
    expect(historyIds.at(-1)).toBe("202608031600");
    expect(getArchiveById("unknown").id).toBe("latest");
  });

  test("国土交通省の固定アーカイブURLだけを許可する", () => {
    for (const archive of ARCHIVES) {
      expect(isAllowedArchiveUrl(archive.url)).toBe(true);
      expect(new URL(archive.url).hostname).toBe("www.mlit.go.jp");
    }
    expect(isAllowedArchiveUrl("https://example.com/map.zip")).toBe(false);
  });

  test("収録欠落が確認済みの履歴を明示する", () => {
    expect(getArchiveById("202607290800").expectedMissing).toEqual(["road", "travel"]);
    expect(getArchiveById("202607291200").expectedMissing).toEqual(["travel"]);
  });
});
