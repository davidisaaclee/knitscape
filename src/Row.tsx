import * as React from "react";
import { useAtom } from "jotai";
import Measure from "react-measure";
import * as A from "./atoms";
import styles from "./Row.module.scss";
import { CSSForwardingProps, classNames } from "./utils";

const stitchSize = 40;

interface StitchDisplayInfo {
  color: string;
  isFocused: boolean;
  column: number;
}

export function Row({
  rowIndex,
  style,
  className,
}: CSSForwardingProps & { rowIndex: number }) {
  const [pattern] = useAtom(A.pattern);
  const [cursor] = useAtom(A.cursor);
  const [palette] = useAtom(A.palette);

  const [bounds, setBounds] = React.useState<null | {
    width: number;
    height: number;
    top: number;
    bottom: number;
    left: number;
    right: number;
  }>(null);

  const stitches = React.useMemo<StitchDisplayInfo[]>(
    () =>
      pattern[rowIndex].map((s, column) => ({
        color: palette[s],
        isFocused: cursor.row === rowIndex && cursor.column === column,
        column,
      })),
    [rowIndex, pattern, palette, cursor]
  );

  const isBackgroundRow = React.useMemo(
    () => cursor.row !== rowIndex,
    [cursor.row, rowIndex]
  );

  // const leftOffsetForStitchAtColumn = React.useCallback(
  //   (column: number) => {
  //     return bounds == null
  //       ? undefined
  //       : (bounds.width - stitchSize) / 2 -
  //           (cursor.column - column) * stitchSize;
  //   },
  //   [cursor.column, bounds]
  // );

  const styleForStitch = React.useCallback(
    ({ color, isFocused }: StitchDisplayInfo) => {
      return {
        backgroundColor: color,
        width: stitchSize,
        height: stitchSize,
        // left: leftOffsetForStitchAtColumn(column),
        ...(isFocused
          ? {
              transform: "scale(1.3)",
              zIndex: 2,
            }
          : {}),

        ...(isBackgroundRow
          ? {
              transform: "scale(0.7)",
            }
          : {}),
      };
    },
    [isBackgroundRow]
  );

  return (
    <Measure
      bounds
      onResize={(r) => {
        setBounds(r.bounds!);
      }}
    >
      {({ measureRef }) => (
        <div
          ref={measureRef}
          className={classNames(styles.container, className)}
          style={style}
        >
          {stitches.map((stitch) => (
            <div
              key={stitch.column}
              className={styles.stitch}
              style={styleForStitch(stitch)}
            >
              {(stitch.column % 5 === 0 || stitch.column === cursor.column) && (
                <label
                  className={classNames(styles.columnIndex, styles.absolute)}
                >
                  {stitch.column}
                </label>
              )}
              {/*
              <label
                className={classNames(styles.columnIndex, styles.relative)}
              >
                {Math.abs(column - cursor.column)}
              </label>
                */}
            </div>
          ))}
        </div>
      )}
    </Measure>
  );
}

export default Row;
