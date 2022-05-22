import * as React from "react";
import { useAtom } from "jotai";
import Infobox from "./Infobox";
import * as A from "./atoms";
import * as M from "./model";
import styles from "./Toolbar.module.scss";
import { CSSForwardingProps, classNames } from "./utils";

function toStringWithSign(n: number): string {
  if (n > 0) {
    return `+${n}`;
  }
  return n.toString();
}

export function Toolbar({ style, className }: CSSForwardingProps) {
  const [pattern] = useAtom(A.pattern);
  const [cursor, setCursor] = useAtom(A.cursor);
  const [bookmark, setBookmark] = useAtom(A.bookmark);

  const incrementCursor = React.useCallback(
    (delta: number) => {
      const patternExtents = M.Pattern.extents(pattern);
      if (patternExtents.height + patternExtents.width === 0) {
        return;
      }
      setCursor((prev) => M.Cursor.offsetBy(prev, delta, patternExtents));
    },
    [setCursor, pattern]
  );

  const stitchesSinceBookmark = React.useMemo(() => {
    if (bookmark == null) {
      return null;
    }
    const patternExtents = M.Pattern.extents(pattern);
    const distanceFromStartToCursor = M.Cursor.stitchCountSinceStartOfPattern(
      cursor,
      patternExtents
    );
    const distanceFromStartToBookmark = M.Cursor.stitchCountSinceStartOfPattern(
      bookmark,
      patternExtents
    );
    return Math.abs(distanceFromStartToBookmark - distanceFromStartToCursor);
  }, [bookmark, cursor, pattern]);

  return (
    <div className={classNames(styles.toolbar, className)} style={style}>
      <div
        className={styles.auxiliary}
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
          }}
        >
          <button
            disabled={bookmark == null}
            onClick={() => {
              if (bookmark != null) {
                setCursor(bookmark);
              }
            }}
          >
            Jump to bookmark{" "}
            {stitchesSinceBookmark == null || stitchesSinceBookmark === 0
              ? ""
              : `(${toStringWithSign(-stitchesSinceBookmark)})`}
          </button>
          <button
            onClick={() => {
              setBookmark(cursor);
            }}
          >
            Save bookmark
          </button>
        </div>
        <button
          onClick={() => {
            const untilNextStitchType = M.Pattern.countUntilStitchChange(
              pattern,
              cursor
            );
            setCursor((c) =>
              M.Cursor.offsetBy(
                c,
                untilNextStitchType.count,
                M.Pattern.extents(pattern)
              )
            );
          }}
        >
          Jump to next color
        </button>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
        }}
      >
        <button className={styles.back} onClick={() => incrementCursor(-1)}>
          Back
        </button>
        <Infobox />
      </div>
      <div
        style={{
          display: "flex",
          flexFlow: "row nowrap",
          alignItems: "stretch",
          flex: 1,
        }}
      >
        <button className={styles.jumpFive} onClick={() => incrementCursor(5)}>
          Jump 5
        </button>
        <button className={styles.next} onClick={() => incrementCursor(1)}>
          Next
        </button>
      </div>
    </div>
  );
}

export default Toolbar;
