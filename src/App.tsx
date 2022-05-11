import * as React from "react";
import { useAtom } from "jotai";
// import Row from "./Row";
import Workspace from "./Workspace";
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
  const [_palette, setPalette] = useAtom(A.palette);
  const [cursor, setCursor] = useAtom(A.cursor);

  React.useEffect(() => {
    setPalette(M.example.paletteSweater);
    setPattern(M.example.patternSweater);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.navbar}>
        <div className={styles.rowIndexDisplay}>
          <button
            onClick={() => {
              setCursor((prev) => ({
                ...prev,
                row: Math.max(0, prev.row - 1),
              }));
            }}
          >
            row-
          </button>
          <h1>row {cursor.row}</h1>
          <button
            onClick={() => {
              setCursor((prev) => ({
                ...prev,
                row: Math.min(pattern.length - 1, prev.row + 1),
              }));
            }}
          >
            row+
          </button>
        </div>
        <button>zoom out</button>
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
            console.log(pattern);
            console.log(palette);
          }}
        />
      </div>
      <Workspace className={styles.workspace} />
      {/*
      <div className={styles.workspace}>
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
        */}
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
                pattern[cursor.column].length - 1,
                prev.column + 1
              ),
            }));
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default App;
