import { extendTheme } from '@chakra-ui/react';

const config = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  colors: {
    primary: {
      50: '#e0f7fa',
      100: '#b2ebf2',
      200: '#80deea',
      300: '#4dd0e1',
      400: '#26c6da',
      500: '#00bcd4',
      600: '#00acc1',
      700: '#0097a7',
      800: '#00838f',
      900: '#006064',
    },
    accent: {
      50: '#fce4ec',
      100: '#f8bbd0',
      200: '#f48fb1',
      300: '#f06292',
      400: '#ec407a',
      500: '#e91e63',
      600: '#d81b60',
      700: '#c2185b',
      800: '#ad1457',
      900: '#880e4f',
    },
  },
  styles: {
    global: {
      body: {
        bg: 'primary.50',
        color: 'gray.800',
        fontFamily: 'Inter, system-ui, sans-serif',
      },
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'primary',
        size: 'lg',
        borderRadius: 'xl',
      },
    },
    Slider: {
      defaultProps: {
        colorScheme: 'accent',
      },
    },
    Progress: {
      defaultProps: {
        colorScheme: 'primary',
      },
    },
    Box: {
      baseStyle: {
        borderRadius: 'xl',
      },
    },
  },
});

export default theme; 