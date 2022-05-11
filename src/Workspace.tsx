import { useAtom } from "jotai";
import Row from "./Row";
import * as A from "./atoms";
import styles from "./Workspace.module.scss";
import { CSSForwardingProps, classNames } from "./utils";

export function Workspace({ style, className }: CSSForwardingProps) {
  const [pattern] = useAtom(A.pattern);
  const [cursor] = useAtom(A.cursor);

  return (
    <div className={classNames(styles.container, className)} style={style}>
      <div className={styles.scrollContent}>
        {[0, 1].map(
          (offset) =>
            pattern[cursor.row - offset] != null && (
              <Row
                key={offset}
                className={styles.row}
                rowIndex={cursor.row - offset}
              />
            )
        )}
      </div>
    </div>
  );
}

export default Workspace;
