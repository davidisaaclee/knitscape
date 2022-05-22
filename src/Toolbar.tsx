import * as React from "react";
import { useAtom } from "jotai";
import Infobox from "./Infobox";
import * as A from "./atoms";
import * as M from "./model";
import styles from "./Toolbar.module.scss";
import { CSSForwardingProps, classNames, flipHoriz } from "./utils";

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

  const jumpToNextColor = React.useCallback(() => {
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
  }, [pattern, cursor, setCursor]);
  const jumpToPreviousColor = React.useCallback(() => {
    const untilNextStitchType = M.Pattern.countUntilStitchChange(pattern, {
      ...cursor,
      directionHorizontal: flipHoriz(cursor.directionHorizontal),
    });
    setCursor((c) =>
      M.Cursor.offsetBy(
        c,
        -untilNextStitchType.count,
        M.Pattern.extents(pattern)
      )
    );
  }, [pattern, cursor, setCursor]);

  return (
    <div className={classNames(styles.toolbar, className)} style={style}>
      <div className={classNames(styles.toolbarRow, styles.auxiliary)}>
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
          <button onClick={() => setBookmark(cursor)}>Save bookmark</button>
        </div>
        <button className={styles.jumpFive} onClick={() => incrementCursor(5)}>
          Jump 5
        </button>
      </div>
      <div className={styles.toolbarRow}>
        <button className={styles.back} onClick={() => incrementCursor(-1)}>
          Back
        </button>
        <Infobox style={{ flex: 1 }} />
      </div>
      <div className={classNames(styles.toolbarRow, styles.mainRow)}>
        <button onClick={jumpToPreviousColor}>Jump to previous color</button>
        <button className={styles.primaryAction} onClick={jumpToNextColor}>
          Jump to next color
        </button>
      </div>
    </div>
  );
}

export default Toolbar;
