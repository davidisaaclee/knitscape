import * as React from "react";
import { useAtom } from "jotai";
import * as A from "./atoms";
import * as M from "./model";
import { CSSForwardingProps, classNames } from "./utils";
import styles from "./Infobox.module.scss";

export function Infobox({ className, style }: CSSForwardingProps) {
  const [cursor] = useAtom(A.cursor);
  const [pattern] = useAtom(A.pattern);
  const [palette] = useAtom(A.palette);
  const nextStitchChange = React.useMemo(
    () => M.Pattern.countUntilStitchChange(pattern, cursor),
    [pattern, cursor]
  );
  React.useEffect(() => {
    console.log(nextStitchChange);
  }, [nextStitchChange]);

  return (
    <div className={classNames(styles.container, className)} style={style}>
      {nextStitchChange.count} stitches until next color
    </div>
  );
}

export default Infobox;
