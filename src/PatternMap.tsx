import { mapValues } from "lodash";
import * as React from "react";
import { useAtom } from "jotai";
import convertColor from "color-convert";
import * as A from "./atoms";
import * as M from "./model";
import { CSSForwardingProps } from "./utils";

function imageDataFrom(pattern: M.Pattern, palette: M.Palette) {
  const parsedPalette = mapValues(palette, (c) => {
    const rgb = convertColor.hex.rgb(c);
    // add alpha
    rgb.push(255);
    return rgb;
  });

  const extents = M.Pattern.extents(pattern);
  const pixelCount = extents.width * extents.height;
  if (pixelCount === 0) {
    return null;
  }
  const pixelWidth = 4;
  const data = new Uint8ClampedArray(pixelCount * pixelWidth);

  let pixelIndex = 0;
  for (const row of pattern.rows) {
    for (const stitch of row) {
      data.set(parsedPalette[stitch], pixelIndex * pixelWidth);
      pixelIndex++;
    }
  }
  return new ImageData(data, extents.width);
}

export function PatternMap({ ...forwardedProps }: CSSForwardingProps) {
  const [palette] = useAtom(A.palette);
  const [pattern] = useAtom(A.pattern);
  const [cursor, setCursor] = useAtom(A.cursor);
  const [bookmark] = useAtom(A.bookmark);

  const backgroundCanvasRef = React.useRef<React.ElementRef<"canvas">>(null);
  const overlayCanvasRef = React.useRef<React.ElementRef<"canvas">>(null);

  React.useLayoutEffect(() => {
    const canvas = backgroundCanvasRef.current;
    if (canvas == null) {
      return;
    }

    const patternExtents = M.Pattern.extents(pattern);
    canvas.width = patternExtents.width;
    canvas.height = patternExtents.height;

    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, patternExtents.width, patternExtents.height);
    const imageData = imageDataFrom(pattern, palette);
    if (imageData == null) {
      return;
    }
    ctx.putImageData(imageData, 0, 0);
  }, [pattern, palette]);

  React.useLayoutEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (canvas == null) {
      return;
    }

    const patternExtents = M.Pattern.extents(pattern);
    canvas.width = patternExtents.width;
    canvas.height = patternExtents.height;

    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, patternExtents.width, patternExtents.height);

    ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
    ctx.fillRect(0, cursor.row, patternExtents.width, 1);
    ctx.fillRect(cursor.column, 0, 1, patternExtents.height);

    if (bookmark != null) {
      ctx.fillStyle = "orange";
      const crosshairSize = 1;
      ctx.fillRect(
        bookmark.column,
        bookmark.row - crosshairSize,
        1,
        crosshairSize * 2 + 1
      );
      ctx.fillRect(
        bookmark.column - crosshairSize,
        bookmark.row,
        crosshairSize * 2 + 1,
        1
      );
    }
  }, [pattern, cursor, bookmark]);

  return (
    <div {...forwardedProps}>
      <div
        style={{ width: "100%", height: "100%", position: "relative" }}
        onClick={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          const patternExtents = M.Pattern.extents(pattern);
          const position: [number, number] = [
            Math.floor(
              (patternExtents.width * (event.clientX - bounds.left)) /
                bounds.width
            ),
            Math.floor(
              (patternExtents.height * (event.clientY - bounds.top)) /
                bounds.height
            ),
          ];
          if (cursor.directionVertical === "descending") {
            position[1] = patternExtents.height - position[1];
          }
          if (cursor.directionHorizontal === "ltr") {
            position[0] = patternExtents.width - position[0];
          }
          setCursor((prev) =>
            M.Cursor.offsetBy(
              prev,
              M.Cursor.stitchCountToPosition(prev, position, patternExtents),
              patternExtents
            )
          );
        }}
      >
        <canvas
          ref={backgroundCanvasRef}
          style={{
            imageRendering: "crisp-edges",
            position: "absolute",
            width: "100%",
            height: "100%",
            transform: [
              cursor.directionVertical === "ascending"
                ? "scaleY(1)"
                : "scaleY(-1)",
              cursor.directionHorizontal === "ltr" ? "scaleX(-1)" : "scaleX(1)",
            ].join(" "),
          }}
        />
        <canvas
          ref={overlayCanvasRef}
          style={{
            imageRendering: "crisp-edges",
            position: "absolute",
            width: "100%",
            height: "100%",
            transform: [
              cursor.directionVertical === "ascending"
                ? "scaleY(1)"
                : "scaleY(-1)",
              cursor.directionHorizontal === "ltr" ? "scaleX(-1)" : "scaleX(1)",
            ].join(" "),
          }}
        />
      </div>
    </div>
  );
}

export default PatternMap;
