import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiSave, FiUpload, FiImage, FiMinus, FiPlus } from 'react-icons/fi';
import { useSnackbar } from '@/contexts/SnackbarContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useCompanyProfile, useUpsertCompanyProfile, useUploadLogo } from '@/services/companyProfileService';

const CompanyProfilePage = () => {
    const { t } = useTranslation();
    const { showSuccess, showError } = useSnackbar();

    // Convex reactive query
    const profileData = useCompanyProfile();
    const loading = profileData === undefined;

    // Convex mutations
    const upsertCompanyProfile = useUpsertCompanyProfile();
    const uploadLogo = useUploadLogo();

    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [profile, setProfile] = useState({
        companyName: '',
        companyNameArabic: '',
        address: '',
        phone: '',
        email: '',
        taxId: '',
        commercialRegister: '',
        footerText: '',
        logoUrl: ''
    });

    // Sync Convex data into local form state when it arrives or changes
    useEffect(() => {
        if (profileData) {
            setProfile(prev => ({
                ...prev,
                companyName: profileData.companyName || '',
                companyNameArabic: profileData.companyNameArabic || '',
                address: profileData.address || '',
                phone: profileData.phone || '',
                email: profileData.email || '',
                taxId: profileData.taxId || '',
                commercialRegister: profileData.commercialRegister || '',
                footerText: profileData.footerText || '',
                logoUrl: profileData.logoUrl || ''
            }));
        }
    }, [profileData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            await upsertCompanyProfile({
                companyName: profile.companyName,
                companyNameArabic: profile.companyNameArabic || undefined,
                address: profile.address || undefined,
                phone: profile.phone || undefined,
                email: profile.email || undefined,
                taxId: profile.taxId || undefined,
                commercialRegister: profile.commercialRegister || undefined,
                footerText: profile.footerText || undefined,
                logoUrl: profile.logoUrl || undefined
            });
            // No manual refetch needed - Convex auto-updates
            showSuccess(t('companyProfile.savedSuccess'));
        } catch (error) {
            console.error('Error saving profile:', error);
            showError(t('companyProfile.saveError'));
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showError(t('companyProfile.invalidImage'));
            return;
        }

        // Validate file size (e.g., max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showError(t('companyProfile.imageTooLarge'));
            return;
        }

        try {
            setUploading(true);

            // Convert file to base64 and store directly via upsertCompanyProfile
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const base64Data = event.target.result;
                    // Store the base64 data URL directly as logoUrl
                    await upsertCompanyProfile({
                        companyName: profile.companyName || 'Company',
                        logoUrl: base64Data
                    });
                    // The reactive query will auto-update the profile with the new logoUrl
                    showSuccess(t('companyProfile.logoUploaded'));
                } catch (uploadError) {
                    console.error('Error uploading logo:', uploadError);
                    showError(t('companyProfile.uploadError'));
                } finally {
                    setUploading(false);
                }
            };
            reader.onerror = () => {
                showError(t('companyProfile.uploadError'));
                setUploading(false);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error uploading logo:', error);
            showError(t('companyProfile.uploadError'));
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {t('companyProfile.title')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {t('companyProfile.subtitle')}
                    </p>
                </div>
                <Button
                    onClick={handleSubmit}
                    disabled={saving}
                    isLoading={saving}
                    className="flex items-center gap-2"
                >
                    <FiSave />
                    {t('actions.save')}
                </Button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info Form */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <h2 className="text-lg font-semibold mb-4 border-b pb-2">
                                {t('companyProfile.basicInfo')}
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label={t('companyProfile.fields.companyName')}
                                    name="companyName"
                                    value={profile.companyName}
                                    onChange={handleChange}
                                    required
                                />
                                <Input
                                    label={t('companyProfile.fields.companyNameArabic')}
                                    name="companyNameArabic"
                                    value={profile.companyNameArabic}
                                    onChange={handleChange}
                                />
                            </div>

                            <Input
                                label={t('companyProfile.fields.address')}
                                name="address"
                                value={profile.address}
                                onChange={handleChange}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label={t('companyProfile.fields.phone')}
                                    name="phone"
                                    value={profile.phone}
                                    onChange={handleChange}
                                />
                                <Input
                                    label={t('companyProfile.fields.email')}
                                    name="email"
                                    type="email"
                                    value={profile.email}
                                    onChange={handleChange}
                                />
                            </div>

                            <h2 className="text-lg font-semibold mb-4 border-b pb-2 pt-4">
                                {t('companyProfile.legalInfo')}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label={t('companyProfile.fields.taxId')}
                                    name="taxId"
                                    value={profile.taxId}
                                    onChange={handleChange}
                                />
                                <Input
                                    label={t('companyProfile.fields.commercialRegister')}
                                    name="commercialRegister"
                                    value={profile.commercialRegister}
                                    onChange={handleChange}
                                />
                            </div>

                            <h2 className="text-lg font-semibold mb-4 border-b pb-2 pt-4">
                                {t('companyProfile.invoiceFooter')}
                            </h2>
                            <Input
                                label={t('companyProfile.fields.footerText')}
                                name="footerText"
                                value={profile.footerText}
                                onChange={handleChange}
                                placeholder={t('companyProfile.footerPlaceholder')}
                            />
                        </form>
                    </Card>
                </div>

                {/* Logo Upload Section */}
                <div className="lg:col-span-1">
                    <Card className="h-full">
                        <h2 className="text-lg font-semibold mb-4 border-b pb-2">
                            {t('companyProfile.fields.logo')}
                        </h2>

                        <div className="flex flex-col items-center justify-center space-y-4 py-6">
                            <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 overflow-hidden group">
                                {profile.logoUrl ? (
                                    <img
                                        src={profile.logoUrl}
                                        alt={t('companyProfile.fields.logo')}
                                        className="w-full h-full object-contain p-2"
                                    />
                                ) : (
                                    <div className="text-gray-400 flex flex-col items-center">
                                        <FiImage size={48} />
                                        <span className="mt-2 text-sm">{t('companyProfile.noLogo')}</span>
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <p className="text-white font-medium">{t('companyProfile.clickToChange')}</p>
                                </div>
                            </div>

                            <div className="w-full">
                                <label className="flex flex-col items-center justify-center w-full">
                                    <Button
                                        type="button"
                                        disabled={uploading}
                                        className="w-full flex justify-center items-center gap-2"
                                        onClick={() => document.getElementById('logo-upload').click()}
                                    >
                                        {uploading ? <LoadingSpinner size="sm" /> : <FiUpload />}
                                        {t('companyProfile.uploadLogo')}
                                    </Button>
                                    <input
                                        id="logo-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleLogoUpload}
                                    />
                                </label>
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                    {t('companyProfile.supportedFormats')}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CompanyProfilePage;
