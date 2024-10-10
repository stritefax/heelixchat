export const theme = {
  fonts: {
    heading: `"Montserrat", sans-serif`,
    body: `"Montserrat", sans-serif`,
  },
  colors: {
    brand: {
      main: "#3363AD",
      100: "#3363AD1F",
      300: "#4070b8",
      400: "#3363AD",
      600: "#2a5489",
    },
  },
  components: {
    Button: {
      variants: {
        primary: {
          bg: "brand.400",
          color: "white", // Text color
          _hover: {
            bg: "brand.600", // Color on hover
          },
        },
      },
    },
  },
};
