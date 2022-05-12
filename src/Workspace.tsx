import { range } from "lodash";
import * as React from "react";
import { useAtom } from "jotai";
import Measure from "react-measure";
import * as A from "./atoms";
import styles from "./Workspace.module.scss";
import { CSSForwardingProps } from "./utils";

const stitchSize = 50;

interface StitchDisplayInfo {
  color: string;
  isFocused: boolean;
  column: number;
}

export function Workspace({ style, className }: CSSForwardingProps) {
  const scrollRef = React.useRef<React.ElementRef<"div">>(null);
  const [palette] = useAtom(A.palette);
  const [pattern] = useAtom(A.pattern);
  const [cursor] = useAtom(A.cursor);

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
      isBackgroundRow: boolean;
      rowIndex: number;
    }>
  >(
    () =>
      range(2)
        .map((rowOffset) => cursor.row - rowOffset)
        .filter((rowIndex) => pattern.rows[rowIndex] != null)
        .map((rowIndex) => ({
          rowIndex,
          isBackgroundRow: rowIndex !== cursor.row,
          stitches: pattern.rows[rowIndex].map((s, column) => ({
            color: palette[s],
            isFocused: cursor.row === rowIndex && cursor.column === column,
            column,
          })),
        })),
    [pattern, palette, cursor]
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
    const marginLeft = bounds == null ? 0 : bounds.width / 2;
    scroller.scrollBy({
      left: rect.left + stitchSize / 2 - marginLeft,
      behavior: "smooth",
    });
  }, [cursor, scrollRef, bounds]);

  return (
    <Measure
      bounds
      onResize={(r) => {
        setBounds(r.bounds!);
      }}
    >
      {({ measureRef }) => (
        <div ref={measureRef} className={className} style={style}>
          <div ref={scrollRef} className={styles.scrollContainer}>
            <div className={styles.scrollContent}>
              {rowsToDisplay.map(
                (row) =>
                  pattern.rows[row.rowIndex] != null && (
                    <div
                      key={row.rowIndex}
                      className={styles.rowContainer}
                      style={{
                        paddingLeft: bounds == null ? 0 : bounds.width / 2,
                        paddingRight: bounds == null ? 0 : bounds.width / 2,
                      }}
                    >
                      {row.stitches.map((stitch) => (
                        <div
                          key={stitch.column}
                          className={styles.stitch}
                          data-stitchcolumn={stitch.column}
                          style={{
                            backgroundColor: stitch.color,
                            width: stitchSize,
                            height: stitchSize,
                            ...(stitch.isFocused
                              ? {
                                  transform: "scale(1.3)",
                                  zIndex: 2,
                                }
                              : {}),

                            ...(row.isBackgroundRow
                              ? { transform: "scale(0.7)" }
                              : {}),
                          }}
                        >
                          {!row.isBackgroundRow &&
                            (stitch.column % 5 === 0 ||
                              stitch.column === cursor.column) && (
                              <div className={styles.columnIndex}>
                                {stitch.column}
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  )
              )}
            </div>
          </div>
        </div>
      )}
    </Measure>
  );
}

export default Workspace;
