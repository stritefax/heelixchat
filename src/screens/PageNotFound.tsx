import { FC } from "react";
import styled from "styled-components";
import { Title } from "@heelix-app/design";

const MainWrapper = styled.div`
  display: flex;
  flex: 1;
  height: 100%;
  justify-content: center;
  align-items: center;
`;

export const PageNotFound: FC = () => {
  return (
    <MainWrapper>
      <Title type="xl">Page not found</Title>
    </MainWrapper>
  );
};
