import * as React from "react";
import { useAtom } from "jotai";
import Workspace from "./Workspace";
import PatternMap from "./PatternMap";
import Infobox from "./Infobox";
import * as A from "./atoms";
import * as M from "./model";
import styles from "./App.module.scss";

function horizDirToString(dir: "ltr" | "rtl"): string {
  return dir === "ltr" ? "left-to-right" : "right-to-left";
}

function flipHoriz(
  dir: "ltr" | "rtl",
  shouldFlip: boolean = true
): "ltr" | "rtl" {
  if (!shouldFlip) {
    return dir;
  }
  return dir === "ltr" ? "rtl" : "ltr";
}
function flipVert(
  dir: "ascending" | "descending",
  shouldFlip: boolean = true
): "ascending" | "descending" {
  if (!shouldFlip) {
    return dir;
  }
  return dir === "ascending" ? "descending" : "ascending";
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

function App() {
  const [pattern, setPattern] = useAtom(A.pattern);
  const [, setPalette] = useAtom(A.palette);
  const [cursor, setCursor] = useAtom(A.cursor);

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

  return (
    <div className={styles.container}>
      <div className={styles.topSection}>
        <div className={styles.flipButtonSet}>
          <button
            onClick={() => {
              setCursor((prev) => ({
                ...prev,
                directionHorizontal: flipHoriz(prev.directionHorizontal),
              }));
            }}
          >
            Change direction to{" "}
            {horizDirToString(flipHoriz(cursor.directionHorizontal))}
          </button>
          <button
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
          <div
            className={styles.verticalDirectionIndicator}
            data-direction={cursor.directionVertical}
          >
            moving {cursor.directionVertical === "ascending" ? "down" : "up"}{" "}
            the pattern
          </div>
          <div className={styles.minimapMain}>
            <div className={styles.filePicker} onClick={launchFilePicker}>
              Upload pattern...
            </div>
            <PatternMap className={styles.minimap} />
            <div className={styles.dimensionsInfo}>
              {M.Pattern.extents(pattern).height} rows,{" "}
              {M.Pattern.extents(pattern).width} columns
            </div>
          </div>
        </div>
      </div>
      <div className={styles.workspaceContainer}>
        <button
          className={styles.rowIncrementButton}
          onClick={() => {
            setCursor((prev) => ({
              ...prev,
              row: Math.min(pattern.rows.length - 1, prev.row + 1),
            }));
          }}
        >
          ⬆️ Move a row up
        </button>
        <Workspace className={styles.workspace} />
        <button
          className={styles.rowIncrementButton}
          onClick={() => {
            setCursor((prev) => ({
              ...prev,
              row: Math.max(0, prev.row - 1),
            }));
          }}
        >
          ⬇️ Move a row down
        </button>
      </div>
      <Infobox />
      <div className={styles.toolbar}>
        <button className={styles.back} onClick={() => incrementCursor(-1)}>
          Back
        </button>
        <button className={styles.next} onClick={() => incrementCursor(1)}>
          <span>Next</span>
          <span>{cursor.directionHorizontal === "ltr" ? "➡️" : "⬅️"}</span>
        </button>
      </div>
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
