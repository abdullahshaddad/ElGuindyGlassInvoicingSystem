import React, { createContext, useContext, useState, useCallback } from 'react';
import Snackbar from "@components/ui/Snackbar.jsx";

// ============================================
// SNACKBAR CONTEXT
// ============================================

const SnackbarContext = createContext(null);

export const useSnackbar = () => {
    const context = useContext(SnackbarContext);
    if (!context) {
        throw new Error('useSnackbar must be used within SnackbarProvider');
    }
    return context;
};

export const SnackbarProvider = ({ children }) => {
    const [snackbars, setSnackbars] = useState([]);

    const addSnackbar = useCallback((message, type = 'info', duration = 5000) => {
        const id = Date.now() + Math.random();
        setSnackbars(prev => [...prev, { id, message, type, duration }]);

        if (duration > 0) {
            setTimeout(() => {
                setSnackbars(prev => prev.filter(snack => snack.id !== id));
            }, duration);
        }
    }, []);

    const removeSnackbar = useCallback((id) => {
        setSnackbars(prev => prev.filter(snack => snack.id !== id));
    }, []);

    const showSuccess = useCallback((message, duration) => {
        addSnackbar(message, 'success', duration);
    }, [addSnackbar]);

    const showError = useCallback((message, duration) => {
        addSnackbar(message, 'error', duration);
    }, [addSnackbar]);

    const showInfo = useCallback((message, duration) => {
        addSnackbar(message, 'info', duration);
    }, [addSnackbar]);

    const showWarning = useCallback((message, duration) => {
        addSnackbar(message, 'warning', duration);
    }, [addSnackbar]);

    return (
        <SnackbarContext.Provider value={{ showSuccess, showError, showInfo, showWarning }}>
            {children}
            <SnackbarContainer snackbars={snackbars} removeSnackbar={removeSnackbar} />
        </SnackbarContext.Provider>
    );
};

// ============================================
// SNACKBAR CONTAINER
// ============================================

const SnackbarContainer = ({ snackbars, removeSnackbar }) => {
    return (
        <div
            className="
                fixed bottom-6 left-6
                z-[9999]
                flex flex-col gap-2
                max-w-md
            "
        >
            {snackbars.map(snackbar => (
                <Snackbar
                    key={snackbar.id}
                    message={snackbar.message}
                    type={snackbar.type}
                    onClose={() => removeSnackbar(snackbar.id)}
                />
            ))}
        </div>
    );
};




