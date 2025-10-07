import {FiAlertCircle, FiAlertTriangle, FiInfo, FiX} from "react-icons/fi";
import React from "react";

export const ConfirmationDialog = ({
                                       isOpen,
                                       onClose,
                                       onConfirm,
                                       title = 'تأكيد الإجراء',
                                       message = 'هل أنت متأكد من أنك تريد المتابعة؟',
                                       confirmText = 'تأكيد',
                                       cancelText = 'إلغاء',
                                       type = 'warning'
                                   }) => {
    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <div className="dialog-overlay" onClick={onClose}>
            <div className="dialog-container" onClick={e => e.stopPropagation()}>
                <div className="dialog-header">
                    <h2 className="dialog-title">{title}</h2>
                    <button className="dialog-close" onClick={onClose} aria-label="إغلاق">
                        <FiX />
                    </button>
                </div>

                <div className="dialog-body">
                    <div className={`dialog-icon dialog-icon-${type}`}>
                        {type === 'warning' && <FiAlertTriangle />}
                        {type === 'danger' && <FiAlertCircle />}
                        {type === 'info' && <FiInfo />}
                    </div>
                    <p className="dialog-message">{message}</p>
                </div>

                <div className="dialog-footer">
                    <button className="dialog-button dialog-button-cancel" onClick={onClose}>
                        {cancelText}
                    </button>
                    <button
                        className={`dialog-button dialog-button-confirm dialog-button-${type}`}
                        onClick={handleConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
