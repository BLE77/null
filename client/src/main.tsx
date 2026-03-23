import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { config, projectId } from '@/lib/wagmi-config';

// Initialize Web3Modal ONCE at startup before app renders
// wagmi v2 exposes chains correctly on config object
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: false,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#00FF41',
    '--w3m-border-radius-master': '4px',
  },
  enableOnramp: false,
  // DON'T set defaultChain - let user choose their network
});

createRoot(document.getElementById("root")!).render(<App />);
