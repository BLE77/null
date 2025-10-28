import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { config } from '@/lib/wagmi-config';

// Initialize Web3Modal ONCE at startup before app renders
const projectId = 'c4c89e8e16e7ac96efcf97932c8b0070';

createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: false,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#00FF41',
    '--w3m-border-radius-master': '4px',
  },
});

createRoot(document.getElementById("root")!).render(<App />);
