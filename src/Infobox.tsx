import * as React from "react";
import { useAtom } from "jotai";
import * as A from "./atoms";
import * as M from "./model";
import { CSSForwardingProps, classNames, pluralize } from "./utils";
import styles from "./Infobox.module.scss";

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
        ? M.Pattern.extents(pattern).width - cursor.column
        : cursor.column + 1,
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
      <div className={styles.nextStitchInfo}>
        <b>{nextStitchChange.count}</b> more{" "}
        {pluralize("stitch", "stitches")(nextStitchChange.count)} until next
        color{" "}
        {nextStitchColor != null && (
          <span>
            (
            <span
              className={styles.colorPreview}
              style={{
                backgroundColor: nextStitchColor,
              }}
            />
            )
          </span>
        )}
      </div>
      <div className={styles.secondaryInfo}>
        <b>{stitchesUntilEndOfRow}</b> more{" "}
        {pluralize("stitch", "stitches")(stitchesUntilEndOfRow)} until end of
        row
      </div>
    </div>
  );
}

export default Infobox;
