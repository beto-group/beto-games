export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <style>{`
        /* Reset global styles that might interfere with Keystatic */
        body { 
          background: transparent !important; /* Let Keystatic handle background */
          margin: 0;
          padding: 0;
        }
      `}</style>
            {children}
        </>
    );
}
