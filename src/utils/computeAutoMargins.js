// /src/utils/computeAutoMargins.js

export function computeAutoMargins(layout) {
  const {
    paperWidthPt,
    paperHeightPt,
    couponWidthPt,
    couponHeightPt,
    gapXPt,
    gapYPt,
  } = layout.values;

  if (!paperWidthPt || !paperHeightPt || !couponWidthPt || !couponHeightPt) return;

  const gapX = gapXPt || 0;
  const gapY = gapYPt || 0;

  const cols = Math.floor(
    (paperWidthPt + gapX) / (couponWidthPt + gapX)
  );
  const rows = Math.floor(
    (paperHeightPt + gapY) / (couponHeightPt + gapY)
  );

  const usedW =
    cols * couponWidthPt + Math.max(0, cols - 1) * gapX;
  const usedH =
    rows * couponHeightPt + Math.max(0, rows - 1) * gapY;

  let marginX = Math.max(0, (paperWidthPt - usedW) / 2);
  let marginY = Math.max(0, (paperHeightPt - usedH) / 2);

  // Soft reduction
  const reduceX = paperWidthPt * 0.00008;
  const reduceY = paperHeightPt * 0.00008;

  marginX -= reduceX;
  marginY -= reduceY;

  // APPLY the recalculated margins
  layout.set.setLeftMargin(marginX);
  layout.set.setRightMargin(marginX);
  layout.set.setTopMargin(marginY);
  layout.set.setBottomMargin(marginY);
}
