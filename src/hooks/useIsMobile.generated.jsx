"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';


function useIsMobile() {
    // Hooks provided by React import
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        // Initial check
        checkMobile();

        // Listener
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return isMobile;
}

export {  useIsMobile  };