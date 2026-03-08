// src/context/DemoContext.jsx
import { createContext, useContext, useState } from 'react';
import { DEMO_WALLET } from '../data/demoData';

const DemoContext = createContext();

export function DemoProvider({ children }) {
    const [isDemoMode, setIsDemoMode] = useState(false);

    function enterDemo() { setIsDemoMode(true); }
    function exitDemo() { setIsDemoMode(false); }

    const demoAddress = isDemoMode ? DEMO_WALLET.address : null;

    return (
        <DemoContext.Provider value={{ isDemoMode, enterDemo, exitDemo, demoAddress }}>
            {children}
        </DemoContext.Provider>
    );
}

export const useDemo = () => useContext(DemoContext);
