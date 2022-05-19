import * as React from "react";
import { useAtom } from "jotai";
import * as A from "./atoms";
import * as M from "./model";
import { CSSForwardingProps, classNames } from "./utils";
import styles from "./Infobox.module.scss";

function pluralize(singular: string, plural: string): (n: number) => string {
  return (n) => (n === 1 ? singular : plural);
}

export function Infobox({ className, style }: CSSForwardingProps) {
  const [cursor] = useAtom(A.cursor);
  const [pattern] = useAtom(A.pattern);
  const [palette] = useAtom(A.palette);
  const nextStitchChange = React.useMemo(
    () => M.Pattern.countUntilStitchChange(pattern, cursor),
    [pattern, cursor]
  );
  const stitchesUntilEndOfRow = React.useMemo(
    () =>
      cursor.directionHorizontal === "ltr"
        ? M.Pattern.extents(pattern).width - cursor.column - 1
        : cursor.column,
    [pattern, cursor]
  );
  const nextStitchColor = React.useMemo(
    () =>
      nextStitchChange.stitch == null
        ? null
        : palette[nextStitchChange.stitch.colorIndex],
    [palette, nextStitchChange.stitch]
  );

  return (
    <div className={classNames(styles.container, className)} style={style}>
      <div>
        <b>{nextStitchChange.count - 1}</b> more{" "}
        {pluralize("stitch", "stitches")(nextStitchChange.count - 1)} until next
        color{" "}
        {nextStitchColor != null && (
          <span>
            (
            <span
              className={styles.nextStitchColorPreview}
              style={{
                backgroundColor: nextStitchColor,
              }}
            />
            )
          </span>
        )}
      </div>
      <div className={styles.nextRowInfo}>
        <b>{stitchesUntilEndOfRow}</b> more{" "}
        {pluralize("stitch", "stitches")(stitchesUntilEndOfRow)} until end of
        row
      </div>
    </div>
  );
}

export default Infobox;
