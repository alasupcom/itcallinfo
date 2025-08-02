declare namespace JSX {
    interface IntrinsicElements {
      'browser-phone': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        server?: string;
        username?: string;
        password?: string;
      };
    }
  }

  // Define types for window extensions
  // declare global {
  //   interface Window {
  //     RefreshRegister?: () => void;
  //   }
  // }
  