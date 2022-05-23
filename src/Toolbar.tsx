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
  const [palette] = useAtom(A.palette);
  const [cursor, setCursor] = useAtom(A.cursor);
  const [bookmark, setBookmark] = useAtom(A.bookmark);
  const cursorHistory = A.useCursorHistory();

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

  const untilNextStitchType = React.useMemo(
    () => M.Pattern.countUntilStitchChange(pattern, cursor),
    [pattern, cursor]
  );
  const untilPreviousStitchType = React.useMemo(
    () =>
      M.Pattern.countUntilStitchChange(pattern, {
        ...cursor,
        directionHorizontal: flipHoriz(cursor.directionHorizontal),
      }),
    [pattern, cursor]
  );

  const jumpToNextColor = React.useCallback(() => {
    setCursor((c) =>
      M.Cursor.offsetBy(
        c,
        untilNextStitchType.count,
        M.Pattern.extents(pattern)
      )
    );
  }, [pattern, untilNextStitchType, setCursor]);

  const jumpToPreviousColor = React.useCallback(() => {
    setCursor((c) =>
      M.Cursor.offsetBy(
        c,
        -untilPreviousStitchType.count,
        M.Pattern.extents(pattern)
      )
    );
  }, [pattern, untilPreviousStitchType, setCursor]);

  const nextStitchTypeColor = React.useMemo(
    () =>
      untilNextStitchType.stitch == null
        ? null
        : palette[untilNextStitchType.stitch.colorIndex],
    [palette, untilNextStitchType.stitch]
  );
  const previousStitchTypeColor = React.useMemo(
    () =>
      untilPreviousStitchType.stitch == null
        ? null
        : palette[untilPreviousStitchType.stitch.colorIndex],
    [palette, untilPreviousStitchType.stitch]
  );

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
        <button
          className={classNames(
            cursorHistory.resetType === "undo" && styles.undo,
            cursorHistory.resetType === "redo" && styles.redo
          )}
          onClick={() => {
            cursorHistory.reset();
          }}
        >
          {cursorHistory.resetType === "undo" ? "Undo" : "Redo"} last jump
        </button>
      </div>
      <div className={styles.toolbarRow}>
        <Infobox style={{ flex: 1 }} />
      </div>
      <div className={classNames(styles.toolbarRow, styles.mainRow)}>
        <JumpButton
          title="Previous color"
          onClick={jumpToPreviousColor}
          offset={-untilPreviousStitchType.count}
          stitchColor={previousStitchTypeColor}
        />
        <JumpButton
          className={styles.primaryAction}
          title="Next color"
          onClick={jumpToNextColor}
          offset={untilNextStitchType.count}
          stitchColor={nextStitchTypeColor}
        />
      </div>
    </div>
  );
}

function JumpButton({
  onClick,
  title,
  offset,
  stitchColor,
  style,
  className,
}: CSSForwardingProps & {
  title: string;
  onClick(): void;
  offset: number;
  stitchColor: string | null;
}) {
  return (
    <div
      role="button"
      className={classNames(styles.jumpButton, className)}
      style={style}
      onClick={onClick}
    >
      <span>{title}</span>
      <div>
        <span>({toStringWithSign(offset)})</span>
        {stitchColor != null && (
          <span
            className={styles.colorPreview}
            style={{ backgroundColor: stitchColor }}
          />
        )}
      </div>
    </div>
  );
}

export default Toolbar;
