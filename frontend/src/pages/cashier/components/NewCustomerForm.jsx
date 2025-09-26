import React from 'react';
import { FiUser, FiPhone, FiMapPin, FiSave } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const NewCustomerForm = ({
                             newCustomer,
                             isAddingCustomer,
                             onCustomerChange,
                             onSave,
                             onCancel
                         }) => {
    return (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
                <FiUser className="text-blue-600" size={20}/>
                <h2 className="text-lg font-semibold text-gray-900">إضافة عميل جديد</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <Input
                    placeholder="اسم العميل *"
                    value={newCustomer.name}
                    onChange={(e) => onCustomerChange({
                        ...newCustomer,
                        name: e.target.value
                    })}
                    icon={<FiUser/>}
                    required
                />
                <Input
                    placeholder="رقم الهاتف"
                    value={newCustomer.phone}
                    onChange={(e) => onCustomerChange({
                        ...newCustomer,
                        phone: e.target.value
                    })}
                    icon={<FiPhone/>}
                />
                <Input
                    placeholder="العنوان"
                    value={newCustomer.address}
                    onChange={(e) => onCustomerChange({
                        ...newCustomer,
                        address: e.target.value
                    })}
                    icon={<FiMapPin/>}
                />
                <Input
                    placeholder="البريد الإلكتروني"
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => onCustomerChange({
                        ...newCustomer,
                        email: e.target.value
                    })}
                />
            </div>

            <div className="flex gap-3">
                <Button
                    onClick={onSave}
                    disabled={isAddingCustomer || !newCustomer.name.trim()}
                    className="bg-green-600 hover:bg-green-700 text-white"
                >
                    {isAddingCustomer ? <LoadingSpinner size="sm" className="ml-2"/> :
                        <FiSave className="ml-2"/>}
                    {isAddingCustomer ? 'جارٍ الحفظ...' : 'حفظ العميل'}
                </Button>
                <Button
                    variant="outline"
                    onClick={onCancel}
                    disabled={isAddingCustomer}
                >
                    إلغاء
                </Button>
            </div>
        </div>
    );
};

export default NewCustomerForm;