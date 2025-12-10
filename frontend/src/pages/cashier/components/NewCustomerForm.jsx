import React from 'react';
import { FiUser, FiPhone, FiMapPin, FiSave } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const NewCustomerForm = ({
    newCustomer,
    isAddingCustomer,
    onCustomerChange,
    onSave,
    onCancel
}) => {
    return (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
                <FiUser className="text-blue-600 dark:text-blue-400" size={20} />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">إضافة عميل جديد</h2>
                {newCustomer.customerType && (
                    <Badge
                        variant={
                            newCustomer.customerType === 'CASH' ? 'success' :
                                newCustomer.customerType === 'COMPANY' ? 'info' : 'default'
                        }
                        className="text-xs"
                    >
                        {newCustomer.customerType === 'CASH' ? 'نقدي' :
                            newCustomer.customerType === 'COMPANY' ? 'شركة' : 'عميل'}
                    </Badge>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <Input
                    placeholder="اسم العميل *"
                    value={newCustomer.name}
                    onChange={(e) => onCustomerChange({
                        ...newCustomer,
                        name: e.target.value
                    })}
                    icon={<FiUser />}
                    required
                />
                <Input
                    placeholder="رقم الهاتف"
                    value={newCustomer.phone}
                    onChange={(e) => onCustomerChange({
                        ...newCustomer,
                        phone: e.target.value
                    })}
                    icon={<FiPhone />}
                />
                <Input
                    placeholder="العنوان"
                    value={newCustomer.address}
                    onChange={(e) => onCustomerChange({
                        ...newCustomer,
                        address: e.target.value
                    })}
                    icon={<FiMapPin />}
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
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        نوع العميل *
                    </label>
                    <select
                        name="customerType"
                        value={newCustomer.customerType || 'REGULAR'}
                        onChange={(e) => onCustomerChange({
                            ...newCustomer,
                            customerType: e.target.value
                        })}
                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    >
                        <option value="REGULAR">عميل</option>
                        <option value="CASH">عميل نقدي</option>
                        <option value="COMPANY">شركة</option>
                    </select>
                </div>
            </div>

            <div className="flex gap-3">
                <Button
                    onClick={onSave}
                    disabled={isAddingCustomer || !newCustomer.name.trim()}
                    className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white"
                >
                    {isAddingCustomer ? <LoadingSpinner size="sm" className="ml-2" /> :
                        <FiSave className="ml-2" />}
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