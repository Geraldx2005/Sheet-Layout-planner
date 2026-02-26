// components/TokenTemplate.jsx
import { View, Text } from "@react-pdf/renderer";

const TokenTemplate = ({
  labelNumber,
  couponWidthPt,
  couponHeightPt,
}) => {
  const base = Math.min(couponWidthPt, couponHeightPt);
  const fontSize = Math.max(10, Math.round(base * 0.22));

  return (
    <View
      wrap={false}
      style={{
        width: couponWidthPt,
        height: couponHeightPt,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#000",
        display: "flex",
      }}
    >
      <Text
        style={{
          fontSize,
          fontWeight: 700,
          color: "#000",
        }}
      >
        {labelNumber}
      </Text>
    </View>
  );
};

export default TokenTemplate;
