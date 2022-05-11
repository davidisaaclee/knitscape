import { useAtom } from "jotai";
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
          style={{ display: "flex", width: "10%", touchAction: "manipulation" }}
          onClick={() => {
            setCursor((prev) => {
              if (prev.column === 0) {
                const prevRowIndex = Math.max(0, prev.row - 1);
                if (prevRowIndex < 0) {
                  return prev;
                }
                return {
                  ...prev,
                  row: prevRowIndex,
                  column: pattern.rows[prevRowIndex].length - 1,
                };
              } else {
                return {
                  ...prev,
                  column: Math.max(0, prev.column - 1),
                };
              }
            });
          }}
        >
          Back
        </button>
        <button
          style={{ display: "flex", flex: 1, touchAction: "manipulation" }}
          onClick={() => {
            setCursor((prev) => {
              const rowLength = pattern.rows[cursor.row].length;
              if (prev.column + 1 >= rowLength) {
                return {
                  ...prev,
                  row: Math.min(pattern.rows.length - 1, prev.row + 1),
                  column: 0,
                };
              } else {
                return {
                  ...prev,
                  column: prev.column + 1,
                };
              }
            });
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
