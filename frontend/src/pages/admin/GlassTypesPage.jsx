// src/pages/GlassTypesPage.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { glassTypeService } from '@services/glassTypeService.js';
import {
    Button,
    Input,
    Modal,
    DataTable,
    PageHeader,
    Badge,
    Icon
} from '@components';
import { useAuth } from '@contexts/AuthContext.jsx';

const GlassTypesPage = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [glassTypes, setGlassTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Form data matching backend GlassType model exactly
    const [formData, setFormData] = useState({
        name: '',
        thickness: '',
        color: '',
        pricePerMeter: ''
    });

    const [errors, setErrors] = useState({});
    const [searchQuery, setSearchQuery] = useState('');

    // Load glass types on component mount
    useEffect(() => {
        loadGlassTypes();
    }, []);

    const loadGlassTypes = async () => {
        try {
            setLoading(true);
            const data = await glassTypeService.getAllGlassTypes();
            setGlassTypes(data);
        } catch (error) {
            console.error('Error loading glass types:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter and search glass types
    const filteredGlassTypes = glassTypes.filter(item => {
        const matchesSearch = !searchQuery ||
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.color?.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesSearch;
    });

    // Validation function matching backend validation
    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'اسم نوع الزجاج مطلوب';
        }

        if (!formData.thickness || isNaN(formData.thickness) || parseFloat(formData.thickness) <= 0) {
            newErrors.thickness = 'السماكة يجب أن تكون رقم موجب';
        }

        // Backend requires pricePerMeter > 0 (positive)
        if (!formData.pricePerMeter || isNaN(formData.pricePerMeter) || parseFloat(formData.pricePerMeter) <= 0) {
            newErrors.pricePerMeter = 'السعر يجب أن يكون رقم موجب';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            // Create data object matching backend GlassType model
            const glassTypeData = {
                name: formData.name,
                thickness: parseFloat(formData.thickness),
                color: formData.color || null, // Optional field
                pricePerMeter: parseFloat(formData.pricePerMeter)
                // calculationMethod will be set to AREA by default in backend
            };

            console.log('Sending data to backend:', glassTypeData);

            if (editingItem) {
                await glassTypeService.updateGlassType(editingItem.id, glassTypeData);
            } else {
                await glassTypeService.createGlassType(glassTypeData);
            }

            await loadGlassTypes();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving glass type:', error);
            // You can add toast notification here
        }
    };

    // Handle delete
    const handleDelete = async (id) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا النوع؟')) return;

        try {
            await glassTypeService.deleteGlassType(id);
            await loadGlassTypes();
        } catch (error) {
            console.error('Error deleting glass type:', error);
        }
    };

    // Modal handlers
    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name || '',
                thickness: item.thickness?.toString() || '',
                color: item.color || '',
                pricePerMeter: item.pricePerMeter?.toString() || ''
            });
        } else {
            setEditingItem(null);
            setFormData({
                name: '',
                thickness: '',
                color: '',
                pricePerMeter: ''
            });
        }
        setErrors({});
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({
            name: '',
            thickness: '',
            color: '',
            pricePerMeter: ''
        });
        setErrors({});
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Table columns configuration
    const columns = [
        {
            key: 'name',
            header: 'اسم نوع الزجاج',
            render: (value) => (
                <div className="font-medium text-gray-900 dark:text-white">{value}</div>
            )
        },
        {
            key: 'thickness',
            header: 'السماكة (مم)',
            align: 'center',
            render: (value) => (
                <Badge variant="outline" size="sm">
                    {value} مم
                </Badge>
            )
        },
        {
            key: 'color',
            header: 'اللون',
            align: 'center',
            render: (value) => value || '-'
        },
        {
            key: 'pricePerMeter',
            header: 'السعر (م²)',
            align: 'center',
            render: (value) => (
                <span className="font-medium text-green-600 dark:text-green-400">
                    {value?.toFixed(2)} ج.م
                </span>
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
                title="إدارة أنواع الزجاج"
                subtitle="إدارة أنواع الزجاج والأسعار"
                breadcrumbs={[
                    { label: 'الرئيسية', href: '/' },
                    { label: 'أنواع الزجاج' }
                ]}
                actions={
                    <Button
                        variant="primary"
                        onClick={() => handleOpenModal()}
                        className="flex items-center space-x-2 rtl:space-x-reverse"
                    >
                        <Icon name="add" size="sm" />
                        <span>إضافة نوع جديد</span>
                    </Button>
                }
            />

            {/* Search */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex-1">
                    <Input
                        placeholder="البحث في أنواع الزجاج..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full max-w-md"
                    />
                </div>
            </div>

            {/* Data Table */}
            <DataTable
                data={filteredGlassTypes}
                columns={columns}
                loading={loading}
                emptyMessage="لا توجد أنواع زجاج"
                loadingMessage="جاري تحميل أنواع الزجاج..."
            />

            {/* Modal for Add/Edit */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingItem ? 'تعديل نوع الزجاج' : 'إضافة نوع زجاج جديد'}
                size="md"
                footer={(
                    <div className="flex justify-end space-x-3 rtl:space-x-reverse w-full">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCloseModal}
                        >
                            إلغاء
                        </Button>
                        <Button
                            form="glass-type-form"
                            type="submit"
                            variant="primary"
                        >
                            {editingItem ? 'تحديث' : 'إضافة'}
                        </Button>
                    </div>
                )}
            >
                <form id="glass-type-form" onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <Input
                            label="اسم نوع الزجاج"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            error={!!errors.name}
                            helperText={errors.name}
                            required
                            placeholder="مثال: زجاج شفاف"
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="السماكة (مم)"
                                name="thickness"
                                type="number"
                                step="0.1"
                                min="0.1"
                                value={formData.thickness}
                                onChange={handleInputChange}
                                error={!!errors.thickness}
                                helperText={errors.thickness}
                                required
                                placeholder="6.0"
                            />

                            <Input
                                label="السعر لكل متر مربع (ج.م) "
                                name="pricePerMeter"
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={formData.pricePerMeter}
                                onChange={handleInputChange}
                                error={!!errors.pricePerMeter}
                                helperText={errors.pricePerMeter}
                                required
                                placeholder="100.00"
                            />
                        </div>

                        <Input
                            label="اللون (اختياري)"
                            name="color"
                            value={formData.color}
                            onChange={handleInputChange}
                            placeholder="شفاف، أزرق، أخضر..."
                        />
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default GlassTypesPage;