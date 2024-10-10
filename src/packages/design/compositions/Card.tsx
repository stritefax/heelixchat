import { FC, CSSProperties, PropsWithChildren, ReactNode } from "react";
import styled, { css } from "styled-components";
import { Title } from "@heelix-app/design";

type CardContainerProps = {
  $height?: CSSProperties["height"];
  $minHeight?: CSSProperties["minHeight"];
};
const CardContainer = styled.div<CardContainerProps>`
  width: 100%;
  ${({ $height }) =>
    $height &&
    css`
      height: ${$height};
    `};
  ${({ $minHeight }) =>
    $minHeight &&
    css`
      min-height: ${$minHeight};
    `};
  max-height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--default-border-color);
  border-radius: 8px;
  overflow: hidden;
`;

const MainContainer = styled.div`
  flex-direction: column;
  width: 100%;
`;

const HeaderWrapper = styled.div`
  display: grid;
  padding: 8px 0;
  width: 100%;
`;

const Content = styled.div`
  display: flex;
  flex: 1;
  background: var(--card-content-background);
`;

const ContentInner = styled.div<{ $padding: boolean }>`
  width: 100%;
  ${({ $padding }) =>
    $padding &&
    css`
      padding: var(--space-default) var(--space-l);
    `}
`;

type CardProps = {
  header: ReactNode;
  padding?: boolean;
  height?: CSSProperties["height"];
  minHeight?: CSSProperties["minHeight"];
} & PropsWithChildren;
export const Card: FC<CardProps> = ({
  height,
  padding,
  minHeight,
  header,
  children,
}) => {
  return (
    <MainContainer>
      <HeaderWrapper>
        {typeof header === "string" ? <Title type="s">{header}</Title> : header}
      </HeaderWrapper>
      <CardContainer $height={height} $minHeight={minHeight}>
        <Content>
          <ContentInner $padding={!!padding}>{children}</ContentInner>
        </Content>
      </CardContainer>
    </MainContainer>
  );
};
