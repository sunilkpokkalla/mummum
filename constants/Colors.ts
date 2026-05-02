const primary = '#4a6549';
const secondary = '#446277';
const tertiary = '#7e553d';

export interface ThemeColors {
  text: string;
  background: string;
  tint: string;
  icon: string;
  tabIconDefault: string;
  tabIconSelected: string;
  primary: string;
  secondary: string;
  tertiary: string;
  surface: string;
  surfaceVariant: string;
  outline: string;
  error: string;
}

export const Colors: { [key: string]: ThemeColors } = {
  light: {
    text: '#181c1e',
    background: '#ffffff',
    tint: primary,
    icon: '#434841',
    tabIconDefault: '#737970',
    tabIconSelected: primary,
    primary: primary,
    secondary: secondary,
    tertiary: tertiary,
    surface: '#ffffff',
    surfaceVariant: '#e0e3e5',
    outline: '#737970',
    error: '#ba1a1a',
  },
  dark: {
    text: '#eef1f3',
    background: '#1A1C1E',
    tint: '#b0cfad',
    icon: '#c3c8bf',
    tabIconDefault: '#737970',
    tabIconSelected: '#b0cfad',
    primary: '#b0cfad',
    secondary: '#abcae3',
    tertiary: '#f2bb9d',
    surface: '#2d3133',
    surfaceVariant: '#434841',
    outline: '#8d9289',
    error: '#ffb4ab',
  },
};
