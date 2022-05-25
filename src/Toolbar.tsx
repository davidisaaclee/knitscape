import * as React from "react";
import { useAtom } from "jotai";
import { compact } from "lodash";
import * as A from "./atoms";
import * as M from "./model";
import styles from "./Toolbar.module.scss";
import {
  CSSForwardingProps,
  classNames,
  flipHoriz,
  flipVert,
  pluralize,
} from "./utils";

function toStringWithSign(n: number): string {
  if (n > 0) {
    return `+${n}`;
  }
  return n.toString();
}

const pluralizeStitch = pluralize("stitch", "stitches");
const pluralizeRow = pluralize("row", "rows");

function useJump(offset: number) {
  const [cursor, setCursor] = useAtom(A.cursor);
  const [pattern] = useAtom(A.pattern);
  const [palette] = useAtom(A.palette);

  const targetCursor = React.useMemo(
    () => M.Cursor.offsetBy(cursor, offset, M.Pattern.extents(pattern)),
    [pattern, cursor, offset]
  );
  const stitchInfo = React.useMemo(
    () => M.Pattern.stitchAt(pattern, targetCursor),
    [pattern, targetCursor]
  );
  const color = React.useMemo(() => palette[stitchInfo], [stitchInfo, palette]);
  const jump = React.useCallback(() => {
    setCursor(targetCursor);
  }, [setCursor, targetCursor]);

  return { offset, color, jump };
}

export function Toolbar({ style, className }: CSSForwardingProps) {
  const [pattern] = useAtom(A.pattern);
  const [cursor, setCursor] = useAtom(A.cursor);
  const [bookmark, setBookmark] = useAtom(A.bookmark);
  const cursorHistory = A.useCursorHistory();

  const patternExtents = React.useMemo(
    () => M.Pattern.extents(pattern),
    [pattern]
  );

  const stitchesSinceBookmark = React.useMemo(() => {
    if (bookmark == null) {
      return null;
    }
    const distanceFromStartToCursor = M.Cursor.stitchCountSinceStartOfPattern(
      cursor,
      patternExtents
    );
    const distanceFromStartToBookmark = M.Cursor.stitchCountSinceStartOfPattern(
      bookmark,
      patternExtents
    );
    return Math.abs(distanceFromStartToBookmark - distanceFromStartToCursor);
  }, [bookmark, cursor, patternExtents]);

  const stitchesUntilEndOfRow = React.useMemo(
    () =>
      cursor.directionHorizontal === "ltr"
        ? patternExtents.width - cursor.column
        : cursor.column + 1,
    [patternExtents, cursor]
  );
  const untilNextRow = useJump(stitchesUntilEndOfRow);
  const untilNextStitchType = useJump(
    React.useMemo(
      () => M.Pattern.countUntilStitchChange(pattern, cursor).count,
      [pattern, cursor]
    )
  );
  const untilPreviousStitchType = useJump(
    React.useMemo(
      () =>
        -M.Pattern.countUntilStitchChange(pattern, {
          ...cursor,
          directionHorizontal: flipHoriz(cursor.directionHorizontal),
          directionVertical: flipVert(cursor.directionVertical),
        }).count,
      [pattern, cursor]
    )
  );

  const primaryJumpMessage = React.useMemo(() => {
    if (untilNextStitchType.offset < patternExtents.width) {
      return `(${untilNextStitchType.offset} ${pluralizeStitch(
        untilNextStitchType.offset
      )})`;
    }
    const rows = Math.floor(untilNextStitchType.offset / patternExtents.width);
    const overflow = untilNextStitchType.offset % patternExtents.width;
    return `(${compact([
      [rows, pluralizeRow(rows)].join(" "),
      overflow === 0 ? null : [overflow, pluralizeStitch(overflow)].join(" "),
    ]).join(" + ")})`;
  }, [patternExtents.width, untilNextStitchType.offset]);

  return (
    <div className={classNames(styles.toolbar, className)} style={style}>
      <div className={classNames(styles.toolbarRow, styles.auxiliary)}>
        <div className={styles.bookmarkButtons}>
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
        <JumpButton
          title="Previous color"
          onClick={untilPreviousStitchType.jump}
          offset={untilPreviousStitchType.offset}
          stitchColor={untilPreviousStitchType.color}
        />
        <JumpButton
          title="Start of next row"
          onClick={untilNextRow.jump}
          offset={untilNextRow.offset}
          stitchColor={untilNextRow.color}
        />
      </div>
      <div className={classNames(styles.toolbarRow, styles.mainRow)}>
        <div
          role="button"
          className={classNames(styles.jumpButton, styles.primaryAction)}
          style={{
            display: "flex",
            alignItems: "center",
            flexDirection: "row",
            padding: 12,
          }}
          onClick={untilNextStitchType.jump}
        >
          <div className={styles.primaryActionTitles}>
            <b>Jump to next color</b>
            <div>{primaryJumpMessage}</div>
          </div>
          {untilNextStitchType.color != null && (
            <span
              className={styles.colorPreview}
              style={{
                width: 40,
                height: 40,
                borderWidth: 2,
                marginLeft: 30,
                backgroundColor: untilNextStitchType.color,
                transform: "none",
              }}
            />
          )}
        </div>
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
  title: React.ReactNode;
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
        <span>({toStringWithSign(offset)} stitches)</span>
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
