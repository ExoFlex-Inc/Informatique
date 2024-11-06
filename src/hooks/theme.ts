import { createContext, useState, useMemo } from "react";
import { createTheme } from "@mui/material/styles";

// color design tokens export
export const tokens = (mode) => ({
  ...(mode === "dark"
    ? {
        grey: {
          100: "#e0e0e0",
          200: "#c2c2c2",
          300: "#a3a3a3",
          400: "#858585",
          500: "#666666",
          600: "#525252",
          700: "#3d3d3d",
          800: "#292929",
          900: "#141414",
        },
        primary: {
          100: "#d0d1d5",
          200: "#a1a4ab",
          300: "#727681",
          400: "#1F2A40",
          500: "#141b2d",
          600: "#101624",
          700: "#0c101b",
          800: "#080b12",
          900: "#040509",
        },
        greenAccent: {
          100: "#d5f0e3",
          200: "#aae2c7",
          300: "#80d3ab",
          400: "#55c58f",
          500: "#2bb673",
          600: "#22925c",
          700: "#1a6d45",
          800: "#11492e",
          900: "#092417",
        },
        redAccent: {
          100: "#f8dcdb",
          200: "#f1b9b7",
          300: "#e99592",
          400: "#e2726e",
          500: "#db4f4a",
          600: "#af3f3b",
          700: "#832f2c",
          800: "#58201e",
          900: "#2c100f",
        },
        blueAccent: {
          100: "#cce5fb",
          200: "#99caf7",
          300: "#67b0f2",
          400: "#3495ee",
          500: "#017bea",
          600: "#0162bb",
          700: "#014a8c",
          800: "#00315e",
          900: "#00192f",
        },
      }
    : {
        grey: {
          100: "#141414",
          200: "#292929",
          300: "#3d3d3d",
          400: "#525252",
          500: "#666666",
          600: "#858585",
          700: "#a3a3a3",
          800: "#c2c2c2",
          900: "#e0e0e0",
        },
        primary: {
          100: "#040509",
          200: "#080b12",
          300: "#0c101b",
          400: "#f2f0f0",
          500: "#141b2d",
          600: "#1F2A40",
          700: "#727681",
          800: "#a1a4ab",
          900: "#d0d1d5",
        },
        greenAccent: {
          100: "#092417",
          200: "#11492e",
          300: "#1a6d45",
          400: "#22925c",
          500: "#2bb673",
          600: "#55c58f",
          700: "#80d3ab",
          800: "#aae2c7",
          900: "#d5f0e3",
        },
        redAccent: {
          100: "#2c100f",
          200: "#58201e",
          300: "#832f2c",
          400: "#af3f3b",
          500: "#db4f4a",
          600: "#e2726e",
          700: "#e99592",
          800: "#f1b9b7",
          900: "#f8dcdb",
        },
        blueAccent: {
          100: "#00192f",
          200: "#00315e",
          300: "#014a8c",
          400: "#0162bb",
          500: "#017bea",
          600: "#3495ee",
          700: "#67b0f2",
          800: "#99caf7",
          900: "#cce5fb",
        },
      }),
});

// mui theme settings
export const themeSettings = (mode) => {
  const colors = tokens(mode);
  return {
    palette: {
      mode: mode,
      ...(mode === "dark"
        ? {
            // palette values for dark mode
            primary: {
              main: colors.primary[500],
            },
            secondary: {
              main: colors.greenAccent[500],
            },
            blueAccent: {
              main: colors.blueAccent[500],
              contrastText: "#fff",
            },
            neutral: {
              dark: colors.grey[700],
              main: colors.grey[500],
              light: colors.grey[100],
            },
            background: {
              default: colors.primary[500],
            },
          }
        : {
            // palette values for light mode
            primary: {
              main: colors.primary[100],
            },
            secondary: {
              main: colors.greenAccent[500],
            },
            blueAccent: {
              main: colors.blueAccent[500],
              contrastText: "#fff",
            },
            neutral: {
              dark: colors.grey[700],
              main: colors.grey[500],
              light: colors.grey[100],
            },
            background: {
              default: "#fcfcfc",
            },
          }),
    },
    components: {
      MuiCheckbox: {
        styleOverrides: {
          root: {
            color: mode === "dark" ? "white" : "black",
            "&.Mui-checked": {
              color: mode === "dark" ? "white" : "black",
            },
            "& .MuiSvgIcon-root": {
              fontSize: 28,
            },
          }
        }
      }
    },
    typography: {
      fontFamily: ["Sofia Pro", "sans-serif"].join(","),
      fontSize: 16,

      h1: {
        fontFamily: ["Cubano", "sans-serif"].join(","),
        fontSize: 24,
        lineHeight: 1.3333,
        fontWeight: 400,
      },
      h2: {
        fontFamily: ["Cubano", "sans-serif"].join(","),
        fontSize: 24,
        lineHeight: 1.3333,
        fontWeight: 400,
      },
      h3: {
        fontFamily: ["Cubano", "sans-serif"].join(","),
        fontSize: 24,
        lineHeight: 1.3333,
        fontWeight: 400,
      },
      h4: {
        fontFamily: ["Cubano", "sans-serif"].join(","),
        fontSize: 24,
        lineHeight: 1.3333,
        fontWeight: 400,
      },
      h5: {
        fontFamily: ["Cubano", "sans-serif"].join(","),
        fontSize: 24,
        lineHeight: 1.3333,
        fontWeight: 400,
      },
      h6: {
        fontFamily: ["Cubano", "sans-serif"].join(","),
        fontSize: 24,
        lineHeight: 1.3333,
        fontWeight: 400,
      },

      // Body text styled with Sofia Pro font
      body1: {
        fontFamily: ["Sofia Pro", "sans-serif"].join(","),
        fontSize: 16,
        lineHeight: 1.5,
        fontWeight: 400,
      },
      body2: {
        fontFamily: ["Sofia Pro", "sans-serif"].join(","),
        fontSize: 14,
        lineHeight: 1.4286,
        fontWeight: 400,
      },

      // Button text styled with Cubano font
      button: {
        fontFamily: ["Cubano", "sans-serif"].join(","),
        fontSize: 20,
        lineHeight: 1.4,
        fontWeight: 700,
        textTransform: "none",
      },
    },
  };
};

export const ColorModeContext = createContext({
  toggleColorMode: () => {},
});

export const useMode = () => {
  const [mode, setMode] = useState("dark");

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () =>
        setMode((prev) => (prev === "light" ? "dark" : "light")),
    }),
    [],
  );

  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);
  return [theme, colorMode];
};
