import React from 'react';
import { FiUser, FiBriefcase, FiPrinter, FiX } from 'react-icons/fi';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

const PrintOptionsModal = ({ isOpen, onClose, onPrint }) => {
    if (!isOpen) return null;

    const handlePrint = (type) => {
        onPrint(type);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="اختر نوع الطباعة"
            size="md"
        >
            <div className="grid grid-cols-1 gap-4 p-4" dir="rtl">
                {/* Customer Invoice */}
                <button
                    onClick={() => handlePrint('CLIENT')}
                    className="flex items-center gap-4 p-4 rounded-xl border-2 border-transparent bg-blue-50 dark:bg-blue-900/20 hover:border-blue-500 dark:hover:border-blue-400 transition-all group text-right"
                >
                    <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 group-hover:scale-110 transition-transform">
                        <FiUser size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">فاتورة العميل</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">نسخة مفصلة للعميل</p>
                    </div>
                </button>

                {/* Company Invoice */}
                <button
                    onClick={() => handlePrint('OWNER')}
                    className="flex items-center gap-4 p-4 rounded-xl border-2 border-transparent bg-purple-50 dark:bg-purple-900/20 hover:border-purple-500 dark:hover:border-purple-400 transition-all group text-right"
                >
                    <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-300 group-hover:scale-110 transition-transform">
                        <FiBriefcase size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">فاتورة الشركة</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">نسخة داخلية (مع الملاحظات)</p>
                    </div>
                </button>

                {/* Factory Sticker */}
                <button
                    onClick={() => handlePrint('STICKER')}
                    className="flex items-center gap-4 p-4 rounded-xl border-2 border-transparent bg-orange-50 dark:bg-orange-900/20 hover:border-orange-500 dark:hover:border-orange-400 transition-all group text-right"
                >
                    <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-800 text-orange-600 dark:text-orange-300 group-hover:scale-110 transition-transform">
                        <FiPrinter size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">ملصق المصنع</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">للتصنيع والإنتاج</p>
                    </div>
                </button>

                <div className="mt-4 flex justify-end">
                    <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                        إلغاء
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default PrintOptionsModal;
