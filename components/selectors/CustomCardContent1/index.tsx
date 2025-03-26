import { useEditor, useNode } from "@craftjs/core";
import { useEffect } from "react";
import { styled } from "styled-components";

import { CustomCardContent1Settings } from "./CustomCardContent1Settings";

import { useCollectionsContext } from "../Collections/CollectionsContext";

// Styled components for the card
const Card = styled.div`
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  background: white;
  display: flex;
  flex-direction: column;
  padding-bottom: 10px;
`;

const CardImage = styled.div<{ $imageUrl: string }>`
  width: 100%;
  height: 180px;
  background-image: ${(props) => `url(${props.$imageUrl})`};
  background-size: cover;
  background-position: center;
`;

const CardContent = styled.div`
  padding: 10px 15px;
`;

const CardTitle = styled.h3`
  margin: 0 0 10px 0;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.4;
  color: #333;
`;

const VoucherInput = styled.div`
  display: flex;
  margin-bottom: 10px;
  align-items: center;
`;

const VoucherLabel = styled.div`
  background-color: #f23333;
  color: white;
  padding: 5px 10px;
  border-radius: 4px 0 0 4px;
  font-size: 14px;
  font-weight: 500;
`;

const VoucherCode = styled.div`
  padding: 5px 10px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 0 4px 4px 0;
  font-size: 14px;
  font-weight: 500;
  flex-grow: 1;
  text-align: center;
`;

const PriceContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Price = styled.div`
  display: flex;
  flex-direction: column;
`;

const OriginalPrice = styled.span`
  text-decoration: line-through;
  color: #999;
  font-size: 14px;
`;

const DiscountedPrice = styled.span`
  color: #f23333;
  font-size: 20px;
  font-weight: 600;
`;

// Formatting for price in Vietnamese đồng
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
};

// Define the props type
interface CustomCardContent1Props {
  imageUrl: string;
  title: string;
  voucherCode: string;
  originalPrice: number;
  discountedPrice: number;
  showVoucher: boolean;
  // Data binding props
  useDataBinding: boolean;
}

// Default props
const defaultProps: CustomCardContent1Props = {
  imageUrl: "https://via.placeholder.com/300x200",
  title: "Viên uống bổ sung canxi Nature Gift Green Living Canxi (60 Viên)",
  voucherCode: "TUOIMAT37",
  originalPrice: 365000,
  discountedPrice: 239000,
  showVoucher: true,
  // Default data binding props
  useDataBinding: false,
};

export const CustomCardContent1 = (props: Partial<CustomCardContent1Props>) => {
  const {
    connectors: { connect },
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  // Get collections context if available
  const collectionsContext = useCollectionsContext();
  const item = collectionsContext?.item;
  const isInsideCollections = item !== null;
  const { id } = useNode();
  const { actions } = useEditor();

  useEffect(() => {
    if (collectionsContext?.fields) {
      actions.setProp(
        id,
        (props) => (props.availableFields = collectionsContext.fields)
      );
    }
  }, [actions, collectionsContext?.fields, id]);

  // Merge default props with provided props
  const {
    imageUrl,
    title,
    voucherCode,
    originalPrice,
    discountedPrice,
    showVoucher,
    // Data binding props
    useDataBinding,
  } = { ...defaultProps, ...props };

  // Use data from collections context when useDataBinding is true and we're inside collections
  const resolvedImageUrl =
    useDataBinding && isInsideCollections && imageUrl && item[imageUrl]
      ? item[imageUrl]
      : imageUrl;

  const resolvedTitle =
    useDataBinding && isInsideCollections && title && item[title]
      ? item[title]
      : title;

  const resolvedOriginalPrice =
    useDataBinding &&
    isInsideCollections &&
    originalPrice &&
    item[originalPrice]
      ? Number(item[originalPrice])
      : originalPrice;

  const resolvedDiscountedPrice =
    useDataBinding &&
    isInsideCollections &&
    discountedPrice &&
    item[discountedPrice]
      ? Number(item[discountedPrice])
      : discountedPrice;

  const resolvedVoucherCode =
    useDataBinding && isInsideCollections && voucherCode && item[voucherCode]
      ? item[voucherCode]
      : voucherCode;

  return (
    <Card
      ref={(dom) => {
        connect(dom);
      }}
    >
      <CardImage $imageUrl={resolvedImageUrl} />
      <CardContent>
        <CardTitle>{resolvedTitle}</CardTitle>
        {showVoucher && (
          <VoucherInput>
            <VoucherLabel> Nhập </VoucherLabel>
            <VoucherCode>{resolvedVoucherCode}</VoucherCode>
          </VoucherInput>
        )}
        <PriceContainer>
          <Price>
            <OriginalPrice>{formatPrice(resolvedOriginalPrice)}</OriginalPrice>
            <DiscountedPrice>
              {formatPrice(resolvedDiscountedPrice)}
            </DiscountedPrice>
          </Price>
        </PriceContainer>
      </CardContent>
    </Card>
  );
};

// Add craft.js configuration
CustomCardContent1.craft = {
  displayName: "Product Card",
  props: defaultProps,
  rules: {
    canDrag: () => true,
    canMoveIn: () => false,
  },
  related: {
    toolbar: CustomCardContent1Settings,
  },
};
