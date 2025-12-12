import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiSave, FiUpload, FiImage, FiMinus, FiPlus } from 'react-icons/fi';
import { useSnackbar } from '@/contexts/SnackbarContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { companyProfileService } from '@/services/companyProfileService';

const CompanyProfilePage = () => {
    const { t } = useTranslation();
    const { showSuccess, showError } = useSnackbar();
    const [loading, setLoading] = useState(true);
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

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const data = await companyProfileService.getProfile();
            if (data) {
                setProfile(prev => ({ ...prev, ...data }));
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            showError(t('errors.fetchFailed', 'فشل تحميل البيانات'));
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const data = await companyProfileService.updateProfile(profile);
            setProfile(prev => ({ ...prev, ...data }));
            showSuccess(t('success.saved', 'تم الحفظ بنجاح'));
        } catch (error) {
            console.error('Error saving profile:', error);
            showError(t('errors.saveFailed', 'فشل الحفظ'));
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showError(t('errors.invalidImage', 'يجب اختيار ملف صورة صالح'));
            return;
        }

        // Validate file size (e.g., max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showError(t('errors.imageTooLarge', 'حجم الصورة يجب أن يكون أقل من 2 ميجابايت'));
            return;
        }

        try {
            setUploading(true);
            const data = await companyProfileService.uploadLogo(file);
            setProfile(prev => ({ ...prev, logoUrl: data.logoUrl }));
            showSuccess(t('success.logoUploaded', 'تم رفع الشعار بنجاح'));
        } catch (error) {
            console.error('Error uploading logo:', error);
            showError(t('errors.uploadFailed', 'فشل رفع الشعار'));
        } finally {
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
                        {t('companyProfile.title', 'ملف الشركة')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {t('companyProfile.subtitle', 'إدارة بيانات الشركة والشعار للفواتير')}
                    </p>
                </div>
                <Button
                    onClick={handleSubmit}
                    disabled={saving}
                    isLoading={saving}
                    className="flex items-center gap-2"
                >
                    <FiSave />
                    {t('actions.save', 'حفظ التغييرات')}
                </Button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info Form */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <h2 className="text-lg font-semibold mb-4 border-b pb-2">
                                {t('companyProfile.basicInfo', 'البيانات الأساسية')}
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label={t('companyProfile.companyName', 'اسم الشركة (English)')}
                                    name="companyName"
                                    value={profile.companyName}
                                    onChange={handleChange}
                                    required
                                />
                                <Input
                                    label={t('companyProfile.companyNameArabic', 'اسم الشركة (عربي)')}
                                    name="companyNameArabic"
                                    value={profile.companyNameArabic}
                                    onChange={handleChange}
                                />
                            </div>

                            <Input
                                label={t('companyProfile.address', 'العنوان')}
                                name="address"
                                value={profile.address}
                                onChange={handleChange}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label={t('companyProfile.phone', 'رقم الهاتف')}
                                    name="phone"
                                    value={profile.phone}
                                    onChange={handleChange}
                                />
                                <Input
                                    label={t('companyProfile.email', 'البريد الإلكتروني')}
                                    name="email"
                                    type="email"
                                    value={profile.email}
                                    onChange={handleChange}
                                />
                            </div>

                            <h2 className="text-lg font-semibold mb-4 border-b pb-2 pt-4">
                                {t('companyProfile.legalInfo', 'البيانات القانونية')}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label={t('companyProfile.taxId', 'الرقم الضريبي')}
                                    name="taxId"
                                    value={profile.taxId}
                                    onChange={handleChange}
                                />
                                <Input
                                    label={t('companyProfile.commercialRegister', 'السجل التجاري')}
                                    name="commercialRegister"
                                    value={profile.commercialRegister}
                                    onChange={handleChange}
                                />
                            </div>

                            <h2 className="text-lg font-semibold mb-4 border-b pb-2 pt-4">
                                {t('companyProfile.footer', 'تذييل الفاتورة')}
                            </h2>
                            <Input
                                label={t('companyProfile.footerText', 'نص التذييل')}
                                name="footerText"
                                value={profile.footerText}
                                onChange={handleChange}
                                placeholder="Text to appear at the bottom of the invoice"
                            />
                        </form>
                    </Card>
                </div>

                {/* Logo Upload Section */}
                <div className="lg:col-span-1">
                    <Card className="h-full">
                        <h2 className="text-lg font-semibold mb-4 border-b pb-2">
                            {t('companyProfile.logo', 'شعار الشركة')}
                        </h2>

                        <div className="flex flex-col items-center justify-center space-y-4 py-6">
                            <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 overflow-hidden group">
                                {profile.logoUrl ? (
                                    <img
                                        src={profile.logoUrl}
                                        alt="Company Logo"
                                        className="w-full h-full object-contain p-2"
                                    />
                                ) : (
                                    <div className="text-gray-400 flex flex-col items-center">
                                        <FiImage size={48} />
                                        <span className="mt-2 text-sm">No Logo</span>
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <p className="text-white font-medium">Click Upload below to change</p>
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
                                        {t('companyProfile.uploadLogo', 'رفع شعار جديد')}
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
                                    Supported formats: PNG, JPG, JPEG. Max size: 2MB.
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
