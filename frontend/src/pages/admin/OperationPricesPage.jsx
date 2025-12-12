import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { operationPriceService } from '@services/operationPriceService.js';
import {
    Button,
    Input,
    Modal,
    DataTable,
    PageHeader,
    Badge,
    Icon,
    Select
} from '@components';
import { useAuth } from '@contexts/AuthContext.jsx';

const OperationPricesPage = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [operationPrices, setOperationPrices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Form data matching backend OperationPrice model
    const [formData, setFormData] = useState({
        operationType: 'LASER',
        subtype: '',
        arabicName: '',
        englishName: '',
        basePrice: '',
        unit: 'per piece',
        description: '',
        active: true
    });

    const [errors, setErrors] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('');

    // Operation type options
    const operationTypeOptions = [
        { value: 'LASER', label: 'ليزر - Laser' },
        { value: 'SHATAF', label: 'شطف - Shataf' },
        { value: 'FARMA', label: 'فارمة - Farma' }
    ];

    // Unit options
    const unitOptions = [
        { value: 'per piece', label: 'للقطعة' },
        { value: 'per meter', label: 'للمتر' },
        { value: 'per cm', label: 'للسنتيمتر' },
        { value: 'per m²', label: 'للمتر المربع' }
    ];

    // Load operation prices on component mount
    useEffect(() => {
        loadOperationPrices();
    }, []);

    const loadOperationPrices = async () => {
        try {
            setLoading(true);
            const data = await operationPriceService.getAllOperationPrices();
            setOperationPrices(data);
        } catch (error) {
            console.error('Error loading operation prices:', error);
        } finally {
            setLoading(false);
        }
    };

    // Initialize default prices
    const handleInitializeDefaults = async () => {
        if (!window.confirm('هل أنت متأكد من إضافة الأسعار الافتراضية؟ سيتم تخطي الأسعار الموجودة بالفعل.')) return;

        try {
            await operationPriceService.initializeDefaultPrices();
            await loadOperationPrices();
            alert('تم تهيئة الأسعار الافتراضية بنجاح');
        } catch (error) {
            console.error('Error initializing default prices:', error);
            alert('حدث خطأ أثناء تهيئة الأسعار الافتراضية');
        }
    };

    // Filter and search operation prices
    const filteredOperationPrices = operationPrices.filter(item => {
        const matchesSearch = !searchQuery ||
            item.arabicName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.englishName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.subtype?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesType = !filterType || item.operationType === filterType;

        return matchesSearch && matchesType;
    });

    // Validation function
    const validateForm = () => {
        const newErrors = {};

        if (!formData.operationType) {
            newErrors.operationType = 'نوع العملية مطلوب';
        }

        if (!formData.subtype.trim()) {
            newErrors.subtype = 'النوع الفرعي مطلوب';
        }

        if (!formData.arabicName.trim()) {
            newErrors.arabicName = 'الاسم بالعربية مطلوب';
        }

        if (!formData.basePrice || isNaN(formData.basePrice) || parseFloat(formData.basePrice) < 0) {
            newErrors.basePrice = 'السعر يجب أن يكون رقم موجب أو صفر';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            const operationPriceData = {
                operationType: formData.operationType,
                subtype: formData.subtype.toUpperCase().trim(),
                arabicName: formData.arabicName.trim(),
                englishName: formData.englishName?.trim() || null,
                basePrice: parseFloat(formData.basePrice),
                unit: formData.unit || 'per piece',
                description: formData.description?.trim() || null,
                active: formData.active !== false
            };

            console.log('Sending data to backend:', operationPriceData);

            if (editingItem) {
                await operationPriceService.updateOperationPrice(editingItem.id, operationPriceData);
            } else {
                await operationPriceService.createOperationPrice(operationPriceData);
            }

            await loadOperationPrices();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving operation price:', error);
            const errorMessage = error.response?.data || error.message || 'حدث خطأ أثناء الحفظ';
            alert(errorMessage);
        }
    };

    // Handle toggle active status
    const handleToggleActive = async (id) => {
        try {
            await operationPriceService.toggleActiveStatus(id);
            await loadOperationPrices();
        } catch (error) {
            console.error('Error toggling active status:', error);
        }
    };

    // Handle delete
    const handleDelete = async (id) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا السعر؟')) return;

        try {
            await operationPriceService.deleteOperationPrice(id);
            await loadOperationPrices();
        } catch (error) {
            console.error('Error deleting operation price:', error);
            alert('حدث خطأ أثناء الحذف');
        }
    };

    // Modal handlers
    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                operationType: item.operationType || 'LASER',
                subtype: item.subtype || '',
                arabicName: item.arabicName || '',
                englishName: item.englishName || '',
                basePrice: item.basePrice?.toString() || '',
                unit: item.unit || 'per piece',
                description: item.description || '',
                active: item.active !== false
            });
        } else {
            setEditingItem(null);
            setFormData({
                operationType: 'LASER',
                subtype: '',
                arabicName: '',
                englishName: '',
                basePrice: '',
                unit: 'per piece',
                description: '',
                active: true
            });
        }
        setErrors({});
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({
            operationType: 'LASER',
            subtype: '',
            arabicName: '',
            englishName: '',
            basePrice: '',
            unit: 'per piece',
            description: '',
            active: true
        });
        setErrors({});
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Get operation type badge color
    const getOperationTypeBadge = (type) => {
        const badges = {
            LASER: { color: 'blue', label: 'ليزر' },
            SHATAF: { color: 'green', label: 'شطف' },
            FARMA: { color: 'purple', label: 'فارمة' }
        };
        const badge = badges[type] || { color: 'gray', label: type };
        return (
            <Badge variant={badge.color} size="sm">
                {badge.label}
            </Badge>
        );
    };

    // Table columns configuration
    const columns = [
        {
            key: 'operationType',
            header: 'نوع العملية',
            align: 'center',
            render: (value) => getOperationTypeBadge(value)
        },
        {
            key: 'subtype',
            header: 'النوع الفرعي',
            align: 'center',
            render: (value) => (
                <Badge variant="outline" size="sm">
                    {value}
                </Badge>
            )
        },
        {
            key: 'arabicName',
            header: 'الاسم بالعربية',
            render: (value) => (
                <div className="font-medium text-gray-900 dark:text-white">{value}</div>
            )
        },
        {
            key: 'englishName',
            header: 'الاسم بالإنجليزية',
            render: (value) => value || '-'
        },
        {
            key: 'basePrice',
            header: 'السعر',
            align: 'center',
            render: (value, row) => (
                <div className="text-center">
                    <div className="font-medium text-green-600 dark:text-green-400">
                        {value?.toFixed(2)} ج.م
                    </div>
                    {row.unit && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {row.unit === 'per piece' && 'للقطعة'}
                            {row.unit === 'per meter' && 'للمتر'}
                            {row.unit === 'per cm' && 'للسنتيمتر'}
                            {row.unit === 'per m²' && 'للمتر المربع'}
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'active',
            header: 'الحالة',
            align: 'center',
            render: (value, row) => (
                <div className="flex items-center justify-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={value}
                            onChange={() => handleToggleActive(row.id)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                </div>
            )
        },
        {
            key: 'actions',
            header: 'الإجراءات',
            align: 'center',
            sortable: false,
            render: (_, row) => (
                <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenModal(row)}
                        className="text-blue-600 hover:text-blue-800"
                        title="تعديل"
                    >
                        <Icon name="edit" size="sm" />
                    </Button>

                    {user?.role === 'OWNER' && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(row.id)}
                            className="text-red-600 hover:text-red-800"
                            title="حذف"
                        >
                            <Icon name="delete" size="sm" />
                        </Button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <PageHeader
                title="إدارة أسعار العمليات"
                subtitle="إدارة أسعار عمليات الليزر والشطف والفارمة"
                breadcrumbs={[
                    { label: 'الرئيسية', href: '/' },
                    { label: 'أسعار العمليات' }
                ]}
                actions={
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        {user?.role === 'OWNER' && (
                            <Button
                                variant="outline"
                                onClick={handleInitializeDefaults}
                                className="flex items-center space-x-2 rtl:space-x-reverse"
                            >
                                <Icon name="refresh" size="sm" />
                                <span>تهيئة الأسعار الافتراضية</span>
                            </Button>
                        )}
                        <Button
                            variant="primary"
                            onClick={() => handleOpenModal()}
                            className="flex items-center space-x-2 rtl:space-x-reverse"
                        >
                            <Icon name="add" size="sm" />
                            <span>إضافة سعر جديد</span>
                        </Button>
                    </div>
                }
            />

            {/* Filters and Search */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="البحث في الأسعار..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <div className="w-full md:w-64">
                        <Select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full"
                        >
                            <option value="">كل الأنواع</option>
                            {operationTypeOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </Select>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <DataTable
                data={filteredOperationPrices}
                columns={columns}
                loading={loading}
                emptyMessage="لا توجد أسعار عمليات"
                loadingMessage="جاري تحميل أسعار العمليات..."
            />

            {/* Modal for Add/Edit */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingItem ? 'تعديل سعر العملية' : 'إضافة سعر عملية جديد'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        {/* Operation Type */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    نوع العملية *
                                </label>
                                <Select
                                    name="operationType"
                                    value={formData.operationType}
                                    onChange={handleInputChange}
                                    className="w-full"
                                    required
                                >
                                    {operationTypeOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </Select>
                                {errors.operationType && (
                                    <p className="mt-1 text-sm text-red-600">{errors.operationType}</p>
                                )}
                            </div>

                            <Input
                                label="النوع الفرعي *"
                                name="subtype"
                                value={formData.subtype}
                                onChange={handleInputChange}
                                error={!!errors.subtype}
                                helperText={errors.subtype}
                                required
                                placeholder="NORMAL, DEEP, ENGRAVE..."
                            />
                        </div>

                        {/* Arabic and English Names */}
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="الاسم بالعربية *"
                                name="arabicName"
                                value={formData.arabicName}
                                onChange={handleInputChange}
                                error={!!errors.arabicName}
                                helperText={errors.arabicName}
                                required
                                placeholder="ليزر عادي"
                            />

                            <Input
                                label="الاسم بالإنجليزية"
                                name="englishName"
                                value={formData.englishName}
                                onChange={handleInputChange}
                                placeholder="Normal Laser"
                            />
                        </div>

                        {/* Price and Unit */}
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="السعر (ج.م) *"
                                name="basePrice"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.basePrice}
                                onChange={handleInputChange}
                                error={!!errors.basePrice}
                                helperText={errors.basePrice}
                                required
                                placeholder="50.00"
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    الوحدة
                                </label>
                                <Select
                                    name="unit"
                                    value={formData.unit}
                                    onChange={handleInputChange}
                                    className="w-full"
                                >
                                    {unitOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                الوصف
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                placeholder="وصف العملية..."
                            />
                        </div>

                        {/* Active Toggle */}
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                name="active"
                                checked={formData.active}
                                onChange={handleInputChange}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label className="ms-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                فعّال
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-4 border-t dark:border-gray-700">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCloseModal}
                        >
                            إلغاء
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                        >
                            {editingItem ? 'تحديث' : 'إضافة'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default OperationPricesPage;
