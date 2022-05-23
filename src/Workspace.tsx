import * as React from "react";
import { useAtom } from "jotai";
import Measure from "react-measure";
import * as A from "./atoms";
import styles from "./Workspace.module.scss";
import { CSSForwardingProps, classNames } from "./utils";

const stitchSize = 40;
const focusedRowHeight = 90;
const backgroundRowHeight = 60;

interface StitchDisplayInfo {
  color: string;
  isFocused: boolean;
  column: number;
}

export function Workspace({ style, className }: CSSForwardingProps) {
  const scrollRef = React.useRef<React.ElementRef<"div">>(null);
  const [palette] = useAtom(A.palette);
  const [pattern] = useAtom(A.pattern);
  const [cursor, setCursor] = useAtom(A.cursor);
  const [bookmark] = useAtom(A.bookmark);

  const [bounds, setBounds] = React.useState<null | {
    width: number;
    height: number;
    top: number;
    bottom: number;
    left: number;
    right: number;
  }>(null);

  const rowsToDisplay = React.useMemo<
    Array<{
      stitches: StitchDisplayInfo[];
      isFocused: boolean;
      rowIndex: number;
    }>
  >(
    () =>
      [cursor.row + 1, cursor.row, cursor.row - 1, cursor.row - 2]
        .filter((rowIndex) => pattern.rows[rowIndex] != null)
        .map((rowIndex) => {
          const stitchValues = [...pattern.rows[rowIndex]].map(
            (s, i) => [s, i] as const
          );
          if (cursor.directionHorizontal === "ltr") {
            stitchValues.reverse();
          }
          return {
            rowIndex,
            isFocused: cursor.row === rowIndex,
            stitches: stitchValues.map(([s, column]) => ({
              color: palette[s],
              isFocused: cursor.row === rowIndex && cursor.column === column,
              column,
            })),
          };
        }),
    [pattern, palette, cursor]
  );

  const scrollContentInsetHorizontal = React.useMemo(
    () => (bounds == null ? 0 : bounds.width / 2),
    [bounds]
  );

  React.useEffect(() => {
    const scroller = scrollRef.current;
    if (scroller == null) {
      return;
    }
    const x = scroller.querySelector(`[data-stitchcolumn="${cursor.column}"]`);
    if (x == null) {
      return;
    }
    const rect = x.getBoundingClientRect();
    scroller.scrollBy({
      left: rect.left + stitchSize / 2 - scrollContentInsetHorizontal,
      behavior: "smooth",
    });
  }, [cursor, scrollRef, scrollContentInsetHorizontal]);

  return (
    <Measure
      bounds
      onResize={(r) => {
        setBounds(r.bounds!);
      }}
    >
      {({ measureRef }) => (
        <div ref={measureRef} className={className} style={style}>
          <div
            ref={scrollRef}
            className={styles.scrollContainer}
            style={{ height: focusedRowHeight + backgroundRowHeight }}
          >
            {rowsToDisplay.map(
              (row) =>
                pattern.rows[row.rowIndex] != null && (
                  <div
                    key={row.rowIndex}
                    className={classNames(
                      styles.rowContainer,
                      row.isFocused && styles.focusedRow
                    )}
                    style={{
                      height: row.isFocused
                        ? focusedRowHeight
                        : backgroundRowHeight,
                      paddingLeft: scrollContentInsetHorizontal,
                      paddingRight: scrollContentInsetHorizontal,
                      opacity:
                        row.rowIndex === cursor.row ||
                        row.rowIndex === cursor.row - 1
                          ? 1
                          : 0,
                      transform: `translateY(${
                        (cursor.row - row.rowIndex) * 100
                      }%)`,
                    }}
                  >
                    <span
                      className={classNames(styles.rowInfoBox, styles.rowIndex)}
                      style={{
                        maxHeight: row.isFocused
                          ? focusedRowHeight
                          : backgroundRowHeight,
                      }}
                    >
                      {row.rowIndex}
                    </span>
                    {row.stitches.map((stitch) => (
                      <div
                        key={stitch.column}
                        className={classNames(
                          styles.stitch,
                          stitch.isFocused && styles.focusedStitch
                        )}
                        data-stitchcolumn={stitch.column}
                        style={{
                          // backgroundColor: stitch.color,
                          width: stitchSize,
                          height: stitchSize,
                        }}
                        onClick={() => {
                          setCursor((c) => ({
                            ...c,
                            row: row.rowIndex,
                            column: stitch.column,
                          }));
                        }}
                      >
                        <div
                          className={styles.stitchColor}
                          style={{ backgroundColor: stitch.color }}
                        />
                        {bookmark != null &&
                          row.rowIndex === bookmark.row &&
                          stitch.column === bookmark.column && (
                            <div className={styles.bookmark} />
                          )}
                        {row.rowIndex === cursor.row &&
                          (stitch.column % 5 === 0 ||
                            stitch.column === cursor.column) && (
                            <div className={styles.columnIndex}>
                              {stitch.column}
                            </div>
                          )}
                      </div>
                    ))}
                    <span
                      className={styles.rowInfoBox}
                      style={{
                        maxHeight: row.isFocused
                          ? focusedRowHeight
                          : backgroundRowHeight,
                      }}
                    >
                      {Array.from(
                        row.stitches.reduce((allColors, { color }) => {
                          allColors.add(color);
                          return allColors;
                        }, new Set<string>())
                      )
                        .sort()
                        .map((color) => (
                          <div
                            className={styles.colorPreview}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                    </span>
                  </div>
                )
            )}
          </div>
        </div>
      )}
    </Measure>
  );
}

export default Workspace;
