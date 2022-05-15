import * as React from "react";
import { useAtom } from "jotai";
import Workspace from "./Workspace";
import PatternMap from "./PatternMap";
import * as A from "./atoms";
import * as M from "./model";
import styles from "./App.module.scss";

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
      setCursor((prev) => {
        const prevPosition =
          (prev.directionHorizontal === "ltr"
            ? prev.column
            : patternExtents.width - 1 - prev.column) +
          prev.row * patternExtents.width;
        const nextPosition = Math.max(
          Math.min(
            prevPosition + delta,
            patternExtents.width * patternExtents.height - 1
          ),
          0
        );
        const outRow = Math.floor(nextPosition / patternExtents.width);
        const outDirH = flipHoriz(
          prev.directionHorizontal,
          (outRow - prev.row) % 2 !== 0
        );
        // before applying horizontal direction
        const columnOffset = nextPosition % patternExtents.width;
        return {
          ...prev,
          column:
            outDirH === "ltr"
              ? columnOffset
              : patternExtents.width - 1 - columnOffset,
          row: outRow,
          directionHorizontal: outDirH,
        };
      });
    },
    [setCursor, pattern]
  );

  return (
    <div className={styles.container}>
      <div className={styles.navbar}>
        <div className={styles.rowIndexDisplay}>
          <button
            style={{ padding: 4 }}
            onClick={() => {
              setCursor((prev) => ({
                ...prev,
                row: Math.max(0, prev.row - 1),
              }));
            }}
          >
            -
          </button>
          <h1
            style={{
              fontSize: 24,
              margin: 6,
            }}
          >
            row {cursor.row}
          </h1>
          <button
            style={{ padding: 4 }}
            onClick={() => {
              setCursor((prev) => ({
                ...prev,
                row: Math.min(pattern.rows.length - 1, prev.row + 1),
              }));
            }}
          >
            +
          </button>
        </div>
        <div style={{ display: "flex", flexFlow: "column" }}>
          <button
            onClick={() => {
              setCursor((prev) => ({
                ...prev,
                directionHorizontal: flipHoriz(prev.directionHorizontal),
              }));
            }}
          >
            flip h
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
            flip v
          </button>
        </div>
        <input
          type="file"
          onChange={async (event) => {
            const file = event.target.files?.[0];
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
          }}
        />
      </div>
      <div
        style={{
          display: "none",
          background: "orange",
        }}
      >
        This is an info box
      </div>
      <Workspace className={styles.workspace} />
      <div className={styles.toolbar}>
        <button style={{ width: "10%" }} onClick={() => incrementCursor(-1)}>
          Back
        </button>
        <button style={{ flex: 1 }} onClick={() => incrementCursor(1)}>
          Next {cursor.directionHorizontal === "ltr" ? "➡️" : "⬅️"}
        </button>
      </div>
      <div className={styles.minimapContainer}>
        <PatternMap className={styles.minimap} />
        <span
          style={{
            position: "absolute",
            left: -25,
            top: cursor.directionVertical === "ascending" ? 0 : "100%",
          }}
        >
          0
        </span>
        <span style={{ position: "absolute", left: -25, top: 40 }}>
          {cursor.directionVertical === "ascending" ? "⬇️" : "⬆️"}
        </span>
      </div>
    </div>
  );
}

export default App;
