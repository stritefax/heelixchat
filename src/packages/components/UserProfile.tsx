import { FC } from "react";
import styled, { css } from "styled-components";
import { Image } from "@chakra-ui/react";

type WrapperProps = {
  $reverse: boolean;
};
const Wrapper = styled.div<WrapperProps>`
  display: flex;
  ${({ $reverse }) =>
    $reverse
      ? css`
          flex-direction: row-reverse;
        `
      : css`
          flex-direction: row;
        `};
  gap: 10px;
`;

const ImageWrapper = styled.div`
  padding: 3px;
  border: 1px solid var(--default-border-color);
  border-radius: 8px;
`;

type InfoWrapperProps = {
  $reverse: boolean;
};
const InfoWrapper = styled.div<InfoWrapperProps>`
  display: flex;
  flex-direction: column;
  justify-content: center;
  ${({ $reverse }) =>
    $reverse
      ? css`
          align-items: flex-end;
        `
      : css`
          align-items: flex-start;
        `}
`;

const NameText = styled.p`
  font-size: 15px;
  font-weight: 600;
  line-height: 18px;
  letter-spacing: 0em;
`;
const CompanyNameText = styled.p`
  font-size: 14px;
  font-weight: 500;
  line-height: 17px;
  letter-spacing: 0em;
  text-transform: capitalize;
`;
type UserProfileProps = {
  user: {
    name: string;
    imageUrl: string;
    company: string;
  };
  reverse?: boolean;
};
export const UserProfile: FC<UserProfileProps> = ({
  user,
  reverse = false,
}) => {
  const getShortSurname = () => {
    const nameSplit = user.name.split(" ");
    return `${nameSplit?.[0] || ""} ${nameSplit?.[1]?.[0] || ""}.`;
  };
  return (
    <Wrapper $reverse={reverse}>
      <ImageWrapper>
        <Image
          borderRadius="var(--icon-radius)"
          boxSize="38px"
          src={user.imageUrl || ""}
          alt={user.name}
        />
      </ImageWrapper>
      <InfoWrapper $reverse={reverse}>
        <NameText>{getShortSurname()}</NameText>
        <CompanyNameText>{user.company}</CompanyNameText>
      </InfoWrapper>
    </Wrapper>
  );
};
