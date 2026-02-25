import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOperationPrices, useCreateOperationPrice, useUpdateOperationPrice, useDeleteOperationPrice } from '@services/operationPriceService';
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

    // Convex reactive query - returns undefined while loading, then array
    const operationPrices = useOperationPrices();
    const loading = operationPrices === undefined;

    // Convex mutations
    const createOperationPrice = useCreateOperationPrice();
    const updateOperationPrice = useUpdateOperationPrice();
    const deleteOperationPrice = useDeleteOperationPrice();

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
        { value: 'LASER', label: `${t('operationPrices.types.LASER')} - Laser` },
        { value: 'SHATAF', label: `${t('operationPrices.types.SHATAF')} - Beveling` },
        { value: 'FARMA', label: `${t('operationPrices.types.FARMA')} - Beveling Calculation` }
    ];

    // Unit options
    const unitOptions = [
        { value: 'per piece', label: t('operationPrices.units.perPiece') },
        { value: 'per meter', label: t('operationPrices.units.perMeter') },
        { value: 'per cm', label: t('operationPrices.units.perCm') },
        { value: 'per m\u00b2', label: t('operationPrices.units.perM2') }
    ];

    // Filter and search operation prices
    const filteredOperationPrices = (operationPrices || []).filter(item => {
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
            newErrors.operationType = t('operationPrices.typeRequired');
        }

        if (!formData.subtype.trim()) {
            newErrors.subtype = t('operationPrices.subtypeRequired');
        }

        if (!formData.arabicName.trim()) {
            newErrors.arabicName = t('operationPrices.arabicNameRequired');
        }

        if (!formData.basePrice || isNaN(formData.basePrice) || parseFloat(formData.basePrice) < 0) {
            newErrors.basePrice = t('operationPrices.priceRequired');
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
                englishName: formData.englishName?.trim() || undefined,
                basePrice: parseFloat(formData.basePrice),
                unit: formData.unit || 'per piece',
                description: formData.description?.trim() || undefined,
                active: formData.active !== false
            };

            if (editingItem) {
                await updateOperationPrice({
                    priceId: editingItem._id,
                    ...operationPriceData
                });
            } else {
                await createOperationPrice(operationPriceData);
            }

            // No manual reload needed - Convex auto-updates
            handleCloseModal();
        } catch (error) {
            console.error('Error saving operation price:', error);
            const errorMessage = error.message || t('operationPrices.saveError');
            alert(errorMessage);
        }
    };

    // Handle toggle active status
    const handleToggleActive = async (item) => {
        try {
            await updateOperationPrice({
                priceId: item._id,
                active: !item.active
            });
            // No manual reload needed
        } catch (error) {
            console.error('Error toggling active status:', error);
        }
    };

    // Handle delete
    const handleDelete = async (id) => {
        if (!window.confirm(t('operationPrices.deleteConfirm'))) return;

        try {
            await deleteOperationPrice({ priceId: id });
            // No manual reload needed
        } catch (error) {
            console.error('Error deleting operation price:', error);
            alert(t('operationPrices.deleteError'));
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
            LASER: { color: 'blue', label: t('operationPrices.laser') },
            SHATAF: { color: 'green', label: t('operationPrices.shataf') },
            FARMA: { color: 'purple', label: t('operationPrices.farma') }
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
            header: t('operationPrices.operationType'),
            align: 'center',
            render: (value) => getOperationTypeBadge(value)
        },
        {
            key: 'subtype',
            header: t('operationPrices.subtype'),
            align: 'center',
            render: (value) => (
                <Badge variant="outline" size="sm">
                    {value}
                </Badge>
            )
        },
        {
            key: 'arabicName',
            header: t('operationPrices.arabicName'),
            render: (value) => (
                <div className="font-medium text-gray-900 dark:text-white">{value}</div>
            )
        },
        {
            key: 'englishName',
            header: t('operationPrices.englishName'),
            render: (value) => value || '-'
        },
        {
            key: 'basePrice',
            header: t('operationPrices.price'),
            align: 'center',
            render: (value, row) => (
                <div className="text-center">
                    <div className="font-medium text-green-600 dark:text-green-400">
                        {value?.toFixed(2)} {t('common.currency')}
                    </div>
                    {row.unit && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {row.unit === 'per piece' && t('operationPrices.units.perPiece')}
                            {row.unit === 'per meter' && t('operationPrices.units.perMeter')}
                            {row.unit === 'per cm' && t('operationPrices.units.perCm')}
                            {row.unit === 'per m\u00b2' && t('operationPrices.units.perM2')}
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'active',
            header: t('operationPrices.statusLabel'),
            align: 'center',
            render: (value, row) => (
                <div className="flex items-center justify-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={value}
                            onChange={() => handleToggleActive(row)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                </div>
            )
        },
        {
            key: 'actions',
            header: t('operationPrices.actionsLabel'),
            align: 'center',
            sortable: false,
            render: (_, row) => (
                <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenModal(row)}
                        className="text-blue-600 hover:text-blue-800"
                        title={t('actions.edit')}
                    >
                        <Icon name="edit" size="sm" />
                    </Button>

                    {user?.role === 'OWNER' && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(row._id)}
                            className="text-red-600 hover:text-red-800"
                            title={t('actions.delete')}
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
                title={t('operationPrices.title')}
                subtitle={t('operationPrices.subtitle')}
                breadcrumbs={[
                    { label: t('navigation.home'), href: '/' },
                    { label: t('navigation.operationPrices') }
                ]}
                actions={
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Button
                            variant="primary"
                            onClick={() => handleOpenModal()}
                            className="flex items-center space-x-2 rtl:space-x-reverse"
                        >
                            <Icon name="add" size="sm" />
                            <span>{t('operationPrices.addNewPrice')}</span>
                        </Button>
                    </div>
                }
            />

            {/* Filters and Search */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder={t('operationPrices.searchPlaceholder')}
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
                            <option value="">{t('operationPrices.allTypes')}</option>
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
                emptyMessage={t('operationPrices.noOperationPrices')}
                loadingMessage={t('operationPrices.loadingPrices')}
            />

            {/* Modal for Add/Edit */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingItem ? t('operationPrices.editPrice') : t('operationPrices.addPrice')}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        {/* Operation Type */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('operationPrices.operationType')} *
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
                                label={`${t('operationPrices.subtype')} *`}
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
                                label={`${t('operationPrices.arabicName')} *`}
                                name="arabicName"
                                value={formData.arabicName}
                                onChange={handleInputChange}
                                error={!!errors.arabicName}
                                helperText={errors.arabicName}
                                required
                                placeholder={t('operationPrices.laser')}
                            />

                            <Input
                                label={t('operationPrices.englishName')}
                                name="englishName"
                                value={formData.englishName}
                                onChange={handleInputChange}
                                placeholder="Normal Laser"
                            />
                        </div>

                        {/* Price and Unit */}
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label={`${t('operationPrices.priceEGP')} *`}
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
                                    {t('operationPrices.unit')}
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
                                {t('operationPrices.description')}
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                placeholder={t('operationPrices.descriptionPlaceholder')}
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
                                {t('operationPrices.activeLabel')}
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-4 border-t dark:border-gray-700">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCloseModal}
                        >
                            {t('actions.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                        >
                            {editingItem ? t('actions.update') : t('actions.add')}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default OperationPricesPage;
