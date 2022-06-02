import * as React from "react";
import { useAtom } from "jotai";
import Workspace from "./Workspace";
import PatternMap from "./PatternMap";
import Toolbar from "./Toolbar";
import * as A from "./atoms";
import * as M from "./model";
import styles from "./App.module.scss";
import { classNames, flipHoriz, flipVert } from "./utils";
import NoSleep from "nosleep.js";

const noSleep = new NoSleep();
function useWakeLock() {
  React.useLayoutEffect(() => {
    document.addEventListener(
      "click",
      function enableNoSleep() {
        document.removeEventListener("click", enableNoSleep, false);
        noSleep.enable();
      },
      false
    );
  }, []);
}

function imageDataFrom(url: string): Promise<ImageData> {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    img.addEventListener("load", () => {
      canvas.width = img.width;
      canvas.height = img.height;
      context.drawImage(img, 0, 0);
      const imageData = context.getImageData(0, 0, img.width, img.height);
      resolve(imageData);
    });
    img.src = url;
  });
}

function useMigrateLegacyCursor() {
  const [legacyCursor, setLegacyCursor] = useAtom(A.legacyCursor);
  const [, setCursorHistory] = useAtom(A.cursorHistory);

  React.useEffect(
    () => {
      if (legacyCursor.row === -1) {
        return;
      }
      setCursorHistory({ commits: [legacyCursor], index: 0 });
      setLegacyCursor((prev) => ({ ...prev, row: -1 }));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
}

function App() {
  useWakeLock();
  useMigrateLegacyCursor();

  const [pattern, setPattern] = useAtom(A.pattern);
  const [, setPalette] = useAtom(A.palette);
  const [cursor, setCursor] = useAtom(A.cursor);

  const launchFilePicker = useFilePicker({
    async onChange(event) {
      const file = (event.currentTarget as HTMLInputElement).files?.[0];
      if (file == null) {
        return;
      }
      const objectUrl = URL.createObjectURL(file);
      const imageData = await imageDataFrom(objectUrl);
      URL.revokeObjectURL(objectUrl);
      const [pattern, palette] = M.patternFromImageData(imageData);
      setPattern(pattern);
      setPalette(palette);
      setCursor(M.Cursor.create());
    },
  });

  const patternExtents = React.useMemo(
    () => M.Pattern.extents(pattern),
    [pattern]
  );

  return (
    <div className={styles.container}>
      <button
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          opacity: 0.1,
        }}
        onClick={() => {
          window.location.reload();
        }}
      >
        v12
      </button>
      <div className={styles.topSection}>
        <div className={styles.flipContainer}>
          <div
            className={classNames(styles.directionIndicator, styles.vertical)}
            data-direction={cursor.directionVertical}
          >
            Moving {cursor.directionVertical === "ascending" ? "down" : "up"}{" "}
            the pattern
          </div>
          <button
            className={styles.flipButton}
            onClick={() => {
              setPattern(M.Pattern.flippingVertically);
              setCursor((prev) => ({
                ...prev,
                directionVertical: flipVert(prev.directionVertical),
              }));
            }}
          >
            Flip pattern vertically
          </button>
        </div>
        <div className={styles.minimapContainer}>
          <div className={styles.minimapMain}>
            <div
              className={styles.filePicker}
              role="button"
              onClick={launchFilePicker}
            >
              Upload pattern...
            </div>
            <PatternMap className={styles.minimap} />
            <div className={styles.dimensionsInfo}>
              {patternExtents.height} rows, {patternExtents.width} columns
            </div>
          </div>
        </div>
        <div className={styles.flipContainer}>
          <div
            className={classNames(styles.directionIndicator, styles.horizontal)}
            data-direction={cursor.directionHorizontal}
          >
            Looking at{" "}
            <em>{cursor.directionHorizontal === "ltr" ? "front" : "back"}</em>{" "}
            side of piece
          </div>
          <button
            className={styles.flipButton}
            onClick={() => {
              setCursor((prev) => ({
                ...prev,
                directionHorizontal: flipHoriz(prev.directionHorizontal),
              }));
            }}
          >
            Flip horizontally (turn over)
          </button>
        </div>
      </div>
      <div className={styles.workspaceContainer}>
        <button
          className={styles.rowIncrementButton}
          onClick={() => {
            setCursor((prev) =>
              M.Cursor.offsetBy(
                prev,
                M.Cursor.offsetToMoveVerticallyRespectingDirectionChange(
                  prev,
                  1,
                  patternExtents
                ),
                patternExtents
              )
            );
          }}
        >
          ⬆️
        </button>
        <Workspace className={styles.workspace} />
        <button
          className={styles.rowIncrementButton}
          onClick={() => {
            setCursor((prev) =>
              M.Cursor.offsetBy(
                prev,
                M.Cursor.offsetToMoveVerticallyRespectingDirectionChange(
                  prev,
                  -1,
                  patternExtents
                ),
                patternExtents
              )
            );
          }}
        >
          ⬇️
        </button>
      </div>
      <Toolbar className={styles.toolbar} />
    </div>
  );
}

function useFilePicker({ onChange }: { onChange: (event: Event) => void }) {
  const input = React.useMemo(() => {
    const fileInput = document.createElement("input");
    fileInput.setAttribute("type", "file");
    return fileInput;
  }, []);

  React.useEffect(() => {
    input.addEventListener("change", onChange);
    return () => input.removeEventListener("change", onChange);
  }, [input, onChange]);

  return React.useCallback(() => input.click(), [input]);
}

export default App;
