// src/pages/GlassTypesPage.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGlassTypes, useCreateGlassType, useUpdateGlassType, useDeleteGlassType } from '@services/glassTypeService';
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

    // Convex reactive query - returns undefined while loading, then array
    const glassTypes = useGlassTypes();
    const loading = glassTypes === undefined;

    // Convex mutations
    const createGlassType = useCreateGlassType();
    const updateGlassType = useUpdateGlassType();
    const deleteGlassType = useDeleteGlassType();

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

    // Filter and search glass types
    const filteredGlassTypes = (glassTypes || []).filter(item => {
        const matchesSearch = !searchQuery ||
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.color?.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesSearch;
    });

    // Validation function matching backend validation
    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = t('glassTypes.validation.nameRequired');
        }

        if (!formData.thickness || isNaN(formData.thickness) || parseFloat(formData.thickness) <= 0) {
            newErrors.thickness = t('glassTypes.validation.thicknessRequired');
        }

        if (!formData.pricePerMeter || isNaN(formData.pricePerMeter) || parseFloat(formData.pricePerMeter) <= 0) {
            newErrors.pricePerMeter = t('glassTypes.validation.priceRequired');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            const glassTypeData = {
                name: formData.name,
                thickness: parseFloat(formData.thickness),
                color: formData.color || undefined,
                pricePerMeter: parseFloat(formData.pricePerMeter)
            };

            if (editingItem) {
                await updateGlassType({
                    glassTypeId: editingItem._id,
                    ...glassTypeData
                });
            } else {
                await createGlassType(glassTypeData);
            }

            handleCloseModal();
        } catch (error) {
            console.error('Error saving glass type:', error);
        }
    };

    // Handle delete
    const handleDelete = async (id) => {
        if (!window.confirm(t('glassTypes.deleteConfirm'))) return;

        try {
            await deleteGlassType({ glassTypeId: id });
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

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Table columns configuration
    const columns = [
        {
            key: 'name',
            header: t('glassTypes.fields.name'),
            render: (value) => (
                <div className="font-medium text-gray-900 dark:text-white">{value}</div>
            )
        },
        {
            key: 'thickness',
            header: t('glassTypes.fields.thickness'),
            align: 'center',
            render: (value) => (
                <Badge variant="outline" size="sm">
                    {value} {t('common.millimeter')}
                </Badge>
            )
        },
        {
            key: 'color',
            header: t('glassTypes.fields.color'),
            align: 'center',
            render: (value) => value || '-'
        },
        {
            key: 'pricePerMeter',
            header: t('glassTypes.fields.priceColumn'),
            align: 'center',
            render: (value) => (
                <span className="font-medium text-green-600 dark:text-green-400">
                    {value?.toFixed(2)} {t('common.currency')}
                </span>
            )
        },
        {
            key: 'actions',
            header: t('glassTypes.fields.actions'),
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
                title={t('glassTypes.title')}
                subtitle={t('glassTypes.subtitle')}
                breadcrumbs={[
                    { label: t('navigation.home'), href: '/' },
                    { label: t('glassTypes.title') }
                ]}
                actions={
                    <Button
                        variant="primary"
                        onClick={() => handleOpenModal()}
                        className="flex items-center space-x-2 rtl:space-x-reverse"
                    >
                        <Icon name="add" size="sm" />
                        <span>{t('glassTypes.addNew')}</span>
                    </Button>
                }
            />

            {/* Search */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex-1">
                    <Input
                        placeholder={t('glassTypes.searchPlaceholder')}
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
                emptyMessage={t('glassTypes.noTypes')}
                loadingMessage={t('glassTypes.loadingTypes')}
            />

            {/* Modal for Add/Edit */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingItem ? t('glassTypes.editType') : t('glassTypes.addNewType')}
                size="md"
                footer={(
                    <div className="flex justify-end space-x-3 rtl:space-x-reverse w-full">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCloseModal}
                        >
                            {t('actions.cancel')}
                        </Button>
                        <Button
                            form="glass-type-form"
                            type="submit"
                            variant="primary"
                        >
                            {editingItem ? t('actions.update') : t('actions.add')}
                        </Button>
                    </div>
                )}
            >
                <form id="glass-type-form" onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <Input
                            label={t('glassTypes.fields.name')}
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            error={!!errors.name}
                            helperText={errors.name}
                            required
                            placeholder={t('glassTypes.placeholders.name')}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label={t('glassTypes.fields.thickness')}
                                name="thickness"
                                type="number"
                                step="0.1"
                                min="0.1"
                                value={formData.thickness}
                                onChange={handleInputChange}
                                error={!!errors.thickness}
                                helperText={errors.thickness}
                                required
                                placeholder={t('glassTypes.placeholders.thickness')}
                            />

                            <Input
                                label={t('glassTypes.fields.pricePerMeter')}
                                name="pricePerMeter"
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={formData.pricePerMeter}
                                onChange={handleInputChange}
                                error={!!errors.pricePerMeter}
                                helperText={errors.pricePerMeter}
                                required
                                placeholder={t('glassTypes.placeholders.price')}
                            />
                        </div>

                        <Input
                            label={t('glassTypes.fields.colorOptional')}
                            name="color"
                            value={formData.color}
                            onChange={handleInputChange}
                            placeholder={t('glassTypes.placeholders.color')}
                        />
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default GlassTypesPage;
