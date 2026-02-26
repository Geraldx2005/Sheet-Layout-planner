import { useEffect, useMemo, useState } from "react";
import { Document, Page, View, pdf } from "@react-pdf/renderer";
import { useLayout } from "../context/LayoutProvider";
import { computeAutoMargins } from "../utils/computeAutoMargins";
import TokenTemplate from "../utils/TokenTemplate";
import { addTrimMarksToPDF } from "../utils/TrimMarksPDFLib";

const buildGrid = (values) => {
  const {
    paperWidthPt,
    paperHeightPt,
    couponWidthPt,
    couponHeightPt,
    leftMargin,
    rightMargin,
    topMargin,
    bottomMargin,
    gapXPt,
    gapYPt,
  } = values;

  const hasSizes =
    paperWidthPt > 0 &&
    paperHeightPt > 0 &&
    couponWidthPt > 0 &&
    couponHeightPt > 0;

  if (!hasSizes) {
    return {
      ready: false,
      message: "Set both page and label sizes to continue.",
      columns: 0,
      rows: 0,
      count: 0,
      gapX: 0,
      gapY: 0,
    };
  }

  const gapX = gapXPt || 0;
  const gapY = gapYPt || 0;

  const usableW = paperWidthPt - leftMargin - rightMargin;
  const usableH = paperHeightPt - topMargin - bottomMargin;

  if (usableW <= 0 || usableH <= 0) {
    return {
      ready: false,
      message: "Margins are larger than the page area.",
      columns: 0,
      rows: 0,
      count: 0,
      gapX,
      gapY,
    };
  }

  const columns = Math.max(
    0,
    Math.floor((usableW + gapX) / (couponWidthPt + gapX))
  );
  const rows = Math.max(
    0,
    Math.floor((usableH + gapY) / (couponHeightPt + gapY))
  );

  const count = columns * rows;

  if (!columns || !rows) {
    return {
      ready: false,
      message: "Label size is too large to fit on the page.",
      columns,
      rows,
      count,
      gapX,
      gapY,
    };
  }

  return {
    ready: true,
    message: "",
    columns,
    rows,
    count,
    gapX,
    gapY,
  };
};

export default function GeneratePDF({ resetSignal }) {
  const layout = useLayout();
  const { values } = layout;

  const [pdfBlob, setPdfBlob] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState("");

  const grid = useMemo(() => buildGrid(values), [values]);

  useEffect(() => {
    if (!values.userMarginOverride) {
      computeAutoMargins(layout);
    }
  }, [
    layout,
    values.userMarginOverride,
    values.paperWidthPt,
    values.paperHeightPt,
    values.couponWidthPt,
    values.couponHeightPt,
    values.gapXPt,
    values.gapYPt,
  ]);

  useEffect(() => {
    setPdfBlob(null);
    setStatusMsg("");
    setError("");
  }, [
    resetSignal,
    values.paperWidthPt,
    values.paperHeightPt,
    values.couponWidthPt,
    values.couponHeightPt,
    values.gapXPt,
    values.gapYPt,
    values.leftMargin,
    values.rightMargin,
    values.topMargin,
    values.bottomMargin,
  ]);

  const labelNumbers = useMemo(
    () => Array.from({ length: grid.count }, (_, idx) => idx + 1),
    [grid.count]
  );

  const handleDownload = () => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `layout-${grid.count}-labels.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerate = async () => {
    if (!grid.ready) {
      setError(grid.message || "Please set sizes before generating.");
      return;
    }

    setIsGenerating(true);
    setError("");
    setStatusMsg("");

    try {
      const doc = (
        <Document>
          <Page
            size={{ width: values.paperWidthPt, height: values.paperHeightPt }}
            style={{ position: "relative" }}
          >
            {labelNumbers.map((num, idx) => {
              const row = Math.floor(idx / grid.columns);
              const col = idx % grid.columns;

              const x = values.leftMargin + col * (values.couponWidthPt + grid.gapX);
              const y = values.topMargin + row * (values.couponHeightPt + grid.gapY);

              return (
                <View
                  key={num}
                  style={{
                    position: "absolute",
                    left: x,
                    top: y,
                    width: values.couponWidthPt,
                    height: values.couponHeightPt,
                  }}
                >
                  <TokenTemplate
                    labelNumber={num}
                    couponWidthPt={values.couponWidthPt}
                    couponHeightPt={values.couponHeightPt}
                  />
                </View>
              );
            })}
          </Page>
        </Document>
      );

      const blob = await pdf(doc).toBlob();
      const rawBytes = await blob.arrayBuffer();

      const trimmed = await addTrimMarksToPDF(rawBytes, {
        ...values,
        gapXPt: values.gapXPt || 0,
        gapYPt: values.gapYPt || 0,
      });

      setPdfBlob(new Blob([trimmed], { type: "application/pdf" }));
      setStatusMsg(`Generated ${grid.count} labels on a single page.`);
    } catch (err) {
      console.error(err);
      setError("Failed to generate the PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const detailLine = grid.ready
    ? `${grid.columns} columns x ${grid.rows} rows (${grid.count} labels)`
    : grid.message;

  return (
    <div className="w-full flex flex-col items-center bg-nero-800 p-2.5 gap-3">
      <div className="w-full flex flex-col gap-1">
        <div className="flex items-center justify-between text-sm text-nero-300">
          <span>Labels per page</span>
          <span className="font-semibold">{grid.count || "-"}</span>
        </div>
        <div className="text-xs text-nero-400">{detailLine}</div>
      </div>

      <div className="w-full flex gap-2">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !grid.ready}
          className={`flex-1 h-10 px-3 rounded-md text-sm font-medium transition-all ${isGenerating || !grid.ready
            ? "bg-nero-700 text-nero-500 cursor-not-allowed"
            : "bg-denim-600 text-white hover:bg-denim-700 active:scale-95"
            }`}
        >
          {isGenerating ? "Generating..." : "Generate PDF"}
        </button>

        <button
          onClick={handleDownload}
          disabled={!pdfBlob}
          className={`w-32 h-10 px-3 rounded-md text-sm font-medium transition-all ${pdfBlob
            ? "bg-nero-700 text-white hover:bg-nero-600 active:scale-95"
            : "bg-nero-700 text-nero-500 cursor-not-allowed"
            }`}
        >
          Download
        </button>
      </div>

      {statusMsg && (
        <div className="w-full text-xs text-green-200 bg-nero-750 border border-nero-600 rounded-md px-3 py-2">
          {statusMsg}
        </div>
      )}

      {error && (
        <div className="w-full text-xs text-red-200 bg-nero-750 border border-red-300 rounded-md px-3 py-2">
          {error}
        </div>
      )}
    </div>
  );
}
