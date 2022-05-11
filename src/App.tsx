import * as React from "react";
import { useAtom } from "jotai";
// import Row from "./Row";
import Workspace from "./Workspace";
import PatternMap from "./PatternMap";
import * as A from "./atoms";
import * as M from "./model";
import styles from "./App.module.scss";

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

  React.useEffect(() => {
    setPalette(M.example.paletteSweater);
    setPattern(M.example.patternSweater);
  }, [setPattern, setPalette]);

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
        <input
          type="file"
          style={{ display: "none" }}
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
          }}
        />
      </div>
      <Workspace className={styles.workspace} />
      <div className={styles.toolbar}>
        <button
          style={{ display: "flex", width: "10%" }}
          onClick={() => {
            setCursor((prev) => ({
              ...prev,
              column: Math.max(0, prev.column - 1),
            }));
          }}
        >
          Back
        </button>
        <button
          style={{ display: "flex", flex: 1 }}
          onClick={() => {
            setCursor((prev) => ({
              ...prev,
              column: Math.min(
                pattern.rows[cursor.column].length - 1,
                prev.column + 1
              ),
            }));
          }}
        >
          Next
        </button>
      </div>
      <PatternMap className={styles.minimap} />
    </div>
  );
}

export default App;
