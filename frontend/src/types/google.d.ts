interface GoogleAccountsId {
  initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
  renderButton: (
    element: HTMLElement,
    options: {
      type?: string;
      theme?: string;
      size?: string;
      width?: number;
      text?: string;
      logo_alignment?: string;
    },
  ) => void;
  prompt: (callback?: (notification: any) => void) => void;
}

interface Window {
  google?: {
    accounts: {
      id: GoogleAccountsId;
    };
  };
}
